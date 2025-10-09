const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const moment = require('moment');

/**
 * OpenAPI Specification Generator
 * Converts captured endpoint data to OpenAPI 3.0 specification format
 */
class OpenAPIGenerator {
  /**
   * Creates a new OpenAPIGenerator instance
   * @param {Object} [options={}] - Configuration options for the OpenAPI generator
   * @param {string} [options.title='API Collection'] - API title
   * @param {string} [options.description='Auto-generated from endpoint capture'] - API description
   * @param {string} [options.version='1.0.0'] - API version
   * @param {string} [options.baseUrl='http://localhost:3000'] - Base URL for the API
   * @param {string} [options.contactName] - Contact name for API info
   * @param {string} [options.contactEmail] - Contact email for API info
   * @param {string} [options.contactUrl] - Contact URL for API info
   * @param {string} [options.licenseName] - License name
   * @param {string} [options.licenseUrl] - License URL
   * @param {boolean} [options.includeExamples=true] - Whether to include response examples
   * @param {boolean} [options.includeSchemas=true] - Whether to generate request/response schemas
   * @param {boolean} [options.groupByPath=true] - Whether to group endpoints by path
   * @param {number} [options.maxVersions=10] - Maximum number of versions to keep
   * @param {string} [options.outputDir] - Output directory for the spec file
   * @param {boolean} [options.autoSave=true] - Whether to auto-save the spec
   * @param {boolean} [options.singleFileMode=true] - Whether to use single file mode
   * @param {boolean} [options.detectChanges=true] - Whether to detect changes in endpoints
   */
  constructor(options = {}) {
    this.options = {
      title: options.title || 'API Collection',
      description: options.description || 'Auto-generated from endpoint capture',
      version: options.version || '1.0.0',
      baseUrl: options.baseUrl || 'http://localhost:3000',
      contactName: options.contactName,
      contactEmail: options.contactEmail,
      contactUrl: options.contactUrl,
      licenseName: options.licenseName,
      licenseUrl: options.licenseUrl,
      includeExamples: options.includeExamples !== false,
      includeSchemas: options.includeSchemas !== false,
      groupByPath: options.groupByPath !== false,
      maxVersions: options.maxVersions || 10,
      outputDir: options.outputDir || path.resolve(process.cwd(), 'openapi-specs'),
      autoSave: options.autoSave !== false,
      singleFileMode: options.singleFileMode !== false,
      detectChanges: options.detectChanges !== false,
      ...options
    };

    // Store reference to storage instance if provided
    this.storage = options.storage || null;

    this.spec = this.createBaseSpec();
    this.endpointVersions = new Map(); // Track versions of each endpoint
    this.endpointHashes = new Map(); // Track endpoint content hashes for change detection
    this.ensureOutputDirectory();
  }

  /**
   * Create base OpenAPI specification structure
   * @returns {Object} Base OpenAPI 3.0 specification
   * @private
   */
  createBaseSpec() {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: this.options.title,
        description: this.options.description,
        version: this.options.version,
        contact: {},
        license: {}
      },
      servers: [
        {
          url: this.options.baseUrl,
          description: 'Default server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        responses: {},
        parameters: {},
        examples: {},
        requestBodies: {},
        headers: {},
        securitySchemes: {}
      },
      tags: [],
      security: []
    };

    // Add contact information if provided
    if (this.options.contactName || this.options.contactEmail || this.options.contactUrl) {
      spec.info.contact = {};
      if (this.options.contactName) spec.info.contact.name = this.options.contactName;
      if (this.options.contactEmail) spec.info.contact.email = this.options.contactEmail;
      if (this.options.contactUrl) spec.info.contact.url = this.options.contactUrl;
    } else {
      // Remove empty contact object
      delete spec.info.contact;
    }

    // Add license information if provided
    if (this.options.licenseName || this.options.licenseUrl) {
      spec.info.license = {};
      if (this.options.licenseName) spec.info.license.name = this.options.licenseName;
      if (this.options.licenseUrl) spec.info.license.url = this.options.licenseUrl;
    } else {
      // Remove empty license object
      delete spec.info.license;
    }

