const _ = require('lodash');
const moment = require('moment');
const CollectionManager = require('./collection-manager');

/**
 * Endpoint Capture Module
 * A comprehensive module for capturing endpoint-related data
 */
class EndpointCapture {
  /**
   * Creates a new EndpointCapture instance
   * @param {Object} [options={}] - Configuration options for endpoint capture
   * @param {boolean} [options.captureRequestBody=true] - Whether to capture request body
   * @param {boolean} [options.captureResponseBody=true] - Whether to capture response body
   * @param {boolean} [options.captureHeaders=true] - Whether to capture headers
   * @param {boolean} [options.captureQueryParams=true] - Whether to capture query parameters
   * @param {boolean} [options.capturePathParams=true] - Whether to capture path parameters
   * @param {boolean} [options.captureCookies=true] - Whether to capture cookies
   * @param {boolean} [options.captureTiming=true] - Whether to capture timing information
   * @param {number} [options.maxBodySize=1048576] - Maximum body size to capture (1MB default)
   * @param {Array<string>} [options.sensitiveHeaders=['authorization', 'cookie', 'x-api-key']] - Headers to redact
   * @param {Array<string>} [options.sensitiveFields=['password', 'token', 'secret', 'key']] - Fields to redact
   * @param {string} [options.timestampFormat='YYYY-MM-DD HH:mm:ss.SSS'] - Timestamp format
   * @param {boolean} [options.generateOpenAPISpec=true] - Whether to generate OpenAPI specifications
   * @param {Object} [options.openAPISpecOptions] - OpenAPI specification configuration
   * @param {string} [options.openAPISpecOptions.baseDir='./openapi-specs'] - Base directory for specifications
   * @param {boolean} [options.openAPISpecOptions.autoBackup=false] - Whether to auto-backup specifications
   * @param {number} [options.openAPISpecOptions.maxBackups=5] - Maximum number of backups
   * @param {boolean} [options.openAPISpecOptions.watchMode=true] - Whether to watch for changes
   * @param {boolean} [options.openAPISpecOptions.singleFileMode=true] - Whether to use single file mode
   * @param {boolean} [options.openAPISpecOptions.detectChanges=true] - Whether to detect changes
   * @param {Object|string} [options.openAPISpecOptions.storage] - Storage configuration
   * @param {Object} [options.openAPISpecOptions.defaultCollectionOptions] - Default specification options
   * @param {Object} [options.openAPISpecOptions.collectionRules] - Collection assignment rules
   */
  constructor(options = {}) {
    // Handle null options
    if (options === null) {
      options = {};
    }
    
    this.options = {
      captureRequestBody: options.captureRequestBody !== false,
      captureResponseBody: options.captureResponseBody !== false,
      captureHeaders: options.captureHeaders !== false,
      captureQueryParams: options.captureQueryParams !== false,
      capturePathParams: options.capturePathParams !== false,
      captureCookies: options.captureCookies !== false,
      captureTiming: options.captureTiming !== false,
      maxBodySize: options.maxBodySize || 1024 * 1024, // 1MB default
      sensitiveHeaders: options.sensitiveHeaders || [],
      sensitiveFields: options.sensitiveFields || [],
      timestampFormat: options.timestampFormat || 'YYYY-MM-DD HH:mm:ss.SSS',
      // OpenAPI specification options
      generateOpenAPISpec: options.generateOpenAPISpec !== false,
      openAPISpecOptions: {
        baseDir: './openapi-specs',
        // Single active file mode by default
        singleFileMode: true,
        autoBackup: false, // No backups for single file mode
        maxBackups: 5,
        watchMode: true,
        detectChanges: false, // Always update the single file

        // Storage configuration
        storage: (options.openAPISpecOptions && options.openAPISpecOptions.storage) || {
          type: 'local', // Default to local storage
          options: {}
        },

        defaultCollectionOptions: {
          title: 'API Documentation',
          version: '1.0.0',
          groupByPath: true,
          includeExamples: true, // Default to true for OpenAPI
          includeSchemas: true, // Default to true for OpenAPI
          autoSave: true, // Auto-save to single file
          singleFileMode: true, // Pass to generator
          detectChanges: false // Always update single file
        },
        collectionRules: {
          defaultCollection: 'API Documentation', // Single collection
          versionBased: false, // No version-based collections
          pathBased: false, // No path-based collections
          environmentBased: false,
          environment: 'development'
        },
        ...options.openAPISpecOptions
      },
      ...options
    };

    // Initialize collection manager if enabled
    if (this.options.generateOpenAPISpec) {
      this.collectionManager = new CollectionManager(this.options.openAPISpecOptions);
    }
  }

