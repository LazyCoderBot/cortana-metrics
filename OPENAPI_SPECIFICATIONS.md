# 📚 OpenAPI Specification Generation

This document explains how to use the automatic OpenAPI specification generation feature of the endpoint-capture module.

## 🚀 Quick Start

```javascript
const { EndpointCapture } = require('endpoint-capture');

// Enable OpenAPI specification generation
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: './openapi-specs',
    defaultCollectionOptions: {
      title: 'My API',
      version: '1.0.0',
      baseUrl: 'http://localhost:3000'
    }
  }
});

// Use middleware - specifications will be generated automatically
app.use(capture.createMiddleware());
```

## 📋 Features

### ✨ Automatic Specification Generation
- **Real-time Updates**: OpenAPI specifications are updated automatically as requests are captured
- **Multiple Specifications**: Create different specifications based on rules (version, path, status, etc.)
- **Versioning**: Track different versions of your API endpoints
- **Backup System**: Automatic backups with configurable retention

### 🎯 Smart Organization
- **Path-based Grouping**: Organize endpoints by URL path with tags
- **Version-based Specifications**: Separate specifications for different API versions
- **Status-based Specifications**: Group by response status (success, error, etc.)
- **Custom Rules**: Define your own specification assignment logic

### 🔧 Rich API Documentation
- **Complete Request Data**: Headers, body, query parameters, path parameters
- **Response Information**: Status codes, headers, response body
- **Schema Generation**: Automatic JSON schema generation for request/response bodies
- **Examples**: Real response examples from captured data
- **Security**: Sensitive data is automatically redacted

### 🧪 Testing & Documentation
- **OpenAPI 3.0 Compliant**: Full OpenAPI 3.0 specification support
- **Interactive Documentation**: Generate Swagger UI compatible specifications
- **Schema Validation**: Automatic schema generation for data validation
- **Examples**: Real response examples from captured data

## ⚙️ Configuration

### Basic Configuration

```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: './openapi-specs',
    autoBackup: true,
    maxBackups: 5,
    singleFileMode: true,
    detectChanges: true,
    defaultCollectionOptions: {
      title: 'My API Documentation',
      description: 'Auto-generated API documentation',
      version: '1.0.0',
      baseUrl: 'http://localhost:3000',
      contactName: 'API Team',
      contactEmail: 'api@example.com',
      includeExamples: true,
      includeSchemas: true,
      groupByPath: true
    }
  }
});
```

### Advanced Configuration

```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: './openapi-specs',
    autoBackup: true,
    maxBackups: 10,
    watchMode: true,
    singleFileMode: false,
    detectChanges: true,
    
    // Storage configuration
    storage: {
      type: 's3',
      options: {
        bucket: 'my-api-specs',
        region: 'us-east-1'
      }
    },
    
    defaultCollectionOptions: {
      title: 'My API',
      description: 'Comprehensive API documentation',
      version: '2.0.0',
      baseUrl: 'https://api.example.com',
      contactName: 'API Team',
      contactEmail: 'api@example.com',
      contactUrl: 'https://example.com/contact',
      licenseName: 'MIT',
      licenseUrl: 'https://opensource.org/licenses/MIT',
      includeExamples: true,
      includeSchemas: true,
      groupByPath: true
    },
    
    collectionRules: {
      defaultCollection: 'Main API',
      versionBased: true,
      pathBased: true,
      statusBased: false,
      environmentBased: true,
      environment: 'production'
    }
  }
});
```

## 📖 Usage Examples

### Basic Usage

```javascript
const express = require('express');
const { EndpointCapture } = require('endpoint-capture');

const app = express();
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: './openapi-specs'
  }
});

app.use(capture.createMiddleware());

// Your API routes
app.get('/api/users', (req, res) => {
  res.json([{ id: 1, name: 'John' }]);
});

app.listen(3000);
```

### Manual Specification Management

```javascript
// Add endpoint to specific specification
capture.addToOpenAPISpec('Users API', endpointData, {
  includeExamples: true,
  includeSchemas: true
});

// Export specifications
const exports = capture.exportOpenAPISpecs('json', { saveToFile: true });

// Get statistics
const stats = capture.getOpenAPISpecStats();
console.log('Total operations:', stats.totalOperations);

// Create version
const version = capture.createOpenAPISpecVersion('1.0.0');

// Merge specifications
const merged = capture.mergeOpenAPISpecs(
  ['Users API', 'Products API'], 
  'Complete API',
  { prefixWithCollectionName: true }
);
```

