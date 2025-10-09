/**
 * 🚀 Comprehensive Endpoint Capture Example
 * 
 * This example demonstrates all the key features of the cortana-metrics library:
 * - Automatic endpoint capture with OpenAPI specification generation
 * - Real request/response data as examples (Postman & Swagger compatible)
 * - Sensitive data handling and redaction
 * - Multiple storage options and configurations
 * 
 * Run this example and test the endpoints to see the magic! ✨
 */

const express = require('express');
const { EndpointCapture } = require('cortana-metrics');

const app = express();
const port = process.env.PORT || 3000;

// Enable JSON parsing
app.use(express.json());

// 🎯 Configure endpoint capture with all features enabled
const capture = new EndpointCapture({
  // 📊 Data Capture Options
  captureRequestBody: true,
  captureResponseBody: true,
  captureHeaders: true,
  captureQueryParams: true,
  capturePathParams: true,
  captureCookies: true,
  captureTiming: true,
  maxBodySize: 1024 * 1024, // 1MB limit
  
  // 🔒 Security & Sensitive Data Handling
  sensitiveHeaders: [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-csrf-token'
  ],
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'key',
    'ssn',
    'creditCard',
    'apiKey',
    'privateKey'
  ],
  
  // 📝 OpenAPI Specification Generation
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: './generated-specs',
    singleFileMode: true,        // Single file for easy sharing
    autoBackup: false,          // No backups for demo
    detectChanges: false,       // Always update
    
    // 🎨 API Documentation Settings
    defaultCollectionOptions: {
      title: 'My Awesome API',
      description: 'Auto-generated API documentation with real examples',
      version: '1.0.0',
      baseUrl: `http://localhost:${port}`,
      contactName: 'API Team',
      contactEmail: 'api@example.com',
      includeExamples: true,     // Real captured data as examples
      includeSchemas: true,     // Generate schemas from data
      groupByPath: true,        // Group endpoints by path
      autoSave: true            // Auto-save changes
    },
    
    // 📋 Collection Rules
    collectionRules: {
      defaultCollection: 'Main API',
      versionBased: false,
      pathBased: false,
      environmentBased: false
    }
  }
});

// 🔧 Enhanced middleware with detailed logging
app.use(capture.createMiddleware((endpointData, req, res) => {
  const summary = capture.getSummary(endpointData);
  
  console.log(`\n🎯 ${'='.repeat(60)}`);
  console.log(`📡 ENDPOINT CAPTURED: ${summary.method} ${summary.url}`);
  console.log(`📊 Status: ${summary.statusCode} | Duration: ${summary.duration}ms`);
  console.log(`🔍 Request Body: ${summary.hasRequestBody ? '✅' : '❌'} | Response Body: ${summary.hasResponseBody ? '✅' : '❌'}`);
  
  // Show actual captured data (for demonstration)
  if (endpointData.request.bodyActual) {
    console.log(`📥 Request Data:`, JSON.stringify(endpointData.request.bodyActual, null, 2));
  }
  
  if (endpointData.response.bodyActual) {
    console.log(`📤 Response Data:`, JSON.stringify(JSON.parse(endpointData.response.bodyActual), null, 2));
  }
  
  console.log(`${'='.repeat(60)}\n`);
}));

// 🛠️ Sample API Routes with Real-World Examples

// 👥 Users Management
app.get('/api/users', (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  
  const users = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', department: 'Engineering' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', department: 'Marketing' },
    { id: 3, name: 'Carol Davis', email: 'carol@example.com', role: 'moderator', department: 'Support' }
  ];
  
  const filteredUsers = search 
    ? users.filter(user => user.name.toLowerCase().includes(search.toLowerCase()))
    : users;
  
  res.json({
    users: filteredUsers.slice((page - 1) * limit, page * limit),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredUsers.length,
      totalPages: Math.ceil(filteredUsers.length / limit)
    },
    metadata: {
      searchTerm: search,
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const user = {
    id: parseInt(id),
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    profile: {
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        theme: 'dark',
        notifications: true,
        language: 'en'
      },
      createdAt: '2023-01-01T00:00:00.000Z',
      lastLogin: new Date().toISOString()
    }
  };
  
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { name, email, password, role = 'user', preferences } = req.body;
  
  // Simulate validation
  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Missing required fields',
      required: ['name', 'email', 'password'],
      received: { name: !!name, email: !!email, password: !!password }
    });
  }
  
  // Simulate user creation
  const newUser = {
    id: Math.floor(Math.random() * 1000),
    name,
    email,
    role,
    preferences: preferences || { theme: 'light', notifications: true },
    createdAt: new Date().toISOString(),
    // Sensitive data would be redacted in captured examples
    password: '[REDACTED]',
    apiKey: '[REDACTED]'
  };
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: newUser,
    metadata: {
      requestId: 'req_' + Date.now(),
      processingTime: Math.random() * 100 + 'ms'
    }
  });
});

