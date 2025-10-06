/**
 * Fastify Usage Example
 * Demonstrates how to use cortana-metrics with Fastify framework
 */

const fastify = require('fastify')({ logger: false });
const { EndpointCapture } = require('../index');

// Create capture instance with OpenAPI specification generation
const capture = new EndpointCapture({
  // Core capture options
  captureRequestBody: true,
  captureResponseBody: true,
  sensitiveFields: ['password', 'token', 'secret', 'apiKey'],
  
  // OpenAPI specification options
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: './fastify-openapi-specs',
    autoBackup: true,
    maxBackups: 10,
    defaultCollectionOptions: {
      collectionName: 'Fastify API v1.0',
      version: '1.0.0',
      groupByPath: true
    }
  }
});

// Register the capture plugin
fastify.register(capture.createFastifyPlugin((data) => {
  console.log(`📊 ${data.request.method} ${data.request.url} - ${data.response.statusCode} (${data.response.duration}ms)`);
  
  // You can add custom logic here
  // - Send to monitoring service
  // - Store in database
  // - Send alerts
}));

// Example API routes
fastify.get('/api/users', async (request, reply) => {
  return { users: [{ id: 1, name: 'John Doe' }, { id: 2, name: 'Jane Smith' }] };
});

fastify.post('/api/users', async (request, reply) => {
  const { name, email } = request.body;
  
  // Simulate user creation
  const newUser = {
    id: Math.floor(Math.random() * 1000),
    name,
    email,
    createdAt: new Date().toISOString()
  };
  
  reply.status(201);
  return newUser;
});

fastify.get('/api/users/:id', async (request, reply) => {
  const { id } = request.params;
  
  // Simulate user lookup
  if (id === '1') {
    return { id: 1, name: 'John Doe', email: 'john@example.com' };
  } else {
    reply.status(404);
    return { error: 'User not found' };
  }
});

fastify.put('/api/users/:id', async (request, reply) => {
  const { id } = request.params;
  const { name, email } = request.body;
  
  // Simulate user update
  return {
    id: parseInt(id),
    name,
    email,
    updatedAt: new Date().toISOString()
  };
});

fastify.delete('/api/users/:id', async (request, reply) => {
  const { id } = request.params;
  
  // Simulate user deletion
  reply.status(204);
  return;
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Error handling
fastify.setErrorHandler(async (error, request, reply) => {
  console.error('Error:', error);
  reply.status(500).send({ error: 'Internal Server Error' });
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Fastify server running on http://localhost:3000');
    console.log('📋 OpenAPI specifications will be saved to ./fastify-openapi-specs/');
    
    // Display available endpoints
    console.log('\n📚 Available endpoints:');
    console.log('  GET    /api/users     - Get all users');
    console.log('  POST   /api/users     - Create user');
    console.log('  GET    /api/users/:id - Get user by ID');
    console.log('  PUT    /api/users/:id - Update user');
    console.log('  DELETE /api/users/:id - Delete user');
    console.log('  GET    /health        - Health check');
    
    console.log('\n🧪 Test the API:');
    console.log('  curl http://localhost:3000/api/users');
    console.log('  curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d \'{"name":"Test User","email":"test@example.com"}\'');
    console.log('  curl http://localhost:3000/api/users/1');
    
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
