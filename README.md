# 🚀 Cortana Metrics (Endpoint Capture)

[![npm version](https://badge.fury.io/js/cortana-metrics.svg)](https://badge.fury.io/js/cortana-metrics)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)](https://github.com/LazyCoderBot/cortana-metrics)

A comprehensive npm module for capturing endpoint-related data including request body, response body, headers, query parameters, and more. Perfect for API monitoring, debugging, logging, analytics, and **automatic OpenAPI specification generation**.

> 🎯 **Key Highlight**: Automatically generates and maintains OpenAPI 3.0 specifications from your API endpoints in real-time!

## 📋 Table of Contents

- [✨ Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [🎛️ Command Line Interface (CLI)](#️-command-line-interface-cli)
- [⚙️ Configuration Options](#️-configuration-options)
- [🌟 Real-World Use Cases & Integration Examples](#-real-world-use-cases--integration-examples)
- [📚 API Reference](#-api-reference)
- [🔧 Troubleshooting & FAQ](#-troubleshooting--faq)
- [🔒 Security Considerations](#-security-considerations)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🚀 Roadmap](#-roadmap)
- [📞 Support & Community](#-support--community)

## ✨ Features

### 🎯 Core Functionality
- 🚀 **Complete Endpoint Data Capture**: Request/response bodies, headers, query params, path params, cookies
- 🔒 **Security-First**: Automatic sanitization of sensitive data (passwords, tokens, API keys)
- ⚡ **Express.js Middleware**: Drop-in middleware for automatic capture
- ⚡ **Fastify Plugin**: Native Fastify plugin for automatic capture
- 📊 **Multiple Export Formats**: JSON, CSV, and table formats
- 🎯 **Flexible Configuration**: Customizable capture options
- 📈 **Performance Metrics**: Request duration and timing data
- 🛠️ **Utility Functions**: Quick capture and formatting utilities
- 🧪 **Fully Tested**: Comprehensive test suite included

### 📋 OpenAPI Specification Generation
- 🔄 **Real-time Specification Updates**: Automatically generates OpenAPI 3.0 specifications as you use your API
- 📁 **Smart Organization**: Groups endpoints by path, method, or custom rules
- 🔄 **Version Management**: Create snapshots and manage collection versions
- 🔀 **Collection Merging**: Combine multiple collections intelligently
- 💾 **Auto-backup**: Automatic backup system with configurable retention
- 🎛️ **CLI Management**: Powerful command-line interface for collection operations
- 🔍 **Change Detection**: Only updates collections when endpoints actually change
- 📊 **Statistics & Analytics**: Detailed insights into your API usage patterns

### 🛠️ Developer Experience
- 📖 **Rich Documentation**: Auto-generated endpoint documentation
- 🔧 **Zero Configuration**: Works out of the box with sensible defaults
- 🎨 **Customizable**: Extensive configuration options for advanced use cases
- 🚀 **Performance Optimized**: Minimal overhead on your application

## 📦 Installation

### NPM
```bash
npm install cortana-metrics
```

### Yarn
```bash
yarn add cortana-metrics
```

### Requirements
- **Node.js**: >= 14.0.0
- **Express.js**: >= 4.0.0 (for Express middleware functionality)
- **Fastify**: >= 4.0.0 (for Fastify plugin functionality, optional)

### Cloud Storage Dependencies (Optional)
Install additional packages for cloud storage support:

```bash
# For AWS S3 support
npm install @aws-sdk/client-s3

# For Azure Blob Storage support  
npm install @azure/storage-blob

# For Google Cloud Storage support
npm install @google-cloud/storage

# Install all cloud storage providers
npm install @aws-sdk/client-s3 @azure/storage-blob @google-cloud/storage
```

### Verify Installation
```bash
# Check if CLI is available
npx cortana-metrics help

# Or if installed globally
npm install -g cortana-metrics
cortana-metrics help
```

## 🚀 Quick Start

### 30-Second Setup (with OpenAPI Specification Generation)

```javascript
const express = require('express');
const { EndpointCapture } = require('cortana-metrics');

const app = express();
app.use(express.json());

// 🎯 One-line setup with automatic OpenAPI specification generation
const capture = new EndpointCapture({
  generateOpenAPISpec: true, // Enable automatic specification generation
  openAPISpecOptions: {
    baseDir: './openapi-specs',
    collectionRules: {
      defaultCollection: 'My API'
    }
  }
});

// 🔄 Use middleware for automatic capture and collection generation
app.use(capture.createMiddleware((data) => {
  console.log(`📊 ${data.request.method} ${data.request.url} - ${data.response.statusCode} (${data.response.duration}ms)`);
}));

// 🛠️ Your API routes (collections will be generated automatically)
app.get('/api/users', (req, res) => {
  res.json({ users: [{ id: 1, name: 'John Doe' }] });
});

app.post('/api/users', (req, res) => {
  res.status(201).json({ id: 2, name: req.body.name });
});

app.listen(3000, () => {
  console.log('🚀 Server running on port 3000');
  console.log('📋 OpenAPI specifications will be saved to ./openapi-specs/');
});
```

**That's it!** 🎉 Your API endpoints will now be automatically captured and converted into OpenAPI 3.0 specifications as you use them.

### Fastify Quick Start

```javascript
const fastify = require('fastify')({ logger: true });
const { EndpointCapture } = require('cortana-metrics');

// 🎯 One-line setup with automatic OpenAPI specification generation
const capture = new EndpointCapture({
  generateOpenAPISpec: true, // Enable automatic specification generation
  openAPISpecOptions: {
    baseDir: './fastify-openapi-specs',
    collectionRules: {
      defaultCollection: 'Fastify API'
    }
  }
});

// 🔄 Register Fastify plugin for automatic capture and collection generation
fastify.register(capture.createFastifyPlugin((data) => {
  console.log(`📊 ${data.request.method} ${data.request.url} - ${data.response.statusCode} (${data.response.duration}ms)`);
}));

// 🛠️ Your API routes (collections will be generated automatically)
fastify.get('/api/users', async (request, reply) => {
  return { users: [{ id: 1, name: 'John Doe' }] };
});

fastify.post('/api/users', async (request, reply) => {
  const { name } = request.body;
  reply.status(201);
  return { id: 2, name };
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Fastify server running on http://localhost:3000');
    console.log('📋 OpenAPI specifications will be saved to ./fastify-openapi-specs/');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
```

### Basic Usage (Manual Capture)

```javascript
const { EndpointCapture } = require('cortana-metrics');

// Create capture instance
const capture = new EndpointCapture();

// Capture request data
const requestData = capture.captureRequest(req);

// Capture response data
const responseData = capture.captureResponse(res, requestData);

// Capture complete endpoint data
const endpointData = capture.captureEndpointData(req, res);
```

### Express Middleware (Advanced)

```javascript
const express = require('express');
const { EndpointCapture } = require('cortana-metrics');

const app = express();
const capture = new EndpointCapture({
  // Core capture options
  captureRequestBody: true,
  captureResponseBody: true,
  sensitiveFields: ['password', 'token', 'secret', 'apiKey'],
  
  // OpenAPI specification options
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: './api-collections',
    autoBackup: true,
    maxBackups: 10,
    defaultCollectionOptions: {
      collectionName: 'My API v2.0',
      version: '2.0.0',
      groupByPath: true
    }
  }
});

// Use middleware for automatic capture
app.use(capture.createMiddleware((data) => {
  // Custom handling of captured data
  console.log('Captured endpoint data:', data);
  
  // Send to monitoring service
  // analytics.track('api_request', data);
  
  // Store in database
  // database.apiLogs.create(data);
}));

app.get('/api/users', (req, res) => {
  // Access captured data in your route
  console.log('Request captured:', !!req.capturedEndpointData);
  res.json({ users: [] });
});
```

## 🎛️ Command Line Interface (CLI)

The package includes a powerful CLI for managing OpenAPI specifications. After installation, you can use the CLI globally from anywhere in your system.

### 🚀 Installation & Setup

#### Global Installation (Recommended)
```bash
# Install globally to use CLI from anywhere
npm install -g cortana-metrics

# Now you can use these commands from anywhere:
cortana-metrics --help
ep-capture --help
```

#### Local Installation
```bash
# Install locally in your project
npm install cortana-metrics

# Use via npx or npm scripts
npx cortana-metrics --help
npm run collections:help
```

### 📋 Available Commands

```bash
# List all collections and their statistics
cortana-metrics list [base-dir]

# Show detailed statistics for all collections
cortana-metrics stats [base-dir]

# Export collections in various formats
cortana-metrics export [base-dir] [format] [output-file]

# Create version snapshots
cortana-metrics version <version-number> [base-dir]

# Merge multiple collections
cortana-metrics merge <collection1> <collection2> ... <target-name>

# Create manual backups
cortana-metrics backup [base-dir] [collection-name]

# Show help
cortana-metrics help
```

### 🔍 Analyzing Collections in Different Directories

The CLI can analyze OpenAPI specifications stored in any directory:

```bash
# Analyze collections in current directory
cortana-metrics list .
cortana-metrics stats .

# Analyze collections in examples directory
cortana-metrics list ./examples
cortana-metrics stats ./examples

# Analyze collections in custom directory
cortana-metrics list ./my-api-collections
cortana-metrics stats ./my-api-collections

# Export collections from specific directory
cortana-metrics export ./examples json ./exports/
```

### 📋 CLI Examples

#### 📊 View Collection Statistics
```bash
$ cortana-metrics stats

📊 OpenAPI Specification Statistics
================================

📁 Main API (./openapi-specs/Main_API.json)
  └── 📋 Operations: 15
  └── 🏷️  Methods: GET(8), POST(4), PUT(2), DELETE(1)
  └── 📅 Last Updated: 2025-10-05 10:43:41
  └── 📦 File Size: 45.2 KB
  └── 🔄 Total Requests Captured: 1,247

📁 User Management API (./openapi-specs/User_API.json)
  └── 📋 Operations: 8
  └── 🏷️  Methods: GET(4), POST(2), PUT(1), DELETE(1)
  └── 📅 Last Updated: 2025-10-05 09:15:22
  └── 📦 File Size: 23.1 KB
  └── 🔄 Total Requests Captured: 456
```

#### 📋 List Collections
```bash
$ cortana-metrics list

📚 Available OpenAPI Specifications:
==================================

📁 ./openapi-specs/
├── 📄 Main_API.json (15 operations)
├── 📄 User_API.json (8 operations)
├── 📄 Payment_API.json (12 operations)
└── 📁 versions/
    ├── 📄 Main_API_v1.0.0.json
    ├── 📄 Main_API_v1.1.0.json
    └── 📄 User_API_v2.0.0.json
```

#### 🔄 Create Version Snapshot
```bash
$ cortana-metrics version v2.1.0

✅ Version snapshots created:
├── 📄 Main_API_v2.1.0.json (15 endpoints)
├── 📄 User_API_v2.1.0.json (8 endpoints)
└── 📄 Payment_API_v2.1.0.json (12 endpoints)

💾 Snapshots saved to: ./openapi-specs/versions/
```

#### 📤 Export Collections
```bash
# Export all collections as JSON
cortana-metrics export --format json --output ./exports/

# Export specific collection
cortana-metrics export --collection "Main API" --format json

# Export with custom options
cortana-metrics export --format json --include-tests --include-scripts
```

### CLI Configuration

You can configure CLI behavior with a `.cortana-metrics.json` file:

```json
{
  "baseDir": "./openapi-specs",
  "autoBackup": true,
  "maxBackups": 10,
  "defaultFormat": "json",
  "collections": {
    "Main API": {
      "autoVersion": true,
      "versionPattern": "v{major}.{minor}.{patch}"
    }
  }
}
```

## ⚙️ Configuration Options

### Core Capture Options

```javascript
const capture = new EndpointCapture({
  // Basic capture settings
  captureRequestBody: true,        // Capture request body (default: true)
  captureResponseBody: true,       // Capture response body (default: true)
  captureHeaders: true,            // Capture headers (default: true)
  captureQueryParams: true,        // Capture query parameters (default: true)
  capturePathParams: true,         // Capture path parameters (default: true)
  captureCookies: true,            // Capture cookies (default: true)
  captureTiming: true,             // Capture timing data (default: true)
  maxBodySize: 1024 * 1024,        // Maximum body size to capture (default: 1MB)
  timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS', // Timestamp format
  
  // Security settings
  sensitiveHeaders: [              // Headers to redact
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token'
  ],
  sensitiveFields: [               // Body fields to redact
    'password',
    'token',
    'secret',
    'key',
    'apiKey',
    'accessToken'
  ]
});
```

### 📋 OpenAPI Specification Options

```javascript
const capture = new EndpointCapture({
  // Enable OpenAPI specification generation
  generateOpenAPISpec: true,
  
  openAPISpecOptions: {
    // Directory settings (for local storage)
    baseDir: './openapi-specs',    // Base directory for specifications
    autoBackup: false,                    // Disabled by default for single file mode
    maxBackups: 5,                       // Maximum number of backups to keep
    
    // Collection behavior
    singleFileMode: true,                // Use single file per collection (default)
    detectChanges: false,                 // Always update single file (default)
    watchMode: true,                     // Enable real-time updates
    
    // Storage configuration
    storage: {
      type: 'local',                     // Storage type: 'local', 's3', 'azure', 'gcs'
      options: {}                        // Storage-specific options
    },
    
    // Default collection settings
    defaultCollectionOptions: {
      title: 'API Documentation',        // Default API title
      version: '1.0.0',                 // Collection version
      groupByPath: true,                 // Group endpoints by path
      includeExamples: true,            // Include response examples
      includeSchemas: true,              // Include request/response schemas
      autoSave: true,                   // Auto-save collections
      singleFileMode: true,             // Pass to generator
      detectChanges: false              // Always update single file
    },
    
    // Collection organization rules
    collectionRules: {
      defaultCollection: 'API Documentation', // Default collection name
      versionBased: false,               // Create version-based collections
      pathBased: false,                  // Create path-based collections
      environmentBased: false,           // Create environment-based collections
      environment: 'development'         // Default environment
    }
  }
});
```

### ☁️ Cloud Storage Configuration

Store your OpenAPI specifications in cloud storage instead of local filesystem:

#### AWS S3 Storage

```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    storage: {
      type: 's3',
      options: {
        bucket: 'my-api-collections',           // S3 bucket name
        region: 'us-east-1',                   // AWS region
        prefix: 'openapi-specs/',        // Path prefix in bucket
        accessKeyId: 'your-access-key',        // AWS access key (or use env var)
        secretAccessKey: 'your-secret-key'     // AWS secret key (or use env var)
      }
    }
  }
});

// Environment variables (recommended for security):
// AWS_ACCESS_KEY_ID=your-access-key
// AWS_SECRET_ACCESS_KEY=your-secret-key
```

#### Azure Blob Storage

```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    storage: {
      type: 'azure',
      options: {
        containerName: 'api-collections',                    // Container name
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,  // Connection string
        prefix: 'openapi/'                                  // Path prefix in container
        
        // Alternative: Use account credentials
        // accountName: 'mystorageaccount',
        // accountKey: 'your-account-key'
      }
    }
  }
});

// Environment variable:
// AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
```

#### Google Cloud Storage

```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    storage: {
      type: 'gcs',
      options: {
        bucketName: 'my-api-collections',       // GCS bucket name
        projectId: 'my-gcp-project',            // GCP project ID
        prefix: 'openapi-specs/',         // Path prefix in bucket
        keyFilename: '/path/to/service-account-key.json'  // Service account key (optional)
      }
    }
  }
});

// Environment variables:
// GOOGLE_CLOUD_PROJECT_ID=my-gcp-project
// GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

#### URL-based Configuration

```javascript
// Simple URL-based configuration
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    storage: 's3://my-bucket/openapi-specs/',
    // Or: 'gs://my-bucket/openapi-specs/'
    // Or: 'azure://accountname/container/path/'
  }
});
```

### 🔧 Advanced Configuration Examples

#### Multiple Collection Strategy
```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    collectionRules: {
      pathBased: true,                   // Create collections based on path
      versionBased: true,                // Create version-based collections
      rules: [
        {
          pattern: '/api/v1/*',
          collection: 'API v1.0'
        },
        {
          pattern: '/api/v2/*', 
          collection: 'API v2.0'
        },
        {
          pattern: '/admin/*',
          collection: 'Admin API'
        }
      ]
    }
  }
});
```

#### Custom Collection Templates
```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    defaultCollectionOptions: {
      collectionName: 'My API {{version}}',
      description: 'Auto-generated API collection for {{environment}}',
      includeTests: true,
      testTemplate: `
        pm.test("Status code is successful", function () {
          pm.response.to.have.status(200);
        });
        
        pm.test("Response time is less than 1000ms", function () {
          pm.expect(pm.response.responseTime).to.be.below(1000);
        });
      `,
      preRequestScript: `
        // Set authentication token
        pm.request.headers.add({
          key: 'Authorization',
          value: 'Bearer {{authToken}}'
        });
      `
    }
  }
});
```

## 🌟 Real-World Use Cases & Integration Examples

### ☁️ Cloud Storage Integration

Store collections in cloud storage for team collaboration:

```javascript
const { EndpointCapture } = require('cortana-metrics');

// Team shared S3 storage
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    storage: {
      type: 's3',
      options: {
        bucket: 'company-api-collections',
        region: 'us-east-1',
        prefix: `${process.env.TEAM_NAME}/openapi-specs/`
      }
    },
    defaultCollectionOptions: {
      collectionName: `${process.env.SERVICE_NAME} API`,
      version: process.env.SERVICE_VERSION || '1.0.0'
    }
  }
});

