const fs = require('fs');
const path = require('path');
const moment = require('moment');
const OpenAPIGenerator = require('./openapi-generator');
const { StorageFactory } = require('./storage');

/**
 * OpenAPI Specification Manager
 * Manages multiple OpenAPI specifications, versioning, and continuous updates
 */
class CollectionManager {
  /**
   * Creates a new CollectionManager instance
   * @param {Object} options - Configuration options for the OpenAPI specification manager
   * @param {string} [options.baseDir='./openapi-specs'] - Base directory for storing OpenAPI specifications
   * @param {boolean} [options.autoBackup=false] - Whether to automatically create backups
   * @param {number} [options.maxBackups=5] - Maximum number of backup files to keep
   * @param {boolean} [options.watchMode=true] - Whether to enable file watching mode
   * @param {Object} [options.collections={}] - Pre-configured specifications
   * @param {boolean} [options.singleFileMode=true] - Whether to use single file mode for specifications
   * @param {boolean} [options.detectChanges=true] - Whether to detect changes in endpoints
   * @param {Object|string} [options.storage] - Storage configuration (object or URL string)
   * @param {string} [options.storage.type='local'] - Storage type ('local', 's3', 'gcs', 'azure')
   * @param {Object} [options.storage.options={}] - Storage-specific options
   * @param {Object} [options.defaultCollectionOptions] - Default options for new specifications
   * @param {string} [options.defaultCollectionOptions.title='API Collection'] - Default API title
   * @param {string} [options.defaultCollectionOptions.version='1.0.0'] - Default version
   * @param {boolean} [options.defaultCollectionOptions.groupByPath=true] - Whether to group by path
   * @param {boolean} [options.defaultCollectionOptions.includeExamples=true] - Whether to include examples
   * @param {boolean} [options.defaultCollectionOptions.includeSchemas=true] - Whether to include schemas
   * @param {boolean} [options.defaultCollectionOptions.autoSave=true] - Whether to auto-save specifications
   */
  constructor(options = {}) {
    this.options = {
      baseDir: options.baseDir || './openapi-specs',
      autoBackup: options.autoBackup === true, // Changed default to false
      maxBackups: options.maxBackups || 5,
      watchMode: options.watchMode !== false,
      collections: options.collections || {},
      singleFileMode: options.singleFileMode !== false, // New option for single file mode
      detectChanges: options.detectChanges !== false, // New option for change detection

      // Storage configuration
      storage: options.storage || {
        type: 'local', // Default to local storage
        options: {}
      },

      defaultCollectionOptions: {
        title: 'API Collection',
        version: '1.0.0',
        groupByPath: true,
        includeExamples: true, // Default to true for OpenAPI
        includeSchemas: true, // Default to true for OpenAPI
        autoSave: true,
        singleFileMode: options.singleFileMode !== false, // Pass to generator
        detectChanges: options.detectChanges !== false, // Pass to generator
        ...options.defaultCollectionOptions
      },
      ...options
    };

    this.collections = new Map();

    // Initialize storage
    this.initializeStorage();

    // Set up directory paths (for compatibility and backup paths)
    this.backupDir = 'backups';
    this.versionsDir = 'versions';

    // Initialize directories and collections asynchronously
    this.initializeAsync();
  }

  /**
   * Initialize storage based on configuration
   * Sets up the storage backend (local, S3, GCS, Azure) based on the provided configuration
   * Falls back to local storage if initialization fails
   * @private
   * @throws {Error} When storage initialization fails and no fallback is available
   */
  initializeStorage() {
    try {
      if (typeof this.options.storage === 'string') {
        // Handle URL-based storage configuration
        this.storage = StorageFactory.createFromUrl(this.options.storage);
      } else {
        // Handle object-based storage configuration
        const storageConfig = this.options.storage || { type: 'local' };

        // Merge baseDir into storage options for local storage
        if (storageConfig.type === 'local' && !(storageConfig.options && storageConfig.options.baseDir)) {
          storageConfig.options = {
            ...storageConfig.options,
            baseDir: this.options.baseDir
          };
        }

        this.storage = StorageFactory.create(storageConfig.type, storageConfig.options);
      }

      // Initialize storage asynchronously
      this.storage.initialize().catch(error => {
        console.error('Failed to initialize storage:', error);
      });

    } catch (error) {
      console.error('Error setting up storage:', error);
      // Fallback to local storage
      this.storage = StorageFactory.create('local', { baseDir: this.options.baseDir });
    }
  }

