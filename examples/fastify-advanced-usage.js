/**
 * Advanced Fastify Usage Example
 * Demonstrates advanced features with Fastify including authentication, validation, and cloud storage
 */

const fastify = require('fastify')({ logger: false });
const { EndpointCapture } = require('../index');

// Advanced capture configuration
const capture = new EndpointCapture({
  // Enhanced security settings
  sensitiveHeaders: [
    'authorization', 'cookie', 'x-api-key', 
    'x-auth-token', 'x-session-id', 'x-csrf-token'
  ],
  sensitiveFields: [
    'password', 'token', 'secret', 'key',
    'apiKey', 'accessToken', 'refreshToken',
    'ssn', 'creditCard', 'bankAccount'
  ],
  
  // Performance settings
  maxBodySize: 1024 * 512, // 512KB limit
  captureTiming: true,
  
  // OpenAPI specification with cloud storage
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: './advanced-fastify-specs',
    autoBackup: true,
    maxBackups: 20,
    defaultCollectionOptions: {
      collectionName: 'Advanced Fastify API',
      version: '2.0.0',
      groupByPath: true,
      includeExamples: true,
      includeSchemas: true,
      includeTests: true,
      testTemplate: `
        pm.test("Status code is successful", function () {
          pm.response.to.have.status(200);
        });
        
        pm.test("Response time is acceptable", function () {
          pm.expect(pm.response.responseTime).to.be.below(1000);
        });
        
        pm.test("Content-Type is JSON", function () {
          pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
        });
      `,
      preRequestScript: `
        // Set authentication token
        pm.request.headers.add({
          key: 'Authorization',
          value: 'Bearer ' + pm.environment.get('authToken')
        });
      `
    },
    collectionRules: {
      defaultCollection: 'Advanced Fastify API',
      pathBased: true,
      rules: [
        { pattern: '/api/v1/*', collection: 'API v1.0' },
        { pattern: '/api/v2/*', collection: 'API v2.0' },
        { pattern: '/admin/*', collection: 'Admin API' }
      ]
    }
  }
});

// Register the capture plugin with advanced callback
fastify.register(capture.createFastifyPlugin(async (data) => {
  const summary = capture.getSummary(data);
  
  // Log with different levels based on status
  if (summary.statusCode >= 400) {
    fastify.log.error(`❌ ${summary.method} ${summary.url} - ${summary.statusCode} (${summary.duration}ms)`);
  } else if (summary.duration > 1000) {
    fastify.log.warn(`⚠️  ${summary.method} ${summary.url} - ${summary.statusCode} (${summary.duration}ms) - Slow request`);
  } else {
    fastify.log.info(`✅ ${summary.method} ${summary.url} - ${summary.statusCode} (${summary.duration}ms)`);
  }
  
  // Send to monitoring service (simulated)
  if (process.env.MONITORING_ENABLED === 'true') {
    await sendToMonitoring(summary);
  }
  
  // Alert on errors
  if (summary.statusCode >= 500) {
    await sendAlert('server_error', summary);
  }
}));

// Authentication plugin
fastify.register(async function (fastify) {
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip auth for health and public endpoints
    if (request.url.startsWith('/health') || request.url.startsWith('/public')) {
      return;
    }
    
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      reply.status(401).send({ error: 'Missing authorization token' });
      return;
    }
    
    // Simple token validation (in real app, use proper JWT validation)
    if (token !== 'valid-token-123') {
      reply.status(401).send({ error: 'Invalid token' });
      return;
    }
    
    // Add user info to request
    request.user = { id: 1, name: 'Test User', role: 'admin' };
  });
});

// Request validation schemas
const userSchema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: { type: 'string', minLength: 2 },
    email: { type: 'string', format: 'email' },
    age: { type: 'number', minimum: 0, maximum: 120 }
  }
};

const updateUserSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2 },
    email: { type: 'string', format: 'email' },
    age: { type: 'number', minimum: 0, maximum: 120 }
  }
};

// API v1 routes
fastify.register(async function (fastify) {
  fastify.addHook('preHandler', async (request, reply) => {
    request.apiVersion = 'v1';
  });
  
  fastify.get('/api/v1/users', async (request, reply) => {
    return {
      version: 'v1',
      users: [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ]
    };
  });
  
  fastify.post('/api/v1/users', {
    schema: {
      body: userSchema
    }
  }, async (request, reply) => {
    const { name, email, age } = request.body;
    
    const newUser = {
      id: Math.floor(Math.random() * 1000),
      name,
      email,
      age: age || null,
      createdAt: new Date().toISOString(),
      createdBy: request.user.id
    };
    
    reply.status(201);
    return newUser;
  });
  
  fastify.get('/api/v1/users/:id', async (request, reply) => {
    const { id } = request.params;
    
    if (id === '1') {
      return { id: 1, name: 'John Doe', email: 'john@example.com' };
    } else {
      reply.status(404);
      return { error: 'User not found' };
    }
  });
}, { prefix: '' });