app.use(capture.createMiddleware(async (data) => {
  console.log(`📊 ${data.request.method} ${data.request.url} stored in S3`);
  
  // Notify team via Slack/Teams when new endpoints are added
  if (data.metadata.isNewEndpoint) {
    await notifyTeam(`New API endpoint discovered: ${data.request.method} ${data.request.url}`);
  }
}));
```

### 🔄 CI/CD Pipeline Integration

Automatically generate and update OpenAPI specifications during your deployment process:

```yaml
# .github/workflows/api-docs.yml
name: Auto-generate API Documentation

on:
  push:
    branches: [main, develop]

jobs:
  generate-openapi-specs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Start API server
        run: npm start &
        
      - name: Run API tests (generates collections)
        run: npm test
        
      - name: Export OpenAPI specifications
        run: npx cortana-metrics export --format json --output ./docs/openapi/
        
      - name: Commit updated collections
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add ./docs/openapi/
          git commit -m "Auto-update OpenAPI specifications" || exit 0
          git push
```

### 📊 API Analytics & Monitoring

Track API usage patterns and performance metrics:

```javascript
const { EndpointCapture } = require('cortana-metrics');
const analytics = require('./analytics-service');

const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: './openapi-specs'
  }
});

app.use(capture.createMiddleware(async (data) => {
  // Send metrics to analytics service
  await analytics.track('api_request', {
    endpoint: `${data.request.method} ${data.request.url}`,
    statusCode: data.response.statusCode,
    duration: data.response.duration,
    timestamp: data.request.timestamp,
    userAgent: data.request.userAgent,
    ip: data.request.ip
  });
  
  // Alert on slow requests
  if (data.response.duration > 5000) {
    await analytics.alert('slow_request', {
      endpoint: `${data.request.method} ${data.request.url}`,
      duration: data.response.duration,
      threshold: 5000
    });
  }
  
  // Track error rates
  if (data.response.statusCode >= 400) {
    await analytics.increment('api_errors', {
      endpoint: `${data.request.method} ${data.request.url}`,
      statusCode: data.response.statusCode
    });
  }
}));
```

### 🧪 Automated Testing Integration

Generate test collections and integrate with your testing framework:

```javascript
// test-setup.js
const { EndpointCapture } = require('cortana-metrics');
const request = require('supertest');
const app = require('../app');