  /**
   * Capture request data from Express request object
   * Extracts and sanitizes request information including headers, body, and metadata
   * @param {Object} req - Express request object
   * @param {string} req.method - HTTP method
   * @param {string} req.url - Request URL
   * @param {string} req.originalUrl - Original URL
   * @param {string} req.baseUrl - Base URL
   * @param {string} req.path - Request path
   * @param {string} req.protocol - Protocol (http/https)
   * @param {boolean} req.secure - Whether connection is secure
   * @param {string} req.ip - Client IP address
   * @param {Array} req.ips - Client IP addresses
   * @param {string} req.hostname - Hostname
   * @param {Array} req.subdomains - Subdomains
   * @param {Object} req.headers - Request headers
   * @param {Object} req.query - Query parameters
   * @param {Object} req.params - Path parameters
   * @param {Object} req.cookies - Cookies
   * @param {Object} req.body - Request body
   * @returns {Object} Captured request data with sanitized sensitive information
   * @returns {string} returns.timestamp - Formatted timestamp
   * @returns {string} returns.method - HTTP method
   * @returns {string} returns.url - Request URL
   * @returns {string} returns.originalUrl - Original URL
   * @returns {string} returns.baseUrl - Base URL
   * @returns {string} returns.path - Request path
   * @returns {string} returns.protocol - Protocol
   * @returns {boolean} returns.secure - Whether secure
   * @returns {string} returns.ip - Client IP
   * @returns {Array} returns.ips - Client IPs
   * @returns {string} returns.hostname - Hostname
   * @returns {Array} returns.subdomains - Subdomains
   * @returns {number} returns.startTime - Request start time
   * @returns {Object} [returns.headers] - Sanitized headers (if enabled)
   * @returns {Object} [returns.query] - Query parameters (if enabled)
   * @returns {Object} [returns.params] - Path parameters (if enabled)
   * @returns {Object} [returns.cookies] - Cookies (if enabled)
   * @returns {Object} [returns.body] - Sanitized request body (if enabled)
   * @returns {string} returns.userAgent - User agent string
   * @returns {string} returns.contentType - Content type
   * @returns {string} returns.contentLength - Content length
   * @returns {string} returns.accept - Accept header
   * @returns {string} returns.acceptEncoding - Accept encoding
   * @returns {string} returns.acceptLanguage - Accept language
   */
  captureRequest(req) {
    if (!req || typeof req !== 'object') {
      throw new Error('Request object is required and must be an object');
    }
    
    if (!req.method || !req.url) {
      throw new Error('Request object must have method and url properties');
    }
    
    const startTime = Date.now();
    const requestData = {
      timestamp: moment().format(this.options.timestampFormat),
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      path: req.path,
      protocol: req.protocol,
      secure: req.secure,
      ip: req.ip || (req.connection && req.connection.remoteAddress),
      ips: req.ips,
      hostname: req.hostname,
      subdomains: req.subdomains,
      startTime
    };

    // Capture headers
    if (this.options.captureHeaders) {
      requestData.headers = this._sanitizeHeaders(req.headers);
    }

    // Capture query parameters
    if (this.options.captureQueryParams) {
      requestData.query = req.query;
    }

    // Capture path parameters
    if (this.options.capturePathParams) {
      requestData.params = req.params;
    }

    // Capture cookies
    if (this.options.captureCookies) {
      requestData.cookies = req.cookies;
    }

    // Capture request body with enhanced data analysis
    if (this.options.captureRequestBody && req.body) {
      const enhancedBody = this._enhanceDataCapture(req.body);
      requestData.body = enhancedBody.sanitized;
      requestData.bodyActual = enhancedBody.actual; // Store actual values for reference
      requestData.bodyTypes = enhancedBody.types;
      requestData.hasSensitiveData = enhancedBody.hasSensitiveData;
      requestData.sensitiveFields = enhancedBody.sensitiveFields;
    }

    // Capture user agent and other request info
    requestData.userAgent = req.get('User-Agent');
    requestData.contentType = req.get('Content-Type');
    requestData.contentLength = req.get('Content-Length');
    requestData.accept = req.get('Accept');
    requestData.acceptEncoding = req.get('Accept-Encoding');
    requestData.acceptLanguage = req.get('Accept-Language');

    return requestData;
  }

