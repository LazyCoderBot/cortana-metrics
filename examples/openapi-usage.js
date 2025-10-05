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
    // Single active file mode - only one JSON file that gets updated
    singleFileMode: true,
    autoBackup: false, // No backups for single file mode
    detectChanges: false, // Always update the single file
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
      autoSave: true // Auto-save to single file
    },
    collectionRules: {
      defaultCollection: 'API Documentation', // Single collection
      versionBased: false,
      pathBased: false, // No path-based collections
      environmentBased: false
    }
  }
});

// Use the capture middleware
app.use(capture.createMiddleware((endpointData, req, res) => {
  console.log(`Captured: ${endpointData.request.method} ${endpointData.request.path} - ${endpointData.response.statusCode}`);
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
  console.log(`Server running at http://localhost:${port}`);
  console.log('OpenAPI specifications will be generated automatically');
  console.log('Check the ./openapi-specs directory for generated files');
});

// Example of manual endpoint addition
setTimeout(() => {
  console.log('\n=== Manual OpenAPI Operations ===');
  
  // Get collection manager
  const manager = capture.getCollectionManager();
  if (manager) {
    console.log('Collection manager available');
    
    // Get statistics
    const stats = capture.getOpenAPISpecStats();
    console.log('OpenAPI Spec Stats:', stats);
    
    // Export specifications
    const exports = capture.exportOpenAPISpecs('json', { saveToFile: true });
    console.log('Exported specifications:', Object.keys(exports));
    
    // Create version
    const version = capture.createOpenAPISpecVersion('1.0.0');
    console.log('Created version:', version);
  }
}, 2000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  
  // Export final specifications
  if (capture.getCollectionManager()) {
    const finalExports = capture.exportOpenAPISpecs('json', { saveToFile: true });
    console.log('Final OpenAPI specifications exported');
  }
  
  process.exit(0);
});