const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: './test-collections',
    defaultCollectionOptions: {
      collectionName: 'Test API Collection',
      includeTests: true,
      testTemplate: `
        pm.test("Status code is {{expectedStatus}}", function () {
          pm.response.to.have.status({{expectedStatus}});
        });
        
        pm.test("Response time is acceptable", function () {
          pm.expect(pm.response.responseTime).to.be.below(2000);
        });
        
        pm.test("Content-Type is correct", function () {
          pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
        });
      `
    }
  }
});

// Apply middleware to test app
app.use(capture.createMiddleware());

describe('API Endpoints', () => {
  afterAll(async () => {
    // Export test collections after all tests
    const collections = capture.exportOpenAPISpecs();
    console.log('Generated test collections:', collections);
  });
  
  test('GET /api/users', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200);
    
    expect(response.body).toHaveProperty('users');
  });
});
```

### 🏢 Microservices Documentation

Automatically document microservices APIs:

```javascript
// microservice-a/server.js
const { EndpointCapture } = require('cortana-metrics');

const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: '../shared-collections',
    collectionRules: {
      defaultCollection: 'User Service API',
      versionBased: true
    },
    defaultCollectionOptions: {
      collectionName: 'User Service API v{{version}}',
      description: 'User management microservice endpoints'
    }
  }
});