    return spec;
  }

  /**
   * Add captured endpoint data to OpenAPI specification
   * @param {Object} endpointData - Captured endpoint data
   * @param {Object} [options={}] - Additional options
   * @returns {Object} The added path item
   */
  async addEndpoint(endpointData, options = {}) {
    try {
      // Store original path before normalization
      const originalPath = endpointData.request.path;
      const normalizedPath = this.normalizePathForParameterization(originalPath);
      const normalizedEndpointData = {
        ...endpointData,
        request: {
          ...endpointData.request,
          path: normalizedPath,
          originalPath: originalPath
        }
      };

      const pathItem = this.convertToOpenAPIPathItem(normalizedEndpointData, options);

      // Generate endpoint key and hash for change detection using normalized path
      const endpointKey = `${endpointData.request.method}:${normalizedPath}`;
      const currentHash = this.calculateEndpointHash(normalizedEndpointData);

      // Check if change detection is enabled
      if (this.options.detectChanges) {
        const existingHash = this.endpointHashes.get(endpointKey);
        if (existingHash === currentHash) {
          // No changes detected, skip update
          console.log(`No changes detected for ${endpointKey}, skipping update`);
          return pathItem;
        }
      }

      // Update hash
      this.endpointHashes.set(endpointKey, currentHash);

      // Add or update the path in the specification
      if (!this.spec.paths[normalizedPath]) {
        this.spec.paths[normalizedPath] = {};
      }

      // Add the operation to the path
      this.spec.paths[normalizedPath][endpointData.request.method.toLowerCase()] = pathItem;

      // Add tags for grouping
      if (this.options.groupByPath) {
        this.addTagForPath(normalizedPath);
      }

      // Auto-save if enabled
      if (this.options.autoSave) {
        await this.saveSpec();
      }

      return pathItem;
    } catch (error) {
      console.error('Error adding endpoint to OpenAPI spec:', error);
      throw error;
    }
  }

  /**
   * Convert endpoint data to OpenAPI path item
   * @param {Object} endpointData - Captured endpoint data
   * @param {Object} [options={}] - Additional options
   * @returns {Object} OpenAPI path item
   * @private
   */
  convertToOpenAPIPathItem(endpointData, options = {}) {
    const { request, response } = endpointData;
    const method = request.method.toLowerCase();

    const operation = {
      summary: this.generateOperationSummary(request),
      description: this.generateOperationDescription(endpointData),
      operationId: this.generateOperationId(request),
      tags: this.generateTags(request),
      parameters: this.generateParameters(request),
      responses: this.generateResponses(response),
      security: this.generateSecurity(request),
      deprecated: false
    };

    // Add custom extensions for actual values and sensitive data metadata
    if (request.bodyActual || request.hasSensitiveData) {
      operation['x-actual-data'] = {
        requestBody: request.bodyActual || null,
        hasSensitiveData: request.hasSensitiveData || false,
        sensitiveFields: request.sensitiveFields || [],
        dataTypes: request.bodyTypes || null,
        capturedAt: endpointData.metadata?.capturedAt || new Date().toISOString()
      };
    }

    if (response.bodyActual || response.hasSensitiveData) {
      operation['x-actual-data'] = {
        ...operation['x-actual-data'],
        responseBody: response.bodyActual || null,
        responseHasSensitiveData: response.hasSensitiveData || false,
        responseSensitiveFields: response.sensitiveFields || [],
        responseDataTypes: response.bodyTypes || null
      };
    }

    // Add requestBody only for methods that support it
    const requestBody = this.generateRequestBody(request);
    if (requestBody) {
      operation.requestBody = requestBody;
    }

    // Add examples if enabled (but not at operation level)
    if (this.options.includeExamples) {
      // Examples are added to responses, not at operation level
    }

    return operation;
  }

  /**
   * Generate operation summary
   * @param {Object} request - Request data
   * @returns {string} Operation summary
   * @private
   */
  generateOperationSummary(request) {
    const method = request.method.toUpperCase();
    const path = request.path;
    return `${method} ${path}`;
  }

  /**
   * Generate operation description
   * @param {Object} endpointData - Complete endpoint data
   * @returns {string} Operation description
   * @private
   */
  generateOperationDescription(endpointData) {
    const { request, response, metadata } = endpointData;
    const method = request.method.toUpperCase();
    const path = request.path;
    const statusCode = response.statusCode;
    const duration = response.duration;

    let description = `**${method} ${path}**\n\n`;
    description += `- **Status Code**: ${statusCode}\n`;
    if (duration) {
      description += `- **Response Time**: ${duration}ms\n`;
    }
    if (metadata && metadata.capturedAt) {
      description += `- **Last Captured**: ${metadata.capturedAt}\n`;
    }

    return description;
  }

  /**
   * Generate operation ID
   * @param {Object} request - Request data
   * @returns {string} Operation ID
   * @private
   */
  generateOperationId(request) {
    const method = request.method.toLowerCase();
    const path = request.path
      .replace(/[{}]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    return `${method}_${path}`;
  }

  /**
   * Generate tags for the operation
   * @param {Object} request - Request data
   * @returns {Array<string>} Tags array
   * @private
   */
  generateTags(request) {
    if (!this.options.groupByPath) {
      return ['API'];
    }

    const pathParts = request.path.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      return [pathParts[0]];
    }
    return ['API'];
  }

  /**
   * Generate parameters for the operation
   * @param {Object} request - Request data
   * @returns {Array<Object>} Parameters array
   * @private
   */
  generateParameters(request) {
    const parameters = [];

    // Path parameters
    if (request.params && Object.keys(request.params).length > 0) {
      Object.keys(request.params).forEach(paramName => {
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: `Path parameter: ${paramName}`
        });
      });
    }

    // Query parameters
    if (request.query && Object.keys(request.query).length > 0) {
      Object.keys(request.query).forEach(queryName => {
        parameters.push({
          name: queryName,
          in: 'query',
          required: false,
          schema: {
            type: typeof request.query[queryName] === 'number' ? 'number' : 'string'
          },
          description: `Query parameter: ${queryName}`
        });
      });
    }

    // Only include relevant API headers (exclude browser headers)
    const relevantHeaders = ['authorization', 'x-api-key', 'x-auth-token', 'content-type', 'accept'];
    if (request.headers) {
      Object.keys(request.headers).forEach(headerName => {
        const lowerHeader = headerName.toLowerCase();
        if (relevantHeaders.includes(lowerHeader) || lowerHeader.startsWith('x-')) {
          parameters.push({
            name: headerName,
            in: 'header',
            required: false,
            schema: {
              type: 'string'
            },
            description: `Header: ${headerName}`
          });
        }
      });
    }

    return parameters;
  }

  /**
   * Generate request body schema
   * @param {Object} request - Request data
   * @returns {Object|null} Request body schema
   * @private
   */
  generateRequestBody(request) {
    if (!request.body || Object.keys(request.body).length === 0) {
      return null;
    }

    const contentType = request.contentType || 'application/json';
    const schema = this.generateSchemaFromData(request.body);

    const content = {
      [contentType]: {
        schema: schema
      }
    };

    // Add examples with both sanitized and actual values
    if (this.options.includeExamples) {
      content[contentType].examples = {
        sanitized: {
          summary: 'Sanitized Request Body (Safe to store)',
          description: 'Request body with sensitive data redacted',
          value: request.body
        }
      };

      // Add actual values if available
      if (request.bodyActual) {
        content[contentType].examples.actual = {
          summary: 'Actual Request Body (For reference)',
          description: 'Complete request body with actual values',
          value: request.bodyActual
        };
      }

      // Add data types if available
      if (request.bodyTypes) {
        content[contentType].examples.types = {
          summary: 'Data Types Analysis',
          description: 'Data type analysis for each field',
          value: request.bodyTypes
        };
      }
    }

    return {
      description: 'Request body',
      content: content,
      required: true
    };
  }

  /**
   * Generate responses schema
   * @param {Object} response - Response data
   * @returns {Object} Responses schema
   * @private
   */
  generateResponses(response) {
    const statusCode = response.statusCode;
    const responses = {};

    // Add the actual response
    responses[statusCode] = {
      description: this.getStatusDescription(statusCode),
      content: this.generateResponseContent(response),
      headers: this.generateResponseHeaders(response)
    };

    // Add common error responses
    if (statusCode >= 400) {
      responses['4xx'] = {
        description: 'Client Error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  description: 'Error message'
                },
                code: {
                  type: 'string',
                  description: 'Error code'
                }
              }
            }
          }
        }
      };
    }

    if (statusCode >= 500) {
      responses['5xx'] = {
        description: 'Server Error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  description: 'Error message'
                },
                code: {
                  type: 'string',
                  description: 'Error code'
                }
              }
            }
          }
        }
      };
    }

    return responses;
  }

  /**
   * Generate response content schema
   * @param {Object} response - Response data
   * @returns {Object} Response content schema
   * @private
   */
  generateResponseContent(response) {
    // Clean content type - remove charset and other parameters
    let contentType = 'application/json';
    if (response.headers && response.headers['content-type']) {
      contentType = response.headers['content-type'].split(';')[0].trim();
    }
    
    // Ensure we use standard content types
    if (!contentType || contentType === 'text/plain') {
      contentType = 'application/json';
    }
    
    if (!response.body) {
      return {
        [contentType]: {
          schema: {
            type: 'string',
            description: 'Empty response'
          }
        }
      };
    }

    const schema = this.generateSchemaFromData(response.body);

    const content = {
      [contentType]: {
        schema: schema
      }
    };

    // Add examples with both sanitized and actual values
    if (this.options.includeExamples) {
      content[contentType].examples = {
        sanitized: {
          summary: 'Sanitized Response Body (Safe to store)',
          description: 'Response body with sensitive data redacted',
          value: response.body
        }
      };

      // Add actual values if available
      if (response.bodyActual) {
        content[contentType].examples.actual = {
          summary: 'Actual Response Body (For reference)',
          description: 'Complete response body with actual values',
          value: response.bodyActual
        };
      }

      // Add data types if available
      if (response.bodyTypes) {
        content[contentType].examples.types = {
          summary: 'Data Types Analysis',
          description: 'Data type analysis for each field',
          value: response.bodyTypes
        };
      }
    }

    return content;
  }

  /**
   * Generate response headers
   * @param {Object} response - Response data
   * @returns {Object} Response headers schema
   * @private
   */
  generateResponseHeaders(response) {
    if (!response.headers) {
      return {};
    }

    const headers = {};
    Object.keys(response.headers).forEach(headerName => {
      headers[headerName] = {
        description: `Response header: ${headerName}`,
        schema: {
          type: 'string'
        }
      };
    });

    return headers;
  }

  /**
   * Generate security requirements
   * @param {Object} request - Request data
   * @returns {Array<Object>} Security requirements
   * @private
   */
  generateSecurity(request) {
    // Check if request has authorization header
    if (request.headers && request.headers.authorization) {
      return [
        {
          bearerAuth: []
        }
      ];
    }

    return [];
  }

  /**
   * Generate examples for the operation
   * @param {Object} endpointData - Complete endpoint data
   * @returns {Object} Examples object
   * @private
   */
  generateExamples(endpointData) {
    // Examples are now handled in response content, not at operation level
    return {};
  }

  /**
   * Generate schema from data object
   * @param {*} data - Data to generate schema from
   * @returns {Object} JSON Schema
   * @private
   */
  generateSchemaFromData(data) {
    if (data === null || data === undefined) {
      return { type: 'null' };
    }

    if (typeof data === 'boolean') {
      return { type: 'boolean' };
    }

    if (typeof data === 'number') {
      return { 
        type: 'number',
        example: data
      };
    }

    if (typeof data === 'string') {
      // Try to parse as JSON if it looks like JSON
      if (data.startsWith('[') || data.startsWith('{')) {
        try {
          const parsed = JSON.parse(data);
          return this.generateSchemaFromData(parsed);
        } catch (e) {
          // If parsing fails, treat as string
        }
      }
      return { 
        type: 'string',
        example: data
      };
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return { type: 'array', items: { type: 'string' } };
      }
      return {
        type: 'array',
        items: this.generateSchemaFromData(data[0])
      };
    }

    if (typeof data === 'object') {
      const properties = {};
      const required = [];

      Object.keys(data).forEach(key => {
        properties[key] = this.generateSchemaFromData(data[key]);
        if (data[key] !== null && data[key] !== undefined) {
          required.push(key);
        }
      });

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
        example: data
      };
    }

    return { type: 'string' };
  }

  /**
   * Get status code description
   * @param {number} statusCode - HTTP status code
   * @returns {string} Status description
   * @private
   */
  getStatusDescription(statusCode) {
    const descriptions = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error'
    };

    return descriptions[statusCode] || `Status ${statusCode}`;
  }

  /**
   * Add tag for path grouping
   * @param {string} path - API path
   * @private
   */
  addTagForPath(path) {
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const tagName = pathParts[0];
      const existingTag = this.spec.tags.find(tag => tag.name === tagName);
      if (!existingTag) {
        this.spec.tags.push({
          name: tagName,
          description: `Operations for ${tagName}`
        });
      }
    }
  }

  /**
   * Normalize path for parameterization
   * @param {string} path - Original path
   * @returns {string} Normalized path
   * @private
   */
  normalizePathForParameterization(path) {
    // Remove trailing slash and normalize numeric IDs to parameters
    return path.replace(/\/$/, '').replace(/\/\d+/g, '/{id}');
  }

  /**
   * Calculate hash for endpoint data
   * @param {Object} endpointData - Endpoint data
   * @returns {string} Hash string
   * @private
   */
  calculateEndpointHash(endpointData) {
    const hashData = {
      method: endpointData.request.method,
      path: endpointData.request.path,
      headers: endpointData.request.headers,
      body: endpointData.request.body,
      response: endpointData.response
    };

    return crypto.createHash('md5').update(JSON.stringify(hashData)).digest('hex');
  }

  /**
   * Save OpenAPI specification to file
   * @param {string} [filename] - Custom filename
   */
  async saveSpec(filename) {
    try {
      const outputPath = this.getOutputPath(filename);
      const specJson = JSON.stringify(this.spec, null, 2);
      
      if (this.storage) {
        // Use storage abstraction (S3, Azure, GCS, etc.)
        const relativePath = path.relative(this.options.outputDir, outputPath);
        await this.storage.writeFile(relativePath, specJson);
        console.log(`💾 OpenAPI spec saved to storage: ${relativePath} (${specJson.length} bytes)`);
      } else {
        // Fallback to local filesystem
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, specJson);
        console.log(`💾 OpenAPI spec saved to: ${outputPath} (${specJson.length} bytes)`);
      }
    } catch (error) {
      console.error('❌ Error saving OpenAPI spec:', error);
      throw error;
    }
  }

  /**
   * Get output path for the specification
   * @param {string} [filename] - Custom filename
   * @returns {string} Output path
   * @private
   */
  getOutputPath(filename) {
    if (filename) {
      return path.join(this.options.outputDir, filename);
    }

    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const baseName = this.sanitizeName(this.options.title);
    
    if (this.options.singleFileMode) {
      return path.join(this.options.outputDir, `${baseName}.json`);
    } else {
      return path.join(this.options.outputDir, `${baseName}_${timestamp}.json`);
    }
  }

  /**
   * Load existing OpenAPI specification
   * @param {string} filePath - Path to existing spec file
   */
  loadSpec(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const specData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.spec = { ...this.spec, ...specData };
        console.log(`OpenAPI spec loaded from: ${filePath}`);
      }
    } catch (error) {
      console.error('Error loading OpenAPI spec:', error);
    }
  }

  /**
   * Export OpenAPI specification
   * @param {string} [format='json'] - Export format
   * @returns {string} Exported specification
   */
  exportSpec(format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(this.spec, null, 2);
      case 'yaml':
        // Note: Would need yaml library for YAML export
        return JSON.stringify(this.spec, null, 2);
      default:
        return JSON.stringify(this.spec, null, 2);
    }
  }

  /**
   * Get statistics about the specification
   * @returns {Object} Statistics object
   */
  getStats() {
    const paths = Object.keys(this.spec.paths);
    const operations = paths.reduce((count, path) => {
      return count + Object.keys(this.spec.paths[path]).length;
    }, 0);

    return {
      totalPaths: paths.length,
      totalOperations: operations,
      totalTags: this.spec.tags.length,
      totalSchemas: Object.keys(this.spec.components.schemas).length,
      version: this.spec.info.version,
      title: this.spec.info.title
    };
  }

  /**
   * Ensure output directory exists
   * @private
   */
  ensureOutputDirectory() {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  /**
   * Sanitize name for file system use
   * @param {string} name - Name to sanitize
   * @returns {string} Sanitized name
   * @private
   */
  sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9-_]/g, '_');
  }
}

module.exports = OpenAPIGenerator;
