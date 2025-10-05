const BaseStorage = require('./base-storage');
const LocalStorage = require('./local-storage');
const S3Storage = require('./s3-storage');
const AzureStorage = require('./azure-storage');
const GCSStorage = require('./gcs-storage');

/**
 * Storage Factory
 * Creates appropriate storage instance based on configuration
 */
class StorageFactory {
  /**
   * Create storage instance based on type
   * @param {string} type - Storage type ('local', 's3', 'azure', 'gcs')
   * @param {Object} options - Storage configuration options
   * @returns {BaseStorage} Storage instance
   */
  static create(type, options = {}) {
    switch (type.toLowerCase()) {
      case 'local':
      case 'filesystem':
      case 'fs':
        return new LocalStorage(options);
        
      case 's3':
      case 'aws':
        return new S3Storage(options);
        
      case 'azure':
      case 'azureblob':
        return new AzureStorage(options);
        
      case 'gcs':
      case 'gcp':
      case 'google':
        return new GCSStorage(options);
        
      default:
        throw new Error(`Unsupported storage type: ${type}. Supported types: local, s3, azure, gcs`);
    }
  }

  /**
   * Create storage instance from URL
   * @param {string} url - Storage URL (e.g., 's3://bucket/path', 'gs://bucket/path')
   * @param {Object} options - Additional storage options
   * @returns {BaseStorage} Storage instance
   */
  static createFromUrl(url, options = {}) {
    const urlObj = new URL(url);
    
    switch (urlObj.protocol) {
      case 's3:':
        return new S3Storage({
          bucket: urlObj.hostname,
          prefix: urlObj.pathname.slice(1), // Remove leading /
          ...options
        });
        
      case 'gs:':
        return new GCSStorage({
          bucketName: urlObj.hostname,
          prefix: urlObj.pathname.slice(1), // Remove leading /
          ...options
        });
        
      case 'azure:':
      case 'azblob:':
        // Format: azure://accountname/container/path
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        return new AzureStorage({
          accountName: urlObj.hostname,
          containerName: pathParts[0],
          prefix: pathParts.slice(1).join('/'),
          ...options
        });
        
      case 'file:':
      case 'local:':
        return new LocalStorage({
          baseDir: urlObj.pathname,
          ...options
        });
        
      default:
        throw new Error(`Unsupported storage URL protocol: ${urlObj.protocol}`);
    }
  }

  /**
   * Get available storage types
   * @returns {Array<string>} List of supported storage types
   */
  static getSupportedTypes() {
    return ['local', 's3', 'azure', 'gcs'];
  }

  /**
   * Validate storage configuration
   * @param {string} type - Storage type
   * @param {Object} options - Storage options
   * @returns {Object} Validation result
   */
  static validateConfig(type, options = {}) {
    const result = { valid: true, errors: [] };
    
    switch (type.toLowerCase()) {
      case 'local':
        if (!options.baseDir) {
          result.errors.push('baseDir is required for local storage');
        }
        break;
        
      case 's3':
        if (!options.bucket) {
          result.errors.push('bucket is required for S3 storage');
        }
        if (!options.accessKeyId && !process.env.AWS_ACCESS_KEY_ID) {
          result.errors.push('accessKeyId or AWS_ACCESS_KEY_ID environment variable is required');
        }
        if (!options.secretAccessKey && !process.env.AWS_SECRET_ACCESS_KEY) {
          result.errors.push('secretAccessKey or AWS_SECRET_ACCESS_KEY environment variable is required');
        }
        break;
        
      case 'azure':
        if (!options.containerName) {
          result.errors.push('containerName is required for Azure storage');
        }
        if (!options.connectionString && !options.accountName) {
          result.errors.push('connectionString or accountName is required for Azure storage');
        }
        if (options.accountName && !options.accountKey) {
          result.errors.push('accountKey is required when using accountName for Azure storage');
        }
        break;
        
      case 'gcs':
        if (!options.bucketName) {
          result.errors.push('bucketName is required for GCS storage');
        }
        break;
        
      default:
        result.errors.push(`Unsupported storage type: ${type}`);
    }
    
    result.valid = result.errors.length === 0;
    return result;
  }
}

module.exports = {
  BaseStorage,
  LocalStorage,
  S3Storage,
  AzureStorage,
  GCSStorage,
  StorageFactory
};