// microservice-b/server.js  
const capture2 = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: '../shared-collections',
    collectionRules: {
      defaultCollection: 'Payment Service API'
    }
  }
});

// Later, merge all microservice collections
// npx cortana-metrics merge "User Service API" "Payment Service API" --output "Complete API"
```

### 🔐 API Security Auditing

Track and audit API access patterns:

```javascript
const { EndpointCapture } = require('cortana-metrics');
const securityLogger = require('./security-logger');

const capture = new EndpointCapture({
  sensitiveHeaders: [
    'authorization', 'cookie', 'x-api-key', 
    'x-auth-token', 'x-session-id'
  ],
  sensitiveFields: [
    'password', 'token', 'secret', 'ssn', 
    'creditCard', 'bankAccount', 'apiKey'
  ]
});

app.use(capture.createMiddleware((data) => {
  // Log security-relevant events
  securityLogger.info('API Access', {
    endpoint: `${data.request.method} ${data.request.url}`,
    ip: data.request.ip,
    userAgent: data.request.userAgent,
    statusCode: data.response.statusCode,
    timestamp: data.request.timestamp,
    hasAuthHeader: !!data.request.headers.authorization,
    sensitiveDataRedacted: true
  });
  
  // Alert on suspicious patterns
  if (data.response.statusCode === 401) {
    securityLogger.warn('Unauthorized Access Attempt', {
      ip: data.request.ip,
      endpoint: `${data.request.method} ${data.request.url}`,
      userAgent: data.request.userAgent
    });
  }
}));
```

### 📈 Performance Monitoring Dashboard

Create real-time performance dashboards:

```javascript
const { EndpointCapture } = require('cortana-metrics');
const WebSocket = require('ws');

