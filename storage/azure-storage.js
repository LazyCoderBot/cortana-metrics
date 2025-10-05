const BaseStorage = require('./base-storage');

/**
 * Azure Blob Storage
 * Implementation for storing collections in Azure Blob Storage
 */
class AzureStorage extends BaseStorage {
  constructor(options = {}) {
    super(options);
    
    // Azure configuration
    this.connectionString = options.connectionString || process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.accountName = options.accountName || process.env.AZURE_STORAGE_ACCOUNT_NAME;
    this.accountKey = options.accountKey || process.env.AZURE_STORAGE_ACCOUNT_KEY;
    this.containerName = options.containerName || 'openapi-specs';
    this.prefix = options.prefix || '';
    
    // Ensure prefix ends with / if not empty
    if (this.prefix && !this.prefix.endsWith('/')) {
      this.prefix += '/';
    }
    
    this.blobServiceClient = null;
    this.containerClient = null;
    this.initialized = false;
  }

  /**
   * Initialize Azure Blob Storage client
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Dynamically import Azure SDK
      const { BlobServiceClient } = await import('@azure/storage-blob');
      
      if (this.connectionString) {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
      } else if (this.accountName && this.accountKey) {
        const { StorageSharedKeyCredential } = await import('@azure/storage-blob');
        const credential = new StorageSharedKeyCredential(this.accountName, this.accountKey);
        this.blobServiceClient = new BlobServiceClient(
          `https://${this.accountName}.blob.core.windows.net`,
          credential
        );
      } else {
        throw new Error('Azure connection string or account credentials are required');
      }

      this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      
      // Create container if it doesn't exist
      await this.containerClient.createIfNotExists({
        access: 'private'
      });
      
      this.initialized = true;
      
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('Azure Storage SDK is required for Azure storage. Install with: npm install @azure/storage-blob');
      }
      throw new Error(`Failed to initialize Azure storage: ${error.message}`);
    }
  }

  /**
   * Get full blob name for a file path
   */
  _getBlobName(filePath) {
    return `${this.prefix}${filePath}`;
  }

  /**
   * Check if a file exists
   */
  async exists(filePath) {
    await this.initialize();
    
    try {
      const blobClient = this.containerClient.getBlobClient(this._getBlobName(filePath));
      await blobClient.getProperties();
      return true;
    } catch (error) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Read file content
   */
  async readFile(filePath) {
    await this.initialize();
    
    try {
      const blobClient = this.containerClient.getBlobClient(this._getBlobName(filePath));
      const downloadResponse = await blobClient.download();
      
      // Convert stream to string
      const chunks = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks).toString('utf8');
      
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error(`File not found: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Write file content
   */
  async writeFile(filePath, content) {
    await this.initialize();
    
    const blobClient = this.containerClient.getBlockBlobClient(this._getBlobName(filePath));
    await blobClient.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: filePath.endsWith('.json') ? 'application/json' : 'text/plain'
      }
    });
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath) {
    await this.initialize();
    
    const blobClient = this.containerClient.getBlobClient(this._getBlobName(filePath));
    await blobClient.deleteIfExists();
  }

  /**
   * List files in a directory
   */
  async listFiles(dirPath = '') {
    await this.initialize();
    
    const prefix = this._getBlobName(dirPath);
    const files = [];
    
    try {
      const listBlobsOptions = {
        prefix: prefix
      };
      
      for await (const blob of this.containerClient.listBlobsFlat(listBlobsOptions)) {
        // Remove the base prefix to get relative path
        const relativePath = blob.name.replace(this.prefix, '');
        if (relativePath && relativePath !== dirPath) {
          files.push(relativePath);
        }
      }
      
      return files;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a directory (no-op for blob storage, directories are implicit)
   */
  async createDirectory(dirPath) {
    // Blob storage doesn't have explicit directories, they're created implicitly
    // when blobs with the path prefix are created
    return Promise.resolve();
  }

  /**
   * Copy a file
   */
  async copyFile(sourcePath, destinationPath) {
    await this.initialize();
    
    const sourceBlobClient = this.containerClient.getBlobClient(this._getBlobName(sourcePath));
    const destBlobClient = this.containerClient.getBlobClient(this._getBlobName(destinationPath));
    
    const copyOperation = await destBlobClient.beginCopyFromURL(sourceBlobClient.url);
    await copyOperation.pollUntilDone();
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath) {
    await this.initialize();
    
    try {
      const blobClient = this.containerClient.getBlobClient(this._getBlobName(filePath));
      const properties = await blobClient.getProperties();
      
      return {
        size: properties.contentLength,
        lastModified: properties.lastModified,
        etag: properties.etag,
        contentType: properties.contentType,
        isDirectory: false,
        isFile: true
      };
      
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error(`File not found: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Get storage type
   */
  getType() {
    return 'azure';
  }

  /**
   * Get Azure blob URL for a file
   */
  getUrl(filePath) {
    return `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${this._getBlobName(filePath)}`;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    // Azure SDK handles cleanup automatically
    this.initialized = false;
  }
}

module.exports = AzureStorage;