  /**
   * Capture response data from Express response object
   * Extracts response information including status, headers, and timing
   * @param {Object} res - Express response object
   * @param {number} res.statusCode - HTTP status code
   * @param {string} res.statusMessage - HTTP status message
   * @param {Function} res.getHeaders - Method to get response headers
   * @param {Object} [originalRequestData={}] - Original request data for timing calculation
   * @param {number} [originalRequestData.startTime] - Request start time for duration calculation
   * @returns {Object} Captured response data
   * @returns {string} returns.timestamp - Formatted timestamp
   * @returns {number} returns.statusCode - HTTP status code
   * @returns {string} returns.statusMessage - HTTP status message
   * @returns {number} returns.endTime - Response end time
   * @returns {number} [returns.duration] - Request duration in milliseconds
   * @returns {string} [returns.durationFormatted] - Human-readable duration
   * @returns {Object} [returns.headers] - Response headers (if enabled)
   * @returns {Object} [returns.body] - Response body (if available and enabled)
   */
  captureResponse(res, originalRequestData = {}) {
    const endTime = Date.now();
    const responseData = {
      timestamp: moment().format(this.options.timestampFormat),
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      endTime
    };

    // Calculate timing if we have start time
    if (originalRequestData.startTime) {
      responseData.duration = endTime - originalRequestData.startTime;
      responseData.durationFormatted = this._formatDuration(responseData.duration);
    }

    // Capture response headers
    if (this.options.captureHeaders) {
      responseData.headers = this._sanitizeHeaders(res.getHeaders());
    }

    // Capture response body with enhanced data analysis
    if (this.options.captureResponseBody && res.locals && res.locals.responseBody) {
      const enhancedBody = this._enhanceDataCapture(res.locals.responseBody);
      responseData.body = enhancedBody.sanitized;
      responseData.bodyActual = enhancedBody.actual; // Store actual values for reference
      responseData.bodyTypes = enhancedBody.types;
      responseData.hasSensitiveData = enhancedBody.hasSensitiveData;
      responseData.sensitiveFields = enhancedBody.sensitiveFields;
    }

    return responseData;
  }

  /**
   * Capture complete endpoint data (request + response)
   * Combines request and response data into a complete endpoint capture
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Object} [additionalData={}] - Any additional data to include in metadata
   * @returns {Object} Complete endpoint data
   * @returns {Object} returns.request - Captured request data
   * @returns {Object} returns.response - Captured response data
   * @returns {Object} returns.metadata - Additional metadata
   * @returns {string} returns.metadata.capturedAt - Capture timestamp
   * @returns {string} returns.metadata.version - Capture version
   * @returns {Object} [returns.metadata.*] - Additional metadata properties
   */
  captureEndpointData(req, res, additionalData = {}) {
    const requestData = this.captureRequest(req);
    const responseData = this.captureResponse(res, requestData);

    return {
      request: requestData,
      response: responseData,
      metadata: {
        capturedAt: moment().format(this.options.timestampFormat),
        version: '1.0.0',
        ...additionalData
      }
    };
  }