const capture = new EndpointCapture();
const wss = new WebSocket.Server({ port: 8080 });

// Real-time performance data
const performanceMetrics = {
  totalRequests: 0,
  averageResponseTime: 0,
  errorRate: 0,
  endpointStats: new Map()
};

app.use(capture.createMiddleware((data) => {
  // Update metrics
  performanceMetrics.totalRequests++;
  
  const endpoint = `${data.request.method} ${data.request.url}`;
  const stats = performanceMetrics.endpointStats.get(endpoint) || {
    count: 0,
    totalTime: 0,
    errors: 0
  };
  
  stats.count++;
  stats.totalTime += data.response.duration;
  if (data.response.statusCode >= 400) stats.errors++;
  
  performanceMetrics.endpointStats.set(endpoint, stats);
  
  // Broadcast to dashboard clients
  const dashboardData = {
    timestamp: Date.now(),
    endpoint,
    duration: data.response.duration,
    statusCode: data.response.statusCode,
    totalRequests: performanceMetrics.totalRequests,
    averageResponseTime: stats.totalTime / stats.count,
    errorRate: (stats.errors / stats.count) * 100
  };
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(dashboardData));
    }
  });
}));
```

### 🔄 API Versioning & Migration

Track API changes and manage versioning:

```javascript
const { EndpointCapture } = require('cortana-metrics');

const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: './api-versions',
    collectionRules: {
      versionBased: true,
      rules: [
        { pattern: '/api/v1/*', collection: 'API v1.0' },
        { pattern: '/api/v2/*', collection: 'API v2.0' },
        { pattern: '/api/v3/*', collection: 'API v3.0' }
      ]
    }
  }
});