### Custom Rules

```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    collectionRules: {
      defaultCollection: 'Main API',
      versionBased: true,
      pathBased: true,
      statusBased: true,
      environmentBased: true,
      environment: 'production',
      custom: (endpointData) => {
        // Custom logic for specification assignment
        if (endpointData.request.path.startsWith('/admin')) {
          return [{ collectionName: 'Admin API', options: {} }];
        }
        return [];
      }
    }
  }
});
```

## 📁 Generated Files

The module generates the following files:

```
openapi-specs/
├── Main_API.json              # Main specification file
├── backups/                   # Backup files
│   ├── Main_API_backup_2024-01-01_10-30-00.json
│   └── ...
├── versions/                  # Version snapshots
│   ├── Main_API_v1.0.0.json
│   └── ...
└── all_specifications_2024-01-01_10-30-00.json  # Export file
```

## 🔧 API Reference

### EndpointCapture Methods

- `addToOpenAPISpec(collectionName, endpointData, options)` - Add endpoint to specific specification
- `exportOpenAPISpecs(format, options)` - Export all specifications
- `getOpenAPISpecStats()` - Get specification statistics
- `createOpenAPISpecVersion(version)` - Create version snapshot
- `mergeOpenAPISpecs(collectionNames, targetName, options)` - Merge specifications

### CollectionManager Methods

- `getCollection(name, options)` - Get or create specification
- `addEndpoint(collectionName, endpointData, options)` - Add endpoint
- `addEndpointWithRules(endpointData, rules)` - Add with rules
- `exportAllCollections(format, options)` - Export all
- `getAllStats()` - Get statistics
- `createVersion(collectionName, version)` - Create version
- `mergeCollections(collectionNames, targetName, options)` - Merge specifications

## 🎨 Generated OpenAPI Structure

The generated OpenAPI specifications include:

- **Info**: Title, description, version, contact, license
- **Servers**: Base URLs and descriptions
- **Paths**: All captured endpoints with full operation details
- **Components**: Schemas, responses, parameters, examples
- **Tags**: Automatic grouping by path segments
- **Security**: Authentication schemes when detected

## 🔍 Example Generated Specification

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "My API Documentation",
    "description": "Auto-generated API documentation",
    "version": "1.0.0",
    "contact": {
      "name": "API Team",
      "email": "api@example.com"
    }
  },
  "servers": [
    {
      "url": "http://localhost:3000",
      "description": "Default server"
    }
  ],
  "paths": {
    "/api/users": {
      "get": {
        "summary": "GET /api/users",
        "description": "**GET /api/users**\n\n- **Status Code**: 200\n- **Response Time**: 45ms",
        "operationId": "get_api_users",
        "tags": ["api"],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": { "type": "number" },
                      "name": { "type": "string" },
                      "email": { "type": "string" }
                    }
                  }
                },
                "examples": {
                  "example": {
                    "summary": "Example response",
                    "value": [{"id": 1, "name": "John", "email": "john@example.com"}]
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {},
    "responses": {},
    "parameters": {},
    "examples": {},
    "requestBodies": {},
    "headers": {},
    "securitySchemes": {}
  },
  "tags": [
    {
      "name": "api",
      "description": "Operations for api"
    }
  ]
}
```

## 🚀 Integration with Swagger UI

You can use the generated OpenAPI specifications with Swagger UI:

```javascript
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');

// Load generated specification
const spec = JSON.parse(fs.readFileSync('./openapi-specs/Main_API.json', 'utf8'));

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
```

## 🔧 Advanced Features

### Custom Schema Generation

The module automatically generates JSON schemas from captured data, but you can customize this behavior:

```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    defaultCollectionOptions: {
      includeSchemas: true,  // Enable schema generation
      includeExamples: true  // Enable example generation
    }
  }
});
```

### Change Detection

Enable change detection to avoid unnecessary updates:

```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    detectChanges: true  // Only update when endpoint data changes
  }
});
```

### Multiple Specifications

Create different specifications for different purposes:

```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    collectionRules: {
      defaultCollection: 'Main API',
      versionBased: true,    // Create version-specific specs
      pathBased: true,        // Create path-based specs
      statusBased: true       // Create status-based specs
    }
  }
});
```

This will create specifications like:
- `Main API.json` - Main specification
- `API v1.0.0.json` - Version-specific
- `users API.json` - Path-based
- `Success Responses.json` - Status-based