  /**
   * Initialize directories and collections asynchronously
   * Sets up required directories and loads existing collections from storage
   * @private
   * @async
   * @throws {Error} When directory creation or collection loading fails
   */
  async initializeAsync() {
    try {
      await this.ensureDirectories();
      await this.loadExistingCollections();
    } catch (error) {
      console.error('Error during async initialization:', error);
    }
  }

  /**
   * Create or get a collection
   * Returns an existing collection or creates a new one with the specified name and options
   * @param {string} name - Collection name
   * @param {Object} [options={}] - Collection options
   * @param {string} [options.collectionName] - Override collection name
   * @param {string} [options.version] - Collection version
   * @param {boolean} [options.groupByPath] - Whether to group requests by path
   * @param {boolean} [options.includeExamples] - Whether to include examples
   * @param {boolean} [options.includeSchemas] - Whether to include schemas
   * @param {boolean} [options.autoSave] - Whether to auto-save the collection
   * @param {string} [options.outputDir] - Output directory for the collection (auto-generated if not provided)
   * @returns {OpenAPIGenerator} The specification generator instance
   */
  getCollection(name, options = {}) {
    if (!this.collections.has(name)) {
      const collectionOptions = {
        ...this.options.defaultCollectionOptions,
        ...options,
        collectionName: name
      };

      // Set outputDir for both single-file and multi-file modes
      if (this.options.singleFileMode) {
        // In single file mode, use the baseDir directly
        collectionOptions.outputDir = path.resolve(this.options.baseDir);
      } else {
        // In multi-file mode, create subdirectories
        collectionOptions.outputDir = path.join(this.options.baseDir, this.sanitizeName(name));
      }

      const generator = new OpenAPIGenerator(collectionOptions);

      // Try to load existing collection
      let existingPath;
      if (this.options.singleFileMode) {
        existingPath = path.join(this.options.baseDir, `${this.sanitizeName(name)}.json`);
      } else {
        existingPath = path.join(collectionOptions.outputDir, `${this.sanitizeName(name)}_latest.json`);
      }

      generator.loadSpec(existingPath);

      this.collections.set(name, generator);
    }

    return this.collections.get(name);
  }