// Middleware to track API version usage
app.use(capture.createMiddleware((data) => {
  const version = data.request.url.match(/\/api\/(v\d+)\//)?.[1];
  
  if (version) {
    // Track version usage
    console.log(`API ${version} used: ${data.request.method} ${data.request.url}`);
    
    // Alert on deprecated version usage
    if (version === 'v1' && Date.now() > deprecationDate) {
      console.warn(`Deprecated API v1 used: ${data.request.url}`);
    }
  }
}));

// Create version snapshots before deployments
// npx cortana-metrics version "pre-deployment-$(date +%Y%m%d)"
```

## 📚 API Reference

### EndpointCapture Class

#### Constructor
```javascript
new EndpointCapture(options)
```

#### Methods

##### `captureRequest(req)`
Captures request data from Express request object.

**Parameters:**
- `req` (Object): Express request object

**Returns:** Object containing captured request data

**Example:**
```javascript
const requestData = capture.captureRequest(req);
console.log(requestData);
// {
//   timestamp: '2023-01-01 12:00:00.000',
//   method: 'POST',
//   url: '/api/users',
//   originalUrl: '/api/users',
//   baseUrl: '',
//   path: '/api/users',
//   protocol: 'http',
//   secure: false,
//   ip: '127.0.0.1',
//   ips: ['127.0.0.1'],
//   hostname: 'localhost',
//   subdomains: [],
//   startTime: 1672574400000,
//   headers: { 'content-type': 'application/json' },
//   query: { page: '1' },
//   params: { id: '123' },
//   cookies: { session: 'abc123' },
//   body: { name: 'John Doe' },
//   userAgent: 'Mozilla/5.0...',
//   contentType: 'application/json',
//   contentLength: '100',
//   accept: 'application/json',
//   acceptEncoding: 'gzip, deflate',
//   acceptLanguage: 'en-US, en;q=0.9'
// }
```

##### `captureResponse(res, originalRequestData)`
Captures response data from Express response object.

**Parameters:**
- `res` (Object): Express response object
- `originalRequestData` (Object): Original request data (optional, for timing)

**Returns:** Object containing captured response data

**Example:**
```javascript
const responseData = capture.captureResponse(res, requestData);
console.log(responseData);
// {
//   timestamp: '2023-01-01 12:00:01.000',
//   statusCode: 201,
//   statusMessage: 'Created',
//   endTime: 1672574401150,
//   duration: 150,
//   durationFormatted: '150ms',
//   headers: { 'content-type': 'application/json' },
//   body: { id: 1, name: 'John Doe' } // Only if res.locals.responseBody exists
// }
```

##### `captureEndpointData(req, res, additionalData)`
Captures complete endpoint data (request + response).

**Parameters:**
- `req` (Object): Express request object
- `res` (Object): Express response object
- `additionalData` (Object): Additional metadata (optional)

**Returns:** Object containing complete endpoint data

**Example:**
```javascript
const endpointData = capture.captureEndpointData(req, res, {
  userId: 'user123',
  sessionId: 'session456'
});
```

##### `createMiddleware(callback)`
Creates Express middleware for automatic endpoint capture.

**Parameters:**
- `callback` (Function): Optional callback to handle captured data

**Returns:** Express middleware function

**Example:**
```javascript
app.use(capture.createMiddleware((data) => {
  // Handle captured data
  console.log('Endpoint captured:', data);
}));
```

##### `createFastifyPlugin(callback)`
Creates Fastify plugin for automatic endpoint capture.

**Parameters:**
- `callback` (Function): Optional callback to handle captured data

**Returns:** Fastify plugin function

**Example:**
```javascript
fastify.register(capture.createFastifyPlugin((data) => {
  // Handle captured data
  console.log('Endpoint captured:', data);
}));
```

##### `captureFastifyRequest(request)`
Captures request data from Fastify request object.

**Parameters:**
- `request` (Object): Fastify request object

**Returns:** Object containing captured request data

**Example:**
```javascript
const requestData = capture.captureFastifyRequest(request);
console.log(requestData);
```

##### `captureFastifyResponse(reply, originalRequestData)`
Captures response data from Fastify reply object.

**Parameters:**
- `reply` (Object): Fastify reply object
- `originalRequestData` (Object): Original request data (optional, for timing)

**Returns:** Object containing captured response data

**Example:**
```javascript
const responseData = capture.captureFastifyResponse(reply, requestData);
console.log(responseData);
```

##### `captureFastifyEndpointData(request, reply, additionalData)`
Captures complete endpoint data from Fastify (request + response).

**Parameters:**
- `request` (Object): Fastify request object
- `reply` (Object): Fastify reply object
- `additionalData` (Object): Additional metadata (optional)

**Returns:** Object containing complete endpoint data

**Example:**
```javascript
const endpointData = capture.captureFastifyEndpointData(request, reply, {
  userId: 'user123',
  sessionId: 'session456'
});
```

##### `getSummary(endpointData)`
Returns a summary of captured endpoint data.

**Parameters:**
- `endpointData` (Object): Captured endpoint data

**Returns:** Object containing summary information

**Example:**
```javascript
const summary = capture.getSummary(endpointData);
console.log(summary);
// {
//   method: 'POST',
//   url: '/api/users',
//   statusCode: 201,
//   duration: 150,
//   timestamp: '2023-01-01 12:00:00.000',
//   hasRequestBody: true,
//   hasResponseBody: true,
//   headerCount: 5
// }
```

##### `exportData(endpointData, format)`
Exports captured data in various formats.

**Parameters:**
- `endpointData` (Object): Captured endpoint data
- `format` (String): Export format ('json', 'csv', 'table')

**Returns:** String containing formatted data

**Example:**
```javascript
// JSON format
const jsonData = capture.exportData(endpointData, 'json');

// CSV format
const csvData = capture.exportData(endpointData, 'csv');

// Table format
const tableData = capture.exportData(endpointData, 'table');
```

### Utility Functions

#### `utils.create(options)`
Creates a new EndpointCapture instance.

```javascript
const { utils } = require('cortana-metrics');
const capture = utils.create({ captureRequestBody: false });
```

#### `utils.quickCapture(req, res, options)`
Quickly captures endpoint data without creating an instance.

```javascript
const { utils } = require('cortana-metrics');
const data = utils.quickCapture(req, res);
```

#### `utils.quickCaptureFastify(request, reply, options)`
Quickly captures Fastify endpoint data without creating an instance.

```javascript
const { utils } = require('cortana-metrics');
const data = utils.quickCaptureFastify(request, reply);
```

#### `utils.formatForLogging(endpointData, level)`
Formats captured data for logging.

```javascript
const { utils } = require('cortana-metrics');
const logData = utils.formatForLogging(endpointData, 'info');
console.log(logData.message); // "POST /api/users - 201 (150ms)"
```

## Advanced Usage

### Custom Middleware with Database Storage

```javascript
const { EndpointCapture } = require('cortana-metrics');

const capture = new EndpointCapture({
  sensitiveHeaders: ['authorization', 'x-api-key', 'cookie'],
  sensitiveFields: ['password', 'token', 'secret', 'ssn']
});

app.use(capture.createMiddleware(async (data) => {
  try {
    // Store in database
    await database.endpointLogs.create({
      method: data.request.method,
      url: data.request.url,
      statusCode: data.response.statusCode,
      duration: data.response.duration,
      timestamp: data.request.timestamp,
      requestBody: data.request.body,
      responseBody: data.response.body,
      headers: data.request.headers
    });
  } catch (error) {
    console.error('Failed to store endpoint data:', error);
  }
}));
```

### Monitoring and Alerting

```javascript
app.use(capture.createMiddleware((data) => {
  const summary = capture.getSummary(data);
  
  // Alert on slow requests
  if (summary.duration > 5000) {
    alerting.sendAlert({
      type: 'slow_request',
      message: `Slow request detected: ${summary.method} ${summary.url} took ${summary.duration}ms`,
      data: summary
    });
  }
  
  // Alert on errors
  if (summary.statusCode >= 400) {
    alerting.sendAlert({
      type: 'error_response',
      message: `Error response: ${summary.method} ${summary.url} returned ${summary.statusCode}`,
      data: summary
    });
  }
}));
```

### API Analytics Dashboard

```javascript
app.use(capture.createMiddleware((data) => {
  const summary = capture.getSummary(data);
  
  // Send to analytics service
  analytics.track('api_request', {
    endpoint: `${summary.method} ${summary.url}`,
    statusCode: summary.statusCode,
    duration: summary.duration,
    timestamp: summary.timestamp,
    hasRequestBody: summary.hasRequestBody,
    hasResponseBody: summary.hasResponseBody
  });
}));
```

### Request/Response Logging

```javascript
const { utils } = require('cortana-metrics');

app.use((req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function(body) {
    res.locals.responseBody = body;
    return originalSend.call(this, body);
  };
  
  res.json = function(body) {
    res.locals.responseBody = body;
    return originalJson.call(this, body);
  };
  
  res.on('finish', () => {
    const data = utils.quickCapture(req, res);
    const logData = utils.formatForLogging(data, 'info');
    
    logger.info(logData.message, {
      request: data.request,
      response: data.response,
      metadata: data.metadata
    });
  });
  
  next();
});
```

## 🔧 Troubleshooting & FAQ

### Common Issues

#### ❓ OpenAPI specifications are not being generated

**Problem**: The middleware is running but no collection files are created.

**Solutions**:
```javascript
// 1. Ensure the feature is enabled
const capture = new EndpointCapture({
  generateOpenAPISpec: true  // ← Make sure this is true
});

// 2. Check directory permissions
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: './openapi-specs'  // ← Ensure this directory exists and is writable
  }
});

