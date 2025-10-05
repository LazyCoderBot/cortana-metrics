const BaseStorage = require('./base-storage');

/**
 * AWS S3 Storage
 * Implementation for storing collections in AWS S3
 */
class S3Storage extends BaseStorage {
  constructor(options = {}) {
    super(options);
    
    // S3 configuration
    this.bucket = options.bucket;
    this.region = options.region || 'us-east-1';
    this.accessKeyId = options.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = options.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
    this.prefix = options.prefix || 'openapi-specs/';
    
    // Ensure prefix ends with /
    if (this.prefix && !this.prefix.endsWith('/')) {
      this.prefix += '/';
    }
    
    this.s3Client = null;
    this.initialized = false;
  }

  /**
   * Initialize S3 client
   */
  async initialize() {
    if (this.initialized) return;
    
    if (!this.bucket) {
      throw new Error('S3 bucket name is required');
    }

    try {
      // Dynamically import AWS SDK v3
      const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3');
      
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey
        }
      });

      // Test bucket access
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.initialized = true;
      
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('AWS SDK v3 is required for S3 storage. Install with: npm install @aws-sdk/client-s3');
      }
      throw new Error(`Failed to initialize S3 storage: ${error.message}`);
    }
  }

  /**
   * Get full S3 key for a file path
   */
  _getS3Key(filePath) {
    return `${this.prefix}${filePath}`;
  }

  /**
   * Check if a file exists
   */
  async exists(filePath) {
    await this.initialize();
    
    try {
      const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this._getS3Key(filePath)
      }));
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
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
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const response = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: this._getS3Key(filePath)
      }));
      
      // Convert stream to string
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks).toString('utf8');
      
    } catch (error) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
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
    
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: this._getS3Key(filePath),
      Body: content,
      ContentType: filePath.endsWith('.json') ? 'application/json' : 'text/plain'
    }));
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath) {
    await this.initialize();
    
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: this._getS3Key(filePath)
    }));
  }

  /**
   * List files in a directory
   */
  async listFiles(dirPath = '') {
    await this.initialize();
    
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    const prefix = this._getS3Key(dirPath);
    
    try {
      const response = await this.s3Client.send(new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        Delimiter: '/'
      }));
      
      const files = [];
      
      // Add files
      if (response.Contents) {
        for (const object of response.Contents) {
          // Remove the base prefix to get relative path
          const relativePath = object.Key.replace(this.prefix, '');
          if (relativePath && relativePath !== dirPath) {
            files.push(relativePath);
          }
        }
      }
      
      // Add directories (common prefixes)
      if (response.CommonPrefixes) {
        for (const commonPrefix of response.CommonPrefixes) {
          const relativePath = commonPrefix.Prefix.replace(this.prefix, '');
          if (relativePath && relativePath !== dirPath) {
            files.push(relativePath);
          }
        }
      }
      
      return files;
      
    } catch (error) {
      if (error.name === 'NoSuchBucket') {
        throw new Error(`S3 bucket not found: ${this.bucket}`);
      }
      throw error;
    }
  }

  /**
   * Create a directory (no-op for S3, directories are implicit)
   */
  async createDirectory(dirPath) {
    // S3 doesn't have explicit directories, they're created implicitly
    // when objects with the path prefix are created
    return Promise.resolve();
  }

  /**
   * Copy a file
   */
  async copyFile(sourcePath, destinationPath) {
    await this.initialize();
    
    const { CopyObjectCommand } = await import('@aws-sdk/client-s3');
    await this.s3Client.send(new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${this._getS3Key(sourcePath)}`,
      Key: this._getS3Key(destinationPath)
    }));
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath) {
    await this.initialize();
    
    try {
      const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
      const response = await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this._getS3Key(filePath)
      }));
      
      return {
        size: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag,
        contentType: response.ContentType,
        isDirectory: false,
        isFile: true
      };
      
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        throw new Error(`File not found: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Get storage type
   */
  getType() {
    return 's3';
  }

  /**
   * Get S3 URL for a file
   */
  getUrl(filePath) {
    return `s3://${this.bucket}/${this._getS3Key(filePath)}`;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.s3Client && this.s3Client.destroy) {
      this.s3Client.destroy();
    }
    this.initialized = false;
  }
}

module.exports = S3Storage;
