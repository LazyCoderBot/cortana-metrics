const express = require('express');
const { EndpointCapture } = require('cortana-metrics');

const app = express();
app.use(express.json());

// Example 1: AWS S3 Storage Configuration
const s3Capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    storage: {
      type: 's3',
      options: {
        bucket: 'my-api-collections',
        region: 'us-east-1',
        prefix: 'openapi-specs/',
        // Credentials are optional - supports multiple authentication methods:
        // 1. IAM roles (recommended for EC2, ECS, Lambda)
        // 2. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
        // 3. AWS credential files (~/.aws/credentials)
        // 4. Explicit credentials (less secure)
        // accessKeyId: 'your-access-key',
        // secretAccessKey: 'your-secret-key'
      }
    },
    defaultCollectionOptions: {
      collectionName: 'My S3 API Collection',
      version: '1.0.0'
    }
  }
});

// Example 2: Azure Blob Storage Configuration
const azureCapture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    storage: {
      type: 'azure',
      options: {
        containerName: 'api-collections',
        prefix: 'openapi/',
        // Use connection string (recommended)
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING
        // Or use account credentials
        // accountName: 'mystorageaccount',
        // accountKey: 'your-account-key'
      }
    },
    defaultCollectionOptions: {
      collectionName: 'My Azure API Collection'
    }
  }
});

// Example 3: Google Cloud Storage Configuration
const gcsCapture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    storage: {
      type: 'gcs',
      options: {
        bucketName: 'my-api-collections',
        projectId: 'my-gcp-project',
        prefix: 'openapi-specs/',
        // keyFilename: '/path/to/service-account-key.json' // Optional
      }
    },
    defaultCollectionOptions: {
      collectionName: 'My GCS API Collection'
    }
  }
});

// Example 4: URL-based Storage Configuration
const urlBasedCapture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    // S3 URL format
    storage: 's3://my-bucket/openapi-specs/',
    // Or GCS URL format
    // storage: 'gs://my-bucket/openapi-specs/',
    // Or Azure URL format
    // storage: 'azure://accountname/container/path/',
    
    defaultCollectionOptions: {
      collectionName: 'URL-based Storage Collection'
    }
  }
});

// Example 5: Environment-based Storage Configuration
function createCaptureWithEnvStorage() {
  const storageType = process.env.STORAGE_TYPE || 'local';
  
  let storageConfig;
  
  switch (storageType) {
    case 's3':
      storageConfig = {
        type: 's3',
        options: {
          bucket: process.env.S3_BUCKET,
          region: process.env.AWS_REGION || 'us-east-1',
          prefix: process.env.S3_PREFIX || 'openapi-specs/'
        }
      };
      break;
      
    case 'azure':
      storageConfig = {
        type: 'azure',
        options: {
          containerName: process.env.AZURE_CONTAINER || 'api-collections',
          connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
          prefix: process.env.AZURE_PREFIX || 'openapi/'
        }
      };
      break;
      
    case 'gcs':
      storageConfig = {
        type: 'gcs',
        options: {
          bucketName: process.env.GCS_BUCKET,
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          prefix: process.env.GCS_PREFIX || 'openapi-specs/'
        }
      };
      break;
      
    default:
      storageConfig = {
        type: 'local',
        options: {
          baseDir: process.env.LOCAL_STORAGE_DIR || './openapi-specs'
        }
      };
  }
  
  return new EndpointCapture({
    generateOpenAPISpec: true,
    openAPISpecOptions: {
      storage: storageConfig,
      defaultCollectionOptions: {
        collectionName: `${storageType.toUpperCase()} API Collection`,
        version: '1.0.0'
      }
    }
  });
}

// Use middleware for automatic capture and cloud storage
app.use('/api', s3Capture.createMiddleware(async (data) => {
  console.log(`📊 ${data.request.method} ${data.request.url} - ${data.response.statusCode} (${data.response.duration}ms)`);
  console.log('💾 Collection stored in S3');
}));

// Example API routes
app.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]
  });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  const newUser = {
    id: Date.now(),
    name,
    email,
    createdAt: new Date().toISOString()
  };
  res.status(201).json(newUser);
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const user = {
    id: parseInt(id),
    name: 'John Doe',
    email: 'john@example.com',
    profile: {
      bio: 'Software developer',
      location: 'San Francisco'
    }
  };
  res.json(user);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  res.json({
    id: parseInt(id),
    ...updates,
    updatedAt: new Date().toISOString()
  });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    message: `User ${id} deleted successfully`,
    deletedAt: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('☁️  Using cloud storage for OpenAPI specifications');
  console.log('');
  console.log('Environment Variables for Storage Configuration:');
  console.log('STORAGE_TYPE=s3|azure|gcs|local');
  console.log('');
  console.log('S3 Configuration:');
  console.log('S3_BUCKET=your-bucket-name');
  console.log('AWS_REGION=us-east-1');
  console.log('S3_PREFIX=openapi-specs/');
  console.log('');
  console.log('S3 Authentication (choose one):');
  console.log('1. IAM Role (recommended for EC2/ECS/Lambda): No env vars needed');
  console.log('2. Environment variables:');
  console.log('   AWS_ACCESS_KEY_ID=your-access-key');
  console.log('   AWS_SECRET_ACCESS_KEY=your-secret-key');
  console.log('3. AWS credential file: ~/.aws/credentials');
  console.log('');
  console.log('Azure Configuration:');
  console.log('AZURE_STORAGE_CONNECTION_STRING=your-connection-string');
  console.log('AZURE_CONTAINER=api-collections');
  console.log('AZURE_PREFIX=openapi/');
  console.log('');
  console.log('GCS Configuration:');
  console.log('GOOGLE_CLOUD_PROJECT_ID=your-project-id');
  console.log('GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json');
  console.log('GCS_BUCKET=your-bucket-name');
  console.log('GCS_PREFIX=openapi-specs/');
  console.log('');
  console.log('Try these endpoints:');
  console.log('GET /api/users');
  console.log('POST /api/users (with body: { "name": "Test User", "email": "test@example.com" })');
  console.log('GET /api/users/123');
  console.log('PUT /api/users/123 (with body: { "name": "Updated Name" })');
  console.log('DELETE /api/users/123');
});

// Export the capture instances for testing
module.exports = {
  s3Capture,
  azureCapture,
  gcsCapture,
  urlBasedCapture,
  createCaptureWithEnvStorage
};