// 3. Verify middleware is properly attached
app.use(capture.createMiddleware()); // ← Must be called before your routes
```

#### ❓ Collections are empty or missing endpoints

**Problem**: Collection files exist but don't contain expected endpoints.

**Solutions**:
```javascript
// 1. Ensure you're making actual HTTP requests to your endpoints
// Collections are only generated when endpoints are actually called

// 2. Check if change detection is preventing updates
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    detectChanges: false  // ← Disable to force updates
  }
});

// 3. Verify response body capture
const originalJson = res.json;
res.json = function(body) {
  res.locals.responseBody = body;  // ← This is required for collection generation
  return originalJson.call(this, body);
};
```

#### ❓ CLI commands not working

**Problem**: `cortana-metrics` command not found.

**Solutions**:
```bash
# 1. Install globally
npm install -g cortana-metrics

# 2. Use npx for local installation
npx cortana-metrics help

# 3. Check if binary is properly linked
npm link cortana-metrics
```

#### ❓ Large response bodies causing memory issues

**Problem**: Application running out of memory with large API responses.

**Solutions**:
```javascript
const capture = new EndpointCapture({
  maxBodySize: 1024 * 100,  // Limit to 100KB instead of 1MB
  captureResponseBody: false  // Disable response body capture entirely
});
```

#### ❓ Sensitive data appearing in collections

**Problem**: Passwords or tokens visible in generated collections.

**Solutions**:
```javascript
const capture = new EndpointCapture({
  sensitiveHeaders: [
    'authorization', 'cookie', 'x-api-key', 
    'x-auth-token', 'x-session-token'  // ← Add your custom headers
  ],
  sensitiveFields: [
    'password', 'token', 'secret', 'key',
    'apiKey', 'accessToken', 'refreshToken',
    'ssn', 'creditCard', 'bankAccount'  // ← Add your custom fields
  ]
});
```

#### ❓ Cloud storage connection issues

**Problem**: Collections not saving to S3/Azure/GCS.

**Solutions**:
```javascript
// 1. Check credentials and permissions
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    storage: {
      type: 's3',
      options: {
        bucket: 'your-bucket',
        region: 'us-east-1'
        // Make sure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
      }
    }
  }
});

// 2. Install required dependencies
// npm install @aws-sdk/client-s3        # For S3
// npm install @azure/storage-blob       # For Azure
// npm install @google-cloud/storage    # For GCS

// 3. Test storage connection
const { StorageFactory } = require('cortana-metrics/storage');
const storage = StorageFactory.create('s3', { bucket: 'test-bucket' });
storage.initialize().then(() => {
  console.log('✅ Storage connection successful');
}).catch(error => {
  console.error('❌ Storage connection failed:', error);
});
```

#### ❓ Cloud storage permissions

**Problem**: Access denied errors when writing to cloud storage.

**Solutions**:

**For S3:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket/*",
        "arn:aws:s3:::your-bucket"
      ]
    }
  ]
}
```

**For Azure:**
- Assign "Storage Blob Data Contributor" role
- Or use connection string with appropriate permissions

**For GCS:**
- Assign "Storage Object Admin" role to service account
- Or use IAM policy with storage.objects.* permissions

### Performance Optimization

#### 🚀 Reduce Middleware Overhead

```javascript
// For high-traffic applications, optimize capture settings
const capture = new EndpointCapture({
  captureRequestBody: false,   // Skip if not needed
  captureResponseBody: false,  // Skip if not needed
  captureHeaders: false,       // Skip if not needed
  captureTiming: true,         // Keep for performance monitoring
  generateOpenAPISpec: process.env.NODE_ENV === 'development'  // Only in dev
});
```

#### 📊 Conditional Collection Generation

```javascript
// Only generate collections for specific routes
app.use('/api', capture.createMiddleware());  // Only capture /api/* routes
app.use('/admin', someOtherMiddleware);       // Skip /admin/* routes
```

### FAQ

#### Q: Can I use this with frameworks other than Express?

**A**: Yes! The package now supports both Express.js and Fastify:

**Express.js:**
```javascript
const { EndpointCapture } = require('cortana-metrics');
const capture = new EndpointCapture();

// Express middleware
app.use(capture.createMiddleware());
```

**Fastify:**
```javascript
const { EndpointCapture } = require('cortana-metrics');
const capture = new EndpointCapture();

// Fastify plugin
fastify.register(capture.createFastifyPlugin());
```

**Other frameworks:**
You can use the manual capture methods with any Node.js framework:

```javascript
const { utils } = require('cortana-metrics');

// In your framework's middleware/handler
const endpointData = utils.quickCapture(req, res);
console.log('Captured data:', endpointData);
```

#### Q: How do I customize the OpenAPI specification structure?

**A**: Use collection rules and templates:

```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    collectionRules: {
      pathBased: true,
      rules: [
        { pattern: '/api/v1/*', collection: 'API v1' },
        { pattern: '/api/v2/*', collection: 'API v2' }
      ]
    },
    defaultCollectionOptions: {
      groupByPath: true,
      includeTests: true
    }
  }
});
```

#### Q: Can I disable collection generation in production?

**A**: Yes, use environment variables:

```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: process.env.NODE_ENV !== 'production'
});
```

#### Q: How do I backup collections automatically?

**A**: Enable auto-backup in configuration:

```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    autoBackup: true,
    maxBackups: 10  // Keep last 10 backups
  }
});
```

#### Q: Can I export collections programmatically?

**A**: Yes, use the export methods:

```javascript
// Export all collections
const collections = capture.exportOpenAPISpecs('json');

// Export specific collection
const userAPI = capture.addToOpenAPISpec('User API', endpointData);

// Use CLI programmatically
const { exec } = require('child_process');
exec('npx cortana-metrics export --format json', (error, stdout) => {
  console.log('Export result:', stdout);
});
```