  /**
   * Add endpoint to a specific collection
   * Adds a captured endpoint to the specified collection and optionally creates a backup
   * @param {string} collectionName - Name of the collection
   * @param {Object} endpointData - Captured endpoint data
   * @param {Object} endpointData.request - Request information
   * @param {string} endpointData.request.method - HTTP method
   * @param {string} endpointData.request.path - Request path
   * @param {Object} endpointData.request.headers - Request headers
   * @param {Object} endpointData.request.body - Request body
   * @param {Object} endpointData.response - Response information
   * @param {number} endpointData.response.statusCode - Response status code
   * @param {Object} endpointData.response.headers - Response headers
   * @param {Object} endpointData.response.body - Response body
   * @param {Object} endpointData.metadata - Additional metadata
   * @param {string} endpointData.metadata.capturedAt - Timestamp when endpoint was captured
   * @param {Object} [options={}] - Additional options
   * @param {boolean} [options.autoSave] - Whether to auto-save the collection
   * @param {boolean} [options.includeExamples] - Whether to include examples
   * @param {boolean} [options.includeSchemas] - Whether to include schemas
   * @returns {Object} The added request object
   * @throws {Error} When adding the endpoint fails
   */
  addEndpoint(collectionName, endpointData, options = {}) {
    try {
      const collection = this.getCollection(collectionName, options);
      const pathItem = collection.addEndpoint(endpointData, options);

      // Create backup if needed (skip in single file mode unless explicitly enabled)
      if (this.options.autoBackup && !this.options.singleFileMode) {
        this.createBackup(collectionName);
      }

      // Update collection metadata
      this.updateCollectionMetadata(collectionName, endpointData);

      // Ensure the collection is saved immediately after adding endpoint
      if (collection.options.autoSave) {
        collection.saveSpec();
      }

      return pathItem;
    } catch (error) {
      console.error(`Error adding endpoint to collection ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Add endpoint to multiple collections based on rules
   * Automatically assigns an endpoint to multiple collections based on configurable rules
   * @param {Object} endpointData - Captured endpoint data
   * @param {Object} [rules={}] - Rules for collection assignment
   * @param {string} [rules.defaultCollection='Main API'] - Default collection name
   * @param {boolean} [rules.versionBased=false] - Whether to create version-based collections
   * @param {boolean} [rules.methodBased=false] - Whether to create method-based collections
   * @param {boolean} [rules.pathBased=false] - Whether to create path-based collections
   * @param {boolean} [rules.statusBased=false] - Whether to create status-based collections
   * @param {boolean} [rules.environmentBased=false] - Whether to create environment-based collections
   * @param {string} [rules.environment] - Environment name for environment-based collections
   * @param {Function} [rules.custom] - Custom assignment function
   * @returns {Array<Object>} Array of assignment results with success status
   * @returns {string} returns[].collectionName - Name of the collection
   * @returns {Object} returns[].pathItem - The added path item object (if successful)
   * @returns {boolean} returns[].success - Whether the assignment was successful
   * @returns {string} [returns[].error] - Error message (if assignment failed)
   */
  addEndpointWithRules(endpointData, rules = {}) {
    const assignments = this.determineCollectionAssignments(endpointData, rules);
    const results = [];

    assignments.forEach(({ collectionName, options }) => {
      try {
        const pathItem = this.addEndpoint(collectionName, endpointData, options);
        results.push({ collectionName, pathItem, success: true });
      } catch (error) {
        results.push({ collectionName, error: error.message, success: false });
      }
    });

    return results;
  }

  /**
   * Determine which collections should receive the endpoint
   * Analyzes endpoint data and rules to determine target collections
   * @param {Object} endpointData - Captured endpoint data
   * @param {Object} rules - Assignment rules
   * @returns {Array<Object>} Array of collection assignments
   * @returns {string} returns[].collectionName - Name of the target collection
   * @returns {Object} returns[].options - Options for the collection
   * @private
   */
  determineCollectionAssignments(endpointData, rules) {
    const assignments = [];
    const { request } = endpointData;

    // Default collection
    assignments.push({
      collectionName: rules.defaultCollection || 'Main API',
      options: {}
    });

    // Version-based collections
    if (rules.versionBased && endpointData.metadata && endpointData.metadata.version) {
      assignments.push({
        collectionName: `API v${endpointData.metadata.version}`,
        options: { version: endpointData.metadata.version }
      });
    }

    // Method-based collections
    if (rules.methodBased) {
      assignments.push({
        collectionName: `${request.method} Endpoints`,
        options: { groupByMethod: true }
      });
    }

    // Path-based collections
    if (rules.pathBased) {
      const pathParts = request.path.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        assignments.push({
          collectionName: `${pathParts[0]} API`,
          options: { pathPrefix: pathParts[0] }
        });
      }
    }

    // Status-based collections
    if (rules.statusBased) {
      const statusCategory = this.getStatusCategory(endpointData.response.statusCode);
      assignments.push({
        collectionName: `${statusCategory} Responses`,
        options: { statusCategory }
      });
    }

    // Environment-based collections
    if (rules.environmentBased && rules.environment) {
      assignments.push({
        collectionName: `${rules.environment} Environment`,
        options: { environment: rules.environment }
      });
    }

    // Custom rules
    if (rules.custom && typeof rules.custom === 'function') {
      const customAssignments = rules.custom(endpointData);
      if (Array.isArray(customAssignments)) {
        assignments.push(...customAssignments);
      }
    }

    return assignments;
  }

  /**
   * Create a backup of a collection
   * Creates a timestamped backup of the specified collection and cleans old backups
   * @param {string} collectionName - Name of the collection to backup
   * @throws {Error} When backup creation fails
   */
  createBackup(collectionName) {
    try {
      const collection = this.collections.get(collectionName);
      if (!collection) return;

      const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
      const backupFilename = `${this.sanitizeName(collectionName)}_backup_${timestamp}.json`;
      const backupPath = path.join(this.backupDir, backupFilename);

      fs.writeFileSync(backupPath, collection.exportSpec('json'));

      // Clean old backups
      this.cleanOldBackups(collectionName);

      console.log(`Backup created: ${backupPath}`);
    } catch (error) {
      console.error(`Error creating backup for ${collectionName}:`, error);
    }
  }

  /**
   * Create a version snapshot of a collection
   * Creates a versioned snapshot of the collection with metadata
   * @param {string} collectionName - Name of the collection
   * @param {string} version - Version identifier (e.g., '1.0.0', 'v2.1')
   * @returns {string} Path to the created version file
   * @throws {Error} When collection is not found or version creation fails
   */
  createVersion(collectionName, version) {
    try {
      const collection = this.collections.get(collectionName);
      if (!collection) throw new Error(`Collection ${collectionName} not found`);

      const versionFilename = `${this.sanitizeName(collectionName)}_v${version}.json`;
      const versionPath = path.join(this.versionsDir, versionFilename);

      const versionData = {
        ...JSON.parse(collection.exportSpec('json')),
        info: {
          ...JSON.parse(collection.exportSpec('json')).info,
          version,
          versionCreatedAt: new Date().toISOString()
        }
      };

      fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
      console.log(`Version ${version} created: ${versionPath}`);

      return versionPath;
    } catch (error) {
      console.error(`Error creating version for ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Merge multiple collections into one
   * Combines multiple collections into a single collection with merged items and variables
   * @param {Array<string>} collectionNames - Names of collections to merge
   * @param {string} targetName - Name of the merged collection
   * @param {Object} [options={}] - Merge options
   * @param {boolean} [options.prefixWithCollectionName=false] - Whether to prefix item names with collection name
   * @returns {OpenAPIGenerator} The merged specification generator
   * @throws {Error} When merge operation fails
   */
  mergeCollections(collectionNames, targetName, options = {}) {
    try {
      const mergedGenerator = new OpenAPIGenerator({
        ...this.options.defaultCollectionOptions,
        title: targetName,
        outputDir: path.join(this.options.baseDir, this.sanitizeName(targetName)),
        ...options
      });

      collectionNames.forEach(name => {
        const collection = this.collections.get(name);
        if (collection) {
          const specData = JSON.parse(collection.exportSpec('json'));

          // Merge paths
          if (specData.paths) {
            Object.keys(specData.paths).forEach(path => {
              const prefixedPath = options.prefixWithCollectionName ? `/${name}${path}` : path;
              mergedGenerator.spec.paths[prefixedPath] = specData.paths[path];
            });
          }

          // Merge components
          if (specData.components) {
            Object.keys(specData.components).forEach(componentType => {
              if (!mergedGenerator.spec.components[componentType]) {
                mergedGenerator.spec.components[componentType] = {};
              }
              Object.assign(mergedGenerator.spec.components[componentType], specData.components[componentType]);
            });
          }

          // Merge tags
          if (specData.tags) {
            specData.tags.forEach(tag => {
              const prefixedTag = options.prefixWithCollectionName ? `${name}-${tag.name}` : tag.name;
              const existingTag = mergedGenerator.spec.tags.find(t => t.name === prefixedTag);
              if (!existingTag) {
                mergedGenerator.spec.tags.push({
                  ...tag,
                  name: prefixedTag
                });
              }
            });
          }
        }
      });

      // Save merged specification
      mergedGenerator.saveSpec();
      this.collections.set(targetName, mergedGenerator);

      console.log(`Merged collections into: ${targetName}`);
      return mergedGenerator;
    } catch (error) {
      console.error('Error merging collections:', error);
      throw error;
    }
  }

  /**
   * Export all collections
   * Exports all managed collections in the specified format
   * @param {string} [format='json'] - Export format ('json', 'yaml', etc.)
   * @param {Object} [options={}] - Export options
   * @param {boolean} [options.saveToFile=false] - Whether to save exports to a file
   * @returns {Object} Object containing exported collections with metadata
   * @returns {Object} returns[collectionName].data - Exported collection data
   * @returns {Object} returns[collectionName].stats - Collection statistics
   * @returns {string} returns[collectionName].path - Collection path
   */
  exportAllCollections(format = 'json', options = {}) {
    const exports = {};

    this.collections.forEach((generator, name) => {
      exports[name] = {
        data: generator.exportSpec(format),
        stats: generator.getStats(),
        path: generator.options.outputDir
      };
    });

    if (options.saveToFile) {
      const exportPath = path.join(this.options.baseDir, `all_collections_${moment().format('YYYY-MM-DD_HH-mm-ss')}.json`);
      fs.writeFileSync(exportPath, JSON.stringify(exports, null, 2));
      console.log(`All collections exported to: ${exportPath}`);
    }

    return exports;
  }

  /**
   * Get statistics for all collections
   * Returns comprehensive statistics for all managed collections
   * @returns {Object} Statistics object
   * @returns {number} returns.totalCollections - Total number of collections
   * @returns {number} returns.totalOperations - Total number of operations across all collections
   * @returns {number} returns.totalPaths - Total number of paths across all collections
   * @returns {Object} returns.collections - Statistics for each collection
   */
  getAllStats() {
    const stats = {
      totalCollections: this.collections.size,
      totalOperations: 0,
      totalPaths: 0,
      collections: {}
    };

    this.collections.forEach((generator, name) => {
      const collectionStats = generator.getStats();
      stats.totalOperations += collectionStats.totalOperations;
      stats.totalPaths += collectionStats.totalPaths;
      stats.collections[name] = collectionStats;
    });

    return stats;
  }

  /**
   * Watch for changes and auto-update collections
   * Starts file watching for collection changes and triggers callbacks
   * @param {Function} [callback] - Callback function for change events
   * @param {string} callback.collectionName - Name of the changed collection
   * @param {string} callback.eventType - Type of file system event
   * @param {string} callback.filename - Name of the changed file
   */
  startWatching(callback) {
    if (!this.options.watchMode) return;

    console.log('Starting collection watch mode...');

    // Watch for file changes in collection directories
    this.collections.forEach((generator, name) => {
      const watchDir = generator.options.outputDir;
      if (fs.existsSync(watchDir)) {
        fs.watch(watchDir, (eventType, filename) => {
          if (filename && filename.endsWith('.json')) {
            console.log(`Collection file changed: ${filename}`);
            if (callback) callback(name, eventType, filename);
          }
        });
      }
    });
  }

  /**
   * Clean old backup files
   * Removes old backup files beyond the maximum backup limit
   * @param {string} collectionName - Name of the collection
   * @private
   */
  cleanOldBackups(collectionName) {
    try {
      const backupFiles = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith(`${this.sanitizeName(collectionName)}_backup_`))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          stats: fs.statSync(path.join(this.backupDir, file))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);

      // Keep only the most recent backups
      if (backupFiles.length > this.options.maxBackups) {
        const filesToDelete = backupFiles.slice(this.options.maxBackups);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`Deleted old backup: ${file.name}`);
        });
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error);
    }
  }

  /**
   * Update collection metadata
   * Updates the collection's metadata with the latest endpoint information
   * @param {string} collectionName - Name of the collection
   * @param {Object} endpointData - Latest endpoint data
   * @private
   */
  updateCollectionMetadata(collectionName, endpointData) {
    const collection = this.collections.get(collectionName);
    if (collection) {
      // Store metadata in a separate property, not in info section
      // to avoid OpenAPI import issues
      collection.metadata = collection.metadata || {};
      collection.metadata.lastEndpointAdded = {
        method: endpointData.request.method,
        path: endpointData.request.path,
        timestamp: endpointData.metadata.capturedAt
      };
    }
  }

  /**
   * Load existing collections from disk
   * Scans storage for existing collections and loads them into memory
   * @private
   * @async
   */
  async loadExistingCollections() {
    try {
      const files = await this.storage.listFiles('');

      if (this.options.singleFileMode) {
        // In single file mode, look for .json files directly in root
        for (const file of files) {
          if (file.endsWith('.json') && !file.includes('_backup_') && !file.includes('/')) {
            const collectionName = path.basename(file, '.json').replace(/_/g, ' ');
            console.log(`Loading existing collection: ${collectionName}`);
            await this.getCollection(collectionName);
          }
        }
      } else {
        // Traditional mode - look for directories with _latest.json files
        const directories = new Set();
        files.forEach(file => {
          const dir = path.dirname(file);
          if (dir && dir !== '.' && !dir.startsWith('backups') && !dir.startsWith('versions')) {
            directories.add(dir);
          }
        });

        for (const dir of directories) {
          const latestFile = path.join(dir, `${path.basename(dir)}_latest.json`);
          if (await this.storage.exists(latestFile)) {
            console.log(`Loading existing collection: ${dir}`);
            await this.getCollection(dir.replace(/_/g, ' '));
          }
        }
      }
    } catch (error) {
      console.error('Error loading existing collections:', error);
    }
  }

  // Utility methods
  /**
   * Sanitize a name for use in file names and collection names
   * Replaces invalid characters with underscores
   * @param {string} name - Name to sanitize
   * @returns {string} Sanitized name safe for file system use
   * @private
   */
  sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  /**
   * Get status category for HTTP status code
   * Categorizes HTTP status codes into meaningful groups
   * @param {number} statusCode - HTTP status code
   * @returns {string} Status category ('Success', 'Redirect', 'Client Error', 'Server Error', 'Unknown')
   * @private
   */
  getStatusCategory(statusCode) {
    if (statusCode >= 200 && statusCode < 300) return 'Success';
    if (statusCode >= 300 && statusCode < 400) return 'Redirect';
    if (statusCode >= 400 && statusCode < 500) return 'Client Error';
    if (statusCode >= 500) return 'Server Error';
    return 'Unknown';
  }

  /**
   * Ensure required directories exist in storage
   * Creates base directory, backup directory, and versions directory
   * @private
   * @async
   * @throws {Error} When directory creation fails
   */
  async ensureDirectories() {
    try {
      await this.storage.createDirectory('');
      await this.storage.createDirectory(this.backupDir);
      await this.storage.createDirectory(this.versionsDir);
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }
}

module.exports = CollectionManager;
