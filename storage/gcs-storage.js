const BaseStorage = require('./base-storage');

/**
 * Google Cloud Storage
 * Implementation for storing collections in Google Cloud Storage
 */
class GCSStorage extends BaseStorage {
  constructor(options = {}) {
    super(options);
    
    // GCS configuration
    this.bucketName = options.bucketName;
    this.projectId = options.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID;
    this.keyFilename = options.keyFilename || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    this.prefix = options.prefix || 'openapi-specs/';
    
    // Ensure prefix ends with /
    if (this.prefix && !this.prefix.endsWith('/')) {
      this.prefix += '/';
    }
    
    this.storage = null;
    this.bucket = null;
    this.initialized = false;
  }

  /**
   * Initialize Google Cloud Storage client
   */
  async initialize() {
    if (this.initialized) return;
    
    if (!this.bucketName) {
      throw new Error('GCS bucket name is required');
    }

    try {
      // Dynamically import Google Cloud Storage SDK
      const { Storage } = await import('@google-cloud/storage');
      
      const storageOptions = {};
      if (this.projectId) storageOptions.projectId = this.projectId;
      if (this.keyFilename) storageOptions.keyFilename = this.keyFilename;
      
      this.storage = new Storage(storageOptions);
      this.bucket = this.storage.bucket(this.bucketName);
      
      // Test bucket access
      const [exists] = await this.bucket.exists();
      if (!exists) {
        throw new Error(`GCS bucket does not exist: ${this.bucketName}`);
      }
      
      this.initialized = true;
      
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('Google Cloud Storage SDK is required for GCS storage. Install with: npm install @google-cloud/storage');
      }
      throw new Error(`Failed to initialize GCS storage: ${error.message}`);
    }
  }

  /**
   * Get full GCS object name for a file path
   */
  _getObjectName(filePath) {
    return `${this.prefix}${filePath}`;
  }

  /**
   * Check if a file exists
   */
  async exists(filePath) {
    await this.initialize();
    
    try {
      const file = this.bucket.file(this._getObjectName(filePath));
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Read file content
   */
  async readFile(filePath) {
    await this.initialize();
    
    try {
      const file = this.bucket.file(this._getObjectName(filePath));
      const [content] = await file.download();
      return content.toString('utf8');
      
    } catch (error) {
      if (error.code === 404) {
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
    
    const file = this.bucket.file(this._getObjectName(filePath));
    await file.save(content, {
      metadata: {
        contentType: filePath.endsWith('.json') ? 'application/json' : 'text/plain'
      }
    });
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath) {
    await this.initialize();
    
    const file = this.bucket.file(this._getObjectName(filePath));
    await file.delete({ ignoreNotFound: true });
  }

  /**
   * List files in a directory
   */
  async listFiles(dirPath = '') {
    await this.initialize();
    
    const prefix = this._getObjectName(dirPath);
    const files = [];
    
    try {
      const [gcsFiles] = await this.bucket.getFiles({
        prefix: prefix,
        delimiter: '/'
      });
      
      for (const file of gcsFiles) {
        // Remove the base prefix to get relative path
        const relativePath = file.name.replace(this.prefix, '');
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
   * Create a directory (no-op for GCS, directories are implicit)
   */
  async createDirectory(dirPath) {
    // GCS doesn't have explicit directories, they're created implicitly
    // when objects with the path prefix are created
    return Promise.resolve();
  }

  /**
   * Copy a file
   */
  async copyFile(sourcePath, destinationPath) {
    await this.initialize();
    
    const sourceFile = this.bucket.file(this._getObjectName(sourcePath));
    const destFile = this.bucket.file(this._getObjectName(destinationPath));
    
    await sourceFile.copy(destFile);
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath) {
    await this.initialize();
    
    try {
      const file = this.bucket.file(this._getObjectName(filePath));
      const [metadata] = await file.getMetadata();
      
      return {
        size: parseInt(metadata.size),
        lastModified: new Date(metadata.updated),
        created: new Date(metadata.timeCreated),
        etag: metadata.etag,
        contentType: metadata.contentType,
        isDirectory: false,
        isFile: true
      };
      
    } catch (error) {
      if (error.code === 404) {
        throw new Error(`File not found: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Get storage type
   */
  getType() {
    return 'gcs';
  }

  /**
   * Get GCS URL for a file
   */
  getUrl(filePath) {
    return `gs://${this.bucketName}/${this._getObjectName(filePath)}`;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    // GCS SDK handles cleanup automatically
    this.initialized = false;
  }
}

module.exports = GCSStorage;