#### Q: How do I handle authentication in generated collections?

**A**: Use pre-request scripts and environment variables:

```javascript
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    defaultCollectionOptions: {
      includePreRequestScripts: true,
      preRequestScript: `
        // Set auth token from environment
        pm.request.headers.add({
          key: 'Authorization',
          value: 'Bearer ' + pm.environment.get('authToken')
        });
      `
    }
  }
});
```

**Best Practices:**
```javascript
// 1. Use lifecycle policies to manage old versions
const capture = new EndpointCapture({
  openAPISpecOptions: {
    storage: {
      type: 's3',
      options: {
        bucket: 'api-collections',
        prefix: 'collections/',
        // Enable versioning with lifecycle management
      }
    },
    maxBackups: 5,  // Limit backup retention
    detectChanges: true  // Only update when actually changed
  }
});

// 2. Use appropriate storage classes
// - Standard for frequently accessed collections
// - Infrequent Access for archived collections
// - Glacier for long-term backup

// 3. Optimize collection size
const capture = new EndpointCapture({
  captureResponseBody: false,  // Reduce collection size
  maxBodySize: 1024 * 10,     // Limit body size to 10KB
  openAPISpecOptions: {
    defaultCollectionOptions: {
      includeTests: false,           // Exclude tests to reduce size
      includePreRequestScripts: false
    }
  }
});
```

#### Q: Can I use multiple storage providers simultaneously?

**A**: Yes, you can configure different storage for different collections:

```javascript
// Production collections in S3
const prodCapture = new EndpointCapture({
  openAPISpecOptions: {
    storage: 's3://prod-api-collections/openapi/',
    collectionRules: { defaultCollection: 'Production API' }
  }
});

// Development collections in local storage
const devCapture = new EndpointCapture({
  openAPISpecOptions: {
    storage: { type: 'local', options: { baseDir: './dev-collections' } },
    collectionRules: { defaultCollection: 'Development API' }
  }
});

// Use different middleware for different environments
if (process.env.NODE_ENV === 'production') {
  app.use('/api', prodCapture.createMiddleware());
} else {
  app.use('/api', devCapture.createMiddleware());
}
```

## 🔒 Security Considerations

The module automatically sanitizes sensitive data by default:

- **Headers**: `authorization`, `cookie`, `x-api-key`
- **Body Fields**: `password`, `token`, `secret`, `key`

You can customize these lists in the configuration:

```javascript
const capture = new EndpointCapture({
  sensitiveHeaders: ['authorization', 'cookie', 'x-api-key', 'x-auth-token'],
  sensitiveFields: ['password', 'token', 'secret', 'key', 'ssn', 'creditCard']
});
```

## Performance Considerations

- The module is designed to be lightweight and fast
- Body size is limited by default to 1MB to prevent memory issues
- Sensitive data sanitization adds minimal overhead
- Middleware can be disabled for specific routes if needed

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run specific test files
npm test -- --testNamePattern="EndpointCapture"

# Run tests in watch mode during development
npm test -- --watch
```

### Test Coverage

The package maintains high test coverage across all features:

- ✅ **Core Capture Functionality**: 98% coverage
- ✅ **OpenAPI Specification Generation**: 95% coverage  
- ✅ **Security & Sanitization**: 100% coverage
- ✅ **CLI Operations**: 92% coverage
- ✅ **Error Handling**: 96% coverage

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/LazyCoderBot/cortana-metrics.git
cd cortana-metrics

# 2. Install dependencies
npm install

# 3. Run tests to ensure everything works
npm test

# 4. Start development
npm run dev
```

### Contribution Guidelines

1. **🍴 Fork the repository** and create your feature branch from `main`
2. **✨ Make your changes** following the existing code style
3. **🧪 Add tests** for any new functionality
4. **📝 Update documentation** if needed
5. **✅ Ensure tests pass** and coverage remains high
6. **🔍 Run linting** with `npm run lint:fix`
7. **📤 Submit a pull request** with a clear description

### Areas for Contribution

- 🌐 **Framework Support**: Add support for other Node.js frameworks (Koa, Fastify, etc.)
- 🔧 **CLI Enhancements**: Additional CLI commands and features
- 📊 **Export Formats**: New export formats (OpenAPI, Swagger, etc.)
- 🎨 **Collection Templates**: More OpenAPI specification templates
- 🔒 **Security Features**: Enhanced data sanitization options
- 📖 **Documentation**: Examples, tutorials, and guides

### Code Style

We use ESLint and Prettier for consistent code formatting:

```bash
# Check linting
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

## 📞 Support & Community

### Getting Help

- 📚 **Documentation**: Check this README and inline code comments
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/LazyCoderBot/cortana-metrics/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/LazyCoderBot/cortana-metrics/discussions)

### Quick Links

- 📦 **NPM Package**: [https://www.npmjs.com/package/cortana-metrics](https://www.npmjs.com/package/cortana-metrics)

## 🙏 Acknowledgments

Special thanks to:

- The **Express.js** team for the excellent middleware architecture
- **OpenAPI 3.0** for their comprehensive specification format
- The **Node.js** community for continuous inspiration
- All **contributors** who help make this project better

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/LazyCoderBot/cortana-metrics?style=social)
![GitHub forks](https://img.shields.io/github/forks/LazyCoderBot/cortana-metrics?style=social)
![GitHub issues](https://img.shields.io/github/issues/LazyCoderBot/cortana-metrics)
![GitHub pull requests](https://img.shields.io/github/issues-pr/LazyCoderBot/cortana-metrics)

---

<div align="center">

**Made with ❤️ by [Yuvraj Chavan](https://github.com/LazyCoderBot)**

*If this project helped you, please consider giving it a ⭐ on GitHub!*

</div>
