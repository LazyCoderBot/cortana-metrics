/**
 * Base Storage Interface
 * Abstract class defining the interface for different storage providers
 */
class BaseStorage {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Initialize the storage connection
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize() must be implemented by storage provider');
  }

  /**
   * Check if a file exists
   * @param {string} path - File path
   * @returns {Promise<boolean>}
   */
  async exists(path) {
    throw new Error('exists() must be implemented by storage provider');
  }

  /**
   * Read file content
   * @param {string} path - File path
   * @returns {Promise<string>} File content
   */
  async readFile(path) {
    throw new Error('readFile() must be implemented by storage provider');
  }

  /**
   * Write file content
   * @param {string} path - File path
   * @param {string} content - File content
   * @returns {Promise<void>}
   */
  async writeFile(path, content) {
    throw new Error('writeFile() must be implemented by storage provider');
  }

  /**
   * Delete a file
   * @param {string} path - File path
   * @returns {Promise<void>}
   */
  async deleteFile(path) {
    throw new Error('deleteFile() must be implemented by storage provider');
  }

  /**
   * List files in a directory
   * @param {string} path - Directory path
   * @returns {Promise<Array<string>>} List of file paths
   */
  async listFiles(path) {
    throw new Error('listFiles() must be implemented by storage provider');
  }

  /**
   * Create a directory
   * @param {string} path - Directory path
   * @returns {Promise<void>}
   */
  async createDirectory(path) {
    throw new Error('createDirectory() must be implemented by storage provider');
  }

  /**
   * Copy a file
   * @param {string} sourcePath - Source file path
   * @param {string} destinationPath - Destination file path
   * @returns {Promise<void>}
   */
  async copyFile(sourcePath, destinationPath) {
    throw new Error('copyFile() must be implemented by storage provider');
  }

  /**
   * Get file metadata
   * @param {string} path - File path
   * @returns {Promise<Object>} File metadata (size, lastModified, etc.)
   */
  async getFileMetadata(path) {
    throw new Error('getFileMetadata() must be implemented by storage provider');
  }

  /**
   * Get storage type identifier
   * @returns {string} Storage type
   */
  getType() {
    throw new Error('getType() must be implemented by storage provider');
  }

  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    // Default implementation - can be overridden
  }
}

module.exports = BaseStorage;