// API v2 routes
fastify.register(async function (fastify) {
  fastify.addHook('preHandler', async (request, reply) => {
    request.apiVersion = 'v2';
  });
  
  fastify.get('/api/v2/users', async (request, reply) => {
    return {
      version: 'v2',
      data: {
        users: [
          { id: 1, name: 'John Doe', email: 'john@example.com', profile: { role: 'admin' } },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', profile: { role: 'user' } }
        ]
      },
      meta: {
        total: 2,
        page: 1,
        limit: 10
      }
    };
  });
  
  fastify.post('/api/v2/users', {
    schema: {
      body: userSchema
    }
  }, async (request, reply) => {
    const { name, email, age } = request.body;
    
    const newUser = {
      id: Math.floor(Math.random() * 1000),
      name,
      email,
      age: age || null,
      profile: { role: 'user' },
      createdAt: new Date().toISOString(),
      createdBy: request.user.id
    };
    
    reply.status(201);
    return {
      data: newUser,
      meta: { version: 'v2' }
    };
  });
}, { prefix: '' });

// Admin routes
fastify.register(async function (fastify) {
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.user.role !== 'admin') {
      reply.status(403).send({ error: 'Admin access required' });
      return;
    }
  });
  
  fastify.get('/admin/stats', async (request, reply) => {
    return {
      totalUsers: 150,
      activeUsers: 120,
      apiCalls: 1250,
      uptime: process.uptime()
    };
  });
  
  fastify.get('/admin/users', async (request, reply) => {
    return {
      users: [
        { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
        { id: 2, name: 'Regular User', email: 'user@example.com', role: 'user' }
      ]
    };
  });
}, { prefix: '' });

// Public routes (no auth required)
fastify.get('/public/info', async (request, reply) => {
  return {
    name: 'Fastify API',
    version: '2.0.0',
    status: 'running'
  };
});

fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
});

// Error handling
fastify.setErrorHandler(async (error, request, reply) => {
  fastify.log.error('Request error:', error);
  
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      details: error.validation
    });
    return;
  }
  
  reply.status(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Simulated monitoring functions
async function sendToMonitoring(summary) {
  // Simulate sending to monitoring service
  console.log('📊 Sending to monitoring:', summary);
}

async function sendAlert(type, summary) {
  // Simulate sending alert
  console.log(`🚨 Alert: ${type}`, summary);
}

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Advanced Fastify server running on http://localhost:3000');
    console.log('📋 OpenAPI specifications will be saved to ./advanced-fastify-specs/');
    
    console.log('\n📚 Available endpoints:');
    console.log('  Public:');
    console.log('    GET    /public/info     - API information');
    console.log('    GET    /health          - Health check');
    console.log('  API v1 (requires auth):');
    console.log('    GET    /api/v1/users    - Get users v1');
    console.log('    POST   /api/v1/users    - Create user v1');
    console.log('    GET    /api/v1/users/:id - Get user v1');
    console.log('  API v2 (requires auth):');
    console.log('    GET    /api/v2/users    - Get users v2');
    console.log('    POST   /api/v2/users    - Create user v2');
    console.log('  Admin (requires admin role):');
    console.log('    GET    /admin/stats     - System statistics');
    console.log('    GET    /admin/users     - All users');
    
    console.log('\n🧪 Test the API:');
    console.log('  # Public endpoints (no auth)');
    console.log('  curl http://localhost:3000/public/info');
    console.log('  curl http://localhost:3000/health');
    console.log('');
    console.log('  # API endpoints (require auth)');
    console.log('  curl -H "Authorization: Bearer valid-token-123" http://localhost:3000/api/v1/users');
    console.log('  curl -X POST -H "Authorization: Bearer valid-token-123" -H "Content-Type: application/json" -d \'{"name":"Test User","email":"test@example.com"}\' http://localhost:3000/api/v1/users');
    console.log('  curl -H "Authorization: Bearer valid-token-123" http://localhost:3000/api/v2/users');
    console.log('');
    console.log('  # Admin endpoints (require admin role)');
    console.log('  curl -H "Authorization: Bearer valid-token-123" http://localhost:3000/admin/stats');
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await fastify.close();
  process.exit(0);
});

module.exports = fastify;