  /**
   * Create Express middleware for automatic endpoint capture
   * Creates middleware that automatically captures request/response data and optionally adds to OpenAPI specifications
   * @param {Function} [callback] - Optional callback to handle captured data
   * @param {Function} callback.endpointData - Captured endpoint data
   * @param {Object} callback.req - Express request object
   * @param {Object} callback.res - Express response object
   * @returns {Function} Express middleware function
   * @returns {Function} returns - Express middleware function that captures endpoint data
   * @example
   * const capture = new EndpointCapture();
   * app.use(capture.createMiddleware((endpointData, req, res) => {
   *   console.log('Captured:', endpointData.request.method, endpointData.request.url);
   * }));
   */
  createMiddleware(callback) {
    return (req, res, next) => {
      // Store original request data
      req.endpointCapture = this.captureRequest(req);

      // Override res.json to capture response body
      const originalJson = res.json;
      res.json = function(body) {
        res.locals.responseBody = body;
        return originalJson.call(this, body);
      };

      // Override res.send to capture response body
      const originalSend = res.send;
      res.send = function(body) {
        res.locals.responseBody = body;
        return originalSend.call(this, body);
      };

      // Capture response data on finish
      res.on('finish', () => {
        const endpointData = this.captureEndpointData(req, res);

        // Add to request object for access in routes
        req.capturedEndpointData = endpointData;

        // Generate OpenAPI specification if enabled
        if (this.options.generateOpenAPISpec && this.collectionManager) {
          try {
            this.collectionManager.addEndpointWithRules(
              endpointData,
              this.options.openAPISpecOptions.collectionRules
            );
          } catch (error) {
            console.error('Error adding endpoint to OpenAPI specification:', error);
          }
        }

        // Call callback if provided
        if (callback && typeof callback === 'function') {
          callback(endpointData, req, res);
        }
      });

      next();
    };
  }

  /**
   * Sanitize headers by removing sensitive information
   * Redacts sensitive headers based on configuration
   * @param {Object} headers - Headers object to sanitize
   * @returns {Object} Sanitized headers with sensitive values redacted
   * @private
   */
  _sanitizeHeaders(headers) {
    if (!headers) return {};

    const sanitized = { ...headers };
    this.options.sensitiveHeaders.forEach(header => {
      const lowerHeader = header.toLowerCase();
      Object.keys(sanitized).forEach(key => {
        if (key.toLowerCase() === lowerHeader) {
          sanitized[key] = '[REDACTED]';
        }
      });
    });

    return sanitized;
  }

  /**
   * Sanitize body by removing sensitive fields
   * Recursively sanitizes object properties to redact sensitive data
   * @param {Object} body - Request/response body to sanitize
   * @returns {Object} Sanitized body with sensitive fields redacted
   * @private
   */
  _sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;

    const sanitized = _.cloneDeep(body);
    this._recursiveSanitize(sanitized);

