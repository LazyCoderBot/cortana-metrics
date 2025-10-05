const express = require('express');
const { EndpointCapture } = require('../index');

const app = express();
const port = 3000;

// Enable JSON parsing
app.use(express.json());

// Initialize endpoint capture with single file OpenAPI specification
const capture = new EndpointCapture({
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: './openapi-specs',
    // Single file mode - only one active file
    singleFileMode: true,
    // No backups - just update the single file
    autoBackup: false,
    // No versioning - just one active file
    detectChanges: false,
    // Single collection
    collectionRules: {
      defaultCollection: 'API Documentation',
      versionBased: false,
      pathBased: false,
      environmentBased: false
    },
    defaultCollectionOptions: {
      title: 'My API Documentation',
      description: 'Auto-generated API documentation from endpoint capture',
      version: '1.0.0',
      baseUrl: 'http://localhost:3000',
      contactName: 'API Team',
      contactEmail: 'api@example.com',
      includeExamples: true,
      includeSchemas: true,
      groupByPath: true,
      // Auto-save to single file
      autoSave: true
    }
  }
});

// Use the capture middleware with file monitoring
app.use(capture.createMiddleware((endpointData, req, res) => {
  console.log(`📝 Updated OpenAPI spec: ${endpointData.request.method} ${endpointData.request.path} - ${endpointData.response.statusCode}`);
  
  // Check if file was updated
  const fs = require('fs');
  const path = require('path');
  const specFile = path.join('./openapi-specs', 'API_Documentation.json');
  if (fs.existsSync(specFile)) {
    const stats = fs.statSync(specFile);
    console.log(`📄 File updated: ${specFile} (${stats.size} bytes, modified: ${stats.mtime.toLocaleTimeString()})`);
  }
}));

// Sample API routes
app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ]);
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id: parseInt(id),
    name: 'John Doe',
    email: 'john@example.com'
  });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({
    id: Math.floor(Math.random() * 1000),
    name,
    email,
    createdAt: new Date().toISOString()
  });
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  res.json({
    id: parseInt(id),
    name,
    email,
    updatedAt: new Date().toISOString()
  });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  res.status(204).send();
});

// Products API
app.get('/api/products', (req, res) => {
  const { category, limit = 10 } = req.query;
  res.json([
    { id: 1, name: 'Product 1', category: 'electronics', price: 99.99 },
    { id: 2, name: 'Product 2', category: 'books', price: 19.99 }
  ]);
});

app.post('/api/products', (req, res) => {
  const { name, category, price } = req.body;
  res.status(201).json({
    id: Math.floor(Math.random() * 1000),
    name,
    category,
    price,
    createdAt: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log('📄 Single OpenAPI specification file will be generated and updated');
  console.log('📁 Check ./openapi-specs/API_Documentation.json for the active file');
  console.log('\n🔗 Test the API endpoints to see the OpenAPI spec update:');
  console.log('   GET    http://localhost:3000/api/users');
  console.log('   GET    http://localhost:3000/api/users/1');
  console.log('   POST   http://localhost:3000/api/users');
  console.log('   PUT    http://localhost:3000/api/users/1');
  console.log('   DELETE http://localhost:3000/api/users/1');
  console.log('   GET    http://localhost:3000/api/products');
  console.log('   POST   http://localhost:3000/api/products');
});

// Show current OpenAPI spec stats
setTimeout(() => {
  console.log('\n📊 Current OpenAPI Specification Status:');
  const stats = capture.getOpenAPISpecStats();
  console.log(JSON.stringify(stats, null, 2));
}, 3000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Show final stats
  const finalStats = capture.getOpenAPISpecStats();
  console.log('📊 Final OpenAPI Specification Stats:');
  console.log(JSON.stringify(finalStats, null, 2));
  
  console.log('✅ Single OpenAPI file saved to: ./openapi-specs/API_Documentation.json');
  process.exit(0);
});
