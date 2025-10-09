/**
 * 🚀 Quick Start Example
 * 
 * This is the simplest way to get started with cortana-metrics.
 * Just add the middleware to your Express app and you're done!
 * 
 * Features demonstrated:
 * - Basic endpoint capture
 * - Automatic OpenAPI spec generation
 * - Real examples in documentation
 */

const express = require('express');
const { EndpointCapture } = require('cortana-metrics');

const app = express();
const port = 3000;

// Enable JSON parsing
app.use(express.json());

// 🎯 Initialize endpoint capture (that's it!)
const capture = new EndpointCapture({
  generateOpenAPISpec: true,  // Enable OpenAPI spec generation
  openAPISpecOptions: {
    baseDir: './api-docs',    // Where to save the spec
    singleFileMode: true,     // One file for easy sharing
    defaultCollectionOptions: {
      title: 'My API',
      version: '1.0.0',
      baseUrl: `http://localhost:${port}`,
      includeExamples: true   // Use real captured data as examples
    }
  }
});

// 🔧 Add the middleware (automatic capture!)
app.use(capture.createMiddleware());

// 🛠️ Your API routes (just write normal Express routes)
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello World!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ]);
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  
  const newUser = {
    id: Math.floor(Math.random() * 1000),
    name,
    email,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    user: newUser
  });
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    id: parseInt(id),
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: '2023-01-01T00:00:00.000Z'
  });
});

// 🚀 Start the server
app.listen(port, () => {
  console.log(`\n🎉 Quick Start Server Running!`);
  console.log(`📡 Server: http://localhost:${port}`);
  console.log(`📁 OpenAPI spec: ./api-docs/My_API.json`);
  console.log(`\n🧪 Test these endpoints:`);
  console.log(`   GET  /api/hello`);
  console.log(`   GET  /api/users`);
  console.log(`   POST /api/users (with body: { "name": "Test", "email": "test@example.com" })`);
  console.log(`   GET  /api/users/123`);
  console.log(`\n💡 Import the generated OpenAPI spec into Postman or Swagger Editor!`);
  console.log(`✨ Your API documentation will have real examples from these requests!\n`);
});