// 🛍️ Products API
app.get('/api/products', (req, res) => {
  const { category, minPrice, maxPrice, sort = 'name' } = req.query;
  
  const products = [
    { id: 1, name: 'Laptop Pro', price: 1299.99, category: 'Electronics', stock: 50 },
    { id: 2, name: 'Coffee Maker', price: 89.99, category: 'Appliances', stock: 25 },
    { id: 3, name: 'Programming Book', price: 39.99, category: 'Books', stock: 100 }
  ];
  
  let filteredProducts = products;
  
  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  
  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
  }
  
  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
  }
  
  // Sort products
  filteredProducts.sort((a, b) => {
    if (sort === 'price') return a.price - b.price;
    if (sort === 'name') return a.name.localeCompare(b.name);
    return 0;
  });
  
  res.json({
    products: filteredProducts,
    filters: { category, minPrice, maxPrice, sort },
    total: filteredProducts.length
  });
});

app.post('/api/products', (req, res) => {
  const { name, price, category, description, stock } = req.body;
  
  const newProduct = {
    id: Math.floor(Math.random() * 1000),
    name,
    price: parseFloat(price),
    category,
    description,
    stock: parseInt(stock) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    product: newProduct
  });
});

// 🔍 Search API
app.get('/api/search', (req, res) => {
  const { q, type = 'all', limit = 10 } = req.query;
  
  if (!q) {
    return res.status(400).json({
      error: 'Search query required',
      message: 'Please provide a search term using the "q" parameter'
    });
  }
  
  const results = {
    query: q,
    type,
    limit: parseInt(limit),
    results: [
      { id: 1, title: 'Sample Result 1', type: 'user', relevance: 0.95 },
      { id: 2, title: 'Sample Result 2', type: 'product', relevance: 0.87 },
      { id: 3, title: 'Sample Result 3', type: 'article', relevance: 0.72 }
    ],
    total: 3,
    took: Math.random() * 50 + 'ms'
  };
  
  res.json(results);
});

// 🏥 Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 🚨 Error Handling
app.use((err, req, res, next) => {
  console.error('❌ Error occurred:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString(),
    requestId: 'req_' + Date.now()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/users',
      'GET /api/users/:id',
      'POST /api/users',
      'GET /api/products',
      'POST /api/products',
      'GET /api/search',
      'GET /api/health'
    ]
  });
});

// 🚀 Start Server
app.listen(port, () => {
  console.log(`\n🎉 Comprehensive Example Server Started!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📡 Server running on: http://localhost:${port}`);
  console.log(`📁 OpenAPI spec will be saved to: ./generated-specs/My_Awesome_API.json`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\n🧪 Test these endpoints to see the magic:`);
  console.log(`👥 GET /api/users`);
  console.log(`👤 GET /api/users/123`);
  console.log(`➕ POST /api/users (with body: { "name": "Test User", "email": "test@example.com", "password": "secret123" })`);
  console.log(`🛍️ GET /api/products?category=Electronics&minPrice=100`);
  console.log(`🛍️ POST /api/products (with body: { "name": "New Product", "price": 99.99, "category": "Electronics" })`);
  console.log(`🔍 GET /api/search?q=test&type=all&limit=5`);
  console.log(`🏥 GET /api/health`);
  console.log(`\n💡 Watch the console for detailed capture information!`);
  console.log(`📋 Import the generated OpenAPI spec into Postman or Swagger Editor!`);
  console.log(`${'='.repeat(60)}\n`);
});