    return sanitized;
  }

  /**
   * Enhanced data capture with types and values
   * Captures both sanitized data and data types with actual values
   * @param {Object} body - Request/response body to analyze
   * @returns {Object} Enhanced data with types, sanitized values, and actual values
   * @private
   */
  _enhanceDataCapture(body) {
    if (!body || typeof body !== 'object') {
      return {
        sanitized: body,
        actual: body,
        types: this._getDataType(body),
        hasSensitiveData: false
      };
    }

    const result = {
      sanitized: _.cloneDeep(body),
      actual: _.cloneDeep(body), // Store actual values for reference
      types: _.cloneDeep(body),
      hasSensitiveData: false,
      sensitiveFields: []
    };

    this._recursiveEnhance(result.sanitized, result.actual, result.types, result, []);

    return result;
  }

  /**
   * Recursively enhance data capture with types and sensitive field detection
   * @param {Object|Array} sanitized - Sanitized data object
   * @param {Object|Array} actual - Actual data object (unchanged)
   * @param {Object|Array} types - Types data object
   * @param {Object} result - Result object to update
   * @param {Array} path - Current path in object
   * @private
   */
  _recursiveEnhance(sanitized, actual, types, result, path) {
    if (Array.isArray(sanitized)) {
      sanitized.forEach((item, index) => {
        if (item && typeof item === 'object') {
          this._recursiveEnhance(item, actual[index], types[index], result, [...path, index]);
        } else {
          types[index] = this._getDataType(item);
        }
      });
    } else if (sanitized && typeof sanitized === 'object') {
      Object.keys(sanitized).forEach(key => {
        const currentPath = [...path, key];
        const lowerKey = key.toLowerCase();
        
        // Check if field is sensitive
        const isSensitive = this.options.sensitiveFields.some(field => 
          lowerKey.includes(field.toLowerCase())
        );
        
        if (isSensitive) {
          result.hasSensitiveData = true;
          result.sensitiveFields.push({
            path: currentPath.join('.'),
            field: key,
            type: this._getDataType(sanitized[key]),
            actualValue: actual[key] // Store actual value for reference
          });
          sanitized[key] = '[REDACTED]';
          types[key] = this._getDataType(sanitized[key]);
        } else {
          if (sanitized[key] && typeof sanitized[key] === 'object') {
            this._recursiveEnhance(sanitized[key], actual[key], types[key], result, currentPath);
          } else {
            types[key] = this._getDataType(sanitized[key]);
          }
        }
      });
    }
  }

  /**
   * Get data type of a value
   * @param {*} value - Value to analyze
   * @returns {string} Data type description
   * @private
   */
  _getDataType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'number';
    }
    if (typeof value === 'string') {
      // Enhanced string type detection
      if (this._isEmail(value)) return 'email';
      if (this._isUrl(value)) return 'url';
      if (this._isDate(value)) return 'date';
      if (this._isUuid(value)) return 'uuid';
      if (this._isJson(value)) return 'json_string';
      return 'string';
    }
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return typeof value;
  }

  /**
   * Check if string is an email
   * @param {string} str - String to check
   * @returns {boolean} True if email
   * @private
   */
  _isEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  /**
   * Check if string is a URL
   * @param {string} str - String to check
   * @returns {boolean} True if URL
   * @private
   */
  _isUrl(str) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if string is a date
   * @param {string} str - String to check
   * @returns {boolean} True if date
   * @private
   */
  _isDate(str) {
    const date = new Date(str);
    return !isNaN(date.getTime()) && str.length > 4;
  }

  /**
   * Check if string is a UUID
   * @param {string} str - String to check
   * @returns {boolean} True if UUID
   * @private
   */
  _isUuid(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
  }

  /**
   * Check if string is JSON
   * @param {string} str - String to check
   * @returns {boolean} True if JSON
   * @private
   */
  _isJson(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Recursively sanitize object properties
   * Traverses object/array structures to find and redact sensitive fields
   * @param {Object|Array} obj - Object or array to sanitize
   * @param {Set} [visited] - Set of visited objects to prevent circular references
   * @private
   */
  _recursiveSanitize(obj, visited = new Set()) {
    if (Array.isArray(obj)) {
      obj.forEach(item => this._recursiveSanitize(item, visited));
    } else if (obj && typeof obj === 'object') {
      // Check for circular reference
      if (visited.has(obj)) {
        return;
      }
      visited.add(obj);
      
      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (this.options.sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
          obj[key] = '[REDACTED]';
        } else {
          this._recursiveSanitize(obj[key], visited);
        }
      });
    }
  }

  /**
   * Format duration in human-readable format
   * Converts milliseconds to human-readable time format
   * @param {number} duration - Duration in milliseconds
   * @returns {string} Formatted duration (e.g., '150ms', '2.5s', '1.2m')
   * @private
   */
  _formatDuration(duration) {
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(2)}s`;
    } else {
      return `${(duration / 60000).toFixed(2)}m`;
    }
  }

  /**
   * Get summary of captured data
   * Extracts key information from captured endpoint data for quick overview
   * @param {Object} endpointData - Captured endpoint data
   * @param {Object} endpointData.request - Request data
   * @param {Object} endpointData.response - Response data
   * @returns {Object} Summary object with key endpoint information
   * @returns {string} returns.method - HTTP method
   * @returns {string} returns.url - Request URL
   * @returns {number} returns.statusCode - Response status code
   * @returns {number} returns.duration - Request duration in milliseconds
   * @returns {string} returns.timestamp - Request timestamp
   * @returns {boolean} returns.hasRequestBody - Whether request has body
   * @returns {boolean} returns.hasResponseBody - Whether response has body
   * @returns {number} returns.headerCount - Number of request headers
   */
  getSummary(endpointData) {
    return {
      method: endpointData.request && endpointData.request.method,
      url: endpointData.request && endpointData.request.url,
      statusCode: endpointData.response && endpointData.response.statusCode,
      duration: endpointData.response && endpointData.response.duration,
      timestamp: endpointData.request && endpointData.request.timestamp,
      hasRequestBody: !!(endpointData.request && endpointData.request.body),
      hasResponseBody: !!(endpointData.response && endpointData.response.body),
      headerCount: Object.keys((endpointData.request && endpointData.request.headers) || {}).length
    };
  }

  /**
   * Export captured data to various formats
   * Converts captured endpoint data to different output formats
   * @param {Object} endpointData - Captured endpoint data
   * @param {string} [format='json'] - Export format ('json', 'csv', 'table')
   * @returns {string} Formatted data in the specified format
   * @example
   * const capture = new EndpointCapture();
   * const data = capture.captureEndpointData(req, res);
   * console.log(capture.exportData(data, 'table'));
   */
  exportData(endpointData, format = 'json') {
    if (!endpointData) {
      throw new Error('Endpoint data is required for export');
    }
    
    switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(endpointData, null, 2);
    case 'csv':
      return this._toCSV(endpointData);
    case 'table':
      return this._toTable(endpointData);
    default:
      return JSON.stringify(endpointData, null, 2);
    }
  }

  /**
   * Convert data to CSV format
   * Converts endpoint data summary to CSV format
   * @param {Object} endpointData - Captured endpoint data
   * @returns {string} CSV formatted data with headers and values
   * @private
   */
  _toCSV(endpointData) {
    const summary = this.getSummary(endpointData);
    const headers = Object.keys(summary).join(',');
    const values = Object.values(summary).map(val =>
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',');
    return `${headers}\n${values}`;
  }

  /**
   * Convert data to table format
   * Converts endpoint data summary to ASCII table format
   * @param {Object} endpointData - Captured endpoint data
   * @returns {string} ASCII table formatted data
   * @private
   */
  _toTable(endpointData) {
    const summary = this.getSummary(endpointData);
    let table = '┌─────────────────────────────────────────────────────────────┐\n';
    table += '│                    ENDPOINT CAPTURE SUMMARY                    │\n';
    table += '├─────────────────────────────────────────────────────────────┤\n';

    Object.entries(summary).forEach(([key, value]) => {
      const paddedKey = key.padEnd(20);
      const paddedValue = String(value).padStart(30);
      table += `│ ${paddedKey}: ${paddedValue} │\n`;
    });

    table += '└─────────────────────────────────────────────────────────────┘';
    return table;
  }

  /**
   * Get OpenAPI specification manager
   * Returns the collection manager instance if OpenAPI specification generation is enabled
   * @returns {CollectionManager|null} Collection manager instance or null if not enabled
   */
  getCollectionManager() {
    return this.collectionManager;
  }

  /**
   * Add endpoint to specific OpenAPI specification
   * Adds captured endpoint data to a specific OpenAPI specification
   * @param {string} collectionName - Name of the specification
   * @param {Object} endpointData - Captured endpoint data
   * @param {Object} [options={}] - Additional options for the specification
   * @returns {Object} The added path item object
   * @throws {Error} When OpenAPI specification generation is not enabled
   */
  addToOpenAPISpec(collectionName, endpointData, options = {}) {
    if (!this.collectionManager) {
      throw new Error('OpenAPI specification generation is not enabled');
    }
    return this.collectionManager.addEndpoint(collectionName, endpointData, options);
  }

  /**
   * Export OpenAPI specifications
   * Exports all managed OpenAPI specifications in the specified format
   * @param {string} [format='json'] - Export format ('json', 'yaml')
   * @param {Object} [options={}] - Export options
   * @param {boolean} [options.saveToFile=false] - Whether to save exports to file
   * @returns {Object} Exported specifications with metadata
   * @throws {Error} When OpenAPI specification generation is not enabled
   */
  exportOpenAPISpecs(format = 'json', options = {}) {
    if (!this.collectionManager) {
      throw new Error('OpenAPI specification generation is not enabled');
    }
    return this.collectionManager.exportAllCollections(format, options);
  }

  /**
   * Get OpenAPI specification statistics
   * Returns comprehensive statistics for all managed OpenAPI specifications
   * @returns {Object|Object} Statistics object or error object if not enabled
   * @returns {number} returns.totalCollections - Total number of specifications
   * @returns {number} returns.totalOperations - Total number of operations
   * @returns {number} returns.totalPaths - Total number of paths
   * @returns {Object} returns.collections - Statistics for each specification
   * @returns {Object} [returns.error] - Error message if not enabled
   */
  getOpenAPISpecStats() {
    if (!this.collectionManager) {
      return { error: 'OpenAPI specification generation is not enabled' };
    }
    return this.collectionManager.getAllStats();
  }

  /**
   * Create version snapshot of specifications
   * Creates versioned snapshots of all managed OpenAPI specifications
   * @param {string} version - Version identifier (e.g., '1.0.0', 'v2.1')
   * @returns {Object} Results object with version creation status for each specification
   * @returns {string} returns[collectionName] - Path to created version file or error message
   * @throws {Error} When OpenAPI specification generation is not enabled
   */
  createOpenAPISpecVersion(version) {
    if (!this.collectionManager) {
      throw new Error('OpenAPI specification generation is not enabled');
    }

    const results = {};
    this.collectionManager.collections.forEach((generator, name) => {
      try {
        results[name] = this.collectionManager.createVersion(name, version);
      } catch (error) {
        results[name] = { error: error.message };
      }
    });

    return results;
  }

  /**
   * Merge OpenAPI specifications
   * Combines multiple OpenAPI specifications into a single specification
   * @param {Array<string>} collectionNames - Names of specifications to merge
   * @param {string} targetName - Name of the merged specification
   * @param {Object} [options={}] - Merge options
   * @param {boolean} [options.prefixWithCollectionName=false] - Whether to prefix paths with collection name
   * @returns {OpenAPIGenerator} The merged specification generator
   * @throws {Error} When OpenAPI specification generation is not enabled
   */
  mergeOpenAPISpecs(collectionNames, targetName, options = {}) {
    if (!this.collectionManager) {
      throw new Error('OpenAPI specification generation is not enabled');
    }
    return this.collectionManager.mergeCollections(collectionNames, targetName, options);
  }
}

/**
 * Utility functions for manual data capture
 * Provides convenient static methods for common endpoint capture operations
 */
const utils = {
  /**
   * Create a new EndpointCapture instance
   * Factory method for creating EndpointCapture instances with configuration
   * @param {Object} [options={}] - Configuration options for the EndpointCapture instance
   * @returns {EndpointCapture} New EndpointCapture instance
   * @example
   * const capture = utils.create({ captureRequestBody: false });
   */
  create: (options) => new EndpointCapture(options),

  /**
   * Quick capture function for one-off usage
   * Convenience function for capturing endpoint data without creating an instance
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Object} [options={}] - Configuration options for capture
   * @returns {Object} Captured endpoint data
   * @example
   * const data = utils.quickCapture(req, res, { captureRequestBody: false });
   */
  quickCapture: (req, res, options = {}) => {
    const capture = new EndpointCapture(options);
    return capture.captureEndpointData(req, res);
  },

  /**
   * Format captured data for logging
   * Formats endpoint data into a structured log object with summary information
   * @param {Object} endpointData - Captured endpoint data
   * @param {string} [level='info'] - Log level ('info', 'debug', 'error')
   * @returns {Object} Formatted log data
   * @returns {string} returns.level - Log level
   * @returns {string} returns.message - Formatted log message
   * @returns {Object} returns.endpoint - Endpoint summary
   * @returns {string} returns.timestamp - Request timestamp
   * @returns {Object} returns.data - Full endpoint data
   * @example
   * const logData = utils.formatForLogging(endpointData, 'info');
   * console.log(logData.message); // "GET /api/users - 200 (150ms)"
   */
  formatForLogging: (endpointData, level = 'info') => {
    const summary = new EndpointCapture().getSummary(endpointData);
    return {
      level,
      message: `${summary.method} ${summary.url} - ${summary.statusCode} (${summary.duration}ms)`,
      endpoint: summary,
      timestamp: endpointData.request && endpointData.request.timestamp,
      data: endpointData
    };
  }
};

/**
 * Main module exports
 * @module endpoint-capture
 * @exports {EndpointCapture} EndpointCapture - Main EndpointCapture class
 * @exports {Object} utils - Utility functions for manual data capture
 * @exports {EndpointCapture} default - Default export (EndpointCapture class)
 */
module.exports = {
  EndpointCapture,
  utils,
  default: EndpointCapture
};
