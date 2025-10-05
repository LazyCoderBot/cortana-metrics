const fs = require('fs').promises;
const path = require('path');
const BaseStorage = require('./base-storage');

/**
 * Local File System Storage
 * Implementation for storing collections on local filesystem
 */
class LocalStorage extends BaseStorage {
  constructor(options = {}) {
    super(options);
    this.baseDir = options.baseDir || './openapi-specs';
  }

  /**
   * Initialize the storage
   */
  async initialize() {
    try {
      await this.createDirectory(this.baseDir);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Check if a file exists
   */
  async exists(filePath) {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read file content
   */
  async readFile(filePath) {
    const fullPath = path.join(this.baseDir, filePath);
    return await fs.readFile(fullPath, 'utf8');
  }

  /**
   * Write file content
   */
  async writeFile(filePath, content) {
    const fullPath = path.join(this.baseDir, filePath);
    const dir = path.dirname(fullPath);
    
    // Ensure directory exists
    await this.createDirectory(dir);
    
    await fs.writeFile(fullPath, content, 'utf8');
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath) {
    const fullPath = path.join(this.baseDir, filePath);
    await fs.unlink(fullPath);
  }

  /**
   * List files in a directory
   */
  async listFiles(dirPath = '') {
    const fullPath = path.join(this.baseDir, dirPath);
    try {
      const files = await fs.readdir(fullPath);
      return files.map(file => path.join(dirPath, file));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(dirPath) {
    const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(this.baseDir, dirPath);
    await fs.mkdir(fullPath, { recursive: true });
  }

  /**
   * Copy a file
   */
  async copyFile(sourcePath, destinationPath) {
    const fullSourcePath = path.join(this.baseDir, sourcePath);
    const fullDestPath = path.join(this.baseDir, destinationPath);
    
    // Ensure destination directory exists
    const destDir = path.dirname(fullDestPath);
    await this.createDirectory(destDir);
    
    await fs.copyFile(fullSourcePath, fullDestPath);
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath) {
    const fullPath = path.join(this.baseDir, filePath);
    const stats = await fs.stat(fullPath);
    
    return {
      size: stats.size,
      lastModified: stats.mtime,
      created: stats.birthtime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile()
    };
  }

  /**
   * Get storage type
   */
  getType() {
    return 'local';
  }

  /**
   * Get full path for a file
   */
  getFullPath(filePath) {
    return path.join(this.baseDir, filePath);
  }
}

module.exports = LocalStorage;
