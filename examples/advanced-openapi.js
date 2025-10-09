/**
 * 🚀 Advanced OpenAPI Generation Example
 * 
 * This example demonstrates advanced OpenAPI specification generation
 * with Postman compatibility and real-world API patterns.
 * 
 * Features:
 * - Postman-compatible examples (simple example fields)
 * - Swagger UI compatible examples (detailed examples objects)
 * - Sensitive data handling and redaction
 * - Multiple response types and error handling
 * - Real captured data as examples
 */

const express = require('express');
const { EndpointCapture } = require('cortana-metrics');

const app = express();
const port = 3000;

// Enable JSON parsing
app.use(express.json());

// 🎯 Advanced configuration for production-ready OpenAPI specs
const capture = new EndpointCapture({
  // 📊 Comprehensive data capture
  captureRequestBody: true,
  captureResponseBody: true,
  captureHeaders: true,
  captureQueryParams: true,
  capturePathParams: true,
  captureTiming: true,
  maxBodySize: 2 * 1024 * 1024, // 2MB limit
  
  // 🔒 Production-ready security settings
  sensitiveHeaders: [
    'authorization', 'cookie', 'x-api-key', 'x-auth-token',
    'x-csrf-token', 'x-session-id', 'x-user-id'
  ],
  sensitiveFields: [
    'password', 'token', 'secret', 'key', 'ssn', 'creditCard',
    'apiKey', 'privateKey', 'accessToken', 'refreshToken'
  ],
  
  // 📝 Advanced OpenAPI configuration
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    baseDir: './advanced-api-docs',
    singleFileMode: true,
    autoBackup: false,
    detectChanges: false,
    
    // 🎨 Professional API documentation
    defaultCollectionOptions: {
      title: 'E-Commerce API',
      description: 'A comprehensive e-commerce API with user management, product catalog, and order processing',
      version: '2.0.0',
      baseUrl: `http://localhost:${port}`,
      contactName: 'API Development Team',
      contactEmail: 'api@ecommerce.com',
      contactUrl: 'https://ecommerce.com/contact',
      licenseName: 'MIT',
      licenseUrl: 'https://opensource.org/licenses/MIT',
      includeExamples: true,    // Real captured data as examples
      includeSchemas: true,    // Generate schemas from data
      groupByPath: true,       // Group by API path
      autoSave: true
    },
    
    collectionRules: {
      defaultCollection: 'E-Commerce API',
      versionBased: false,
      pathBased: false,
      environmentBased: false
    }
  }
});

// 🔧 Enhanced middleware with production logging
app.use(capture.createMiddleware((endpointData, req, res) => {
  const summary = capture.getSummary(endpointData);
  
  console.log(`\n🎯 ${summary.method} ${summary.url} - ${summary.statusCode} (${summary.duration}ms)`);
  
  // Show captured data structure for debugging
  if (endpointData.request.bodyActual) {
    console.log(`📥 Request:`, Object.keys(endpointData.request.bodyActual));
  }
  if (endpointData.response.bodyActual) {
    try {
      const responseData = JSON.parse(endpointData.response.bodyActual);
      console.log(`📤 Response:`, Object.keys(responseData));
    } catch (e) {
      console.log(`📤 Response: [Non-JSON]`);
    }
  }
}));

// 🛠️ Advanced API Routes with Real-World Patterns

// 👥 User Management with Authentication
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Email and password are required',
      code: 'MISSING_CREDENTIALS'
    });
  }
  
  // Simulate authentication
  const token = 'jwt_' + Math.random().toString(36).substr(2, 9);
  
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: 123,
        email,
        name: 'John Doe',
        role: 'user'
      },
      token,
      expiresIn: '24h'
    },
    metadata: {
      loginTime: new Date().toISOString(),
      ipAddress: req.ip
    }
  });
});

app.get('/api/users/profile', (req, res) => {
  // Simulate authenticated user profile
  res.json({
    id: 123,
    name: 'John Doe',
    email: 'john@example.com',
    profile: {
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        theme: 'dark',
        notifications: true,
        language: 'en'
      },
      settings: {
        twoFactorEnabled: true,
        privacyLevel: 'public'
      }
    },
    stats: {
      totalOrders: 15,
      memberSince: '2023-01-01T00:00:00.000Z',
      lastLogin: new Date().toISOString()
    }
  });
});

// 🛍️ Product Catalog with Advanced Filtering
app.get('/api/products', (req, res) => {
  const { 
    category, 
    minPrice, 
    maxPrice, 
    sort = 'name', 
    order = 'asc',
    page = 1,
    limit = 20,
    search,
    inStock = true
  } = req.query;
  
  const products = [
    {
      id: 1,
      name: 'MacBook Pro 16"',
      price: 2499.99,
      category: 'Electronics',
      description: 'High-performance laptop for professionals',
      stock: 50,
      rating: 4.8,
      reviews: 1250,
      tags: ['laptop', 'apple', 'professional'],
      images: ['https://example.com/macbook1.jpg'],
      specifications: {
        processor: 'M2 Pro',
        memory: '16GB',
        storage: '512GB SSD',
        display: '16.2-inch Liquid Retina XDR'
      }
    },
    {
      id: 2,
      name: 'Wireless Headphones',
      price: 299.99,
      category: 'Electronics',
      description: 'Premium noise-canceling headphones',
      stock: 0,
      rating: 4.6,
      reviews: 890,
      tags: ['audio', 'wireless', 'noise-canceling'],
      images: ['https://example.com/headphones1.jpg'],
      specifications: {
        batteryLife: '30 hours',
        connectivity: 'Bluetooth 5.0',
        noiseCanceling: true
      }
    }
  ];
  
  let filteredProducts = products;
  
  // Apply filters
  if (category) {
    filteredProducts = filteredProducts.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => 
      p.price >= parseFloat(minPrice)
    );
  }
  
  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => 
      p.price <= parseFloat(maxPrice)
    );
  }
  
  if (search) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  if (inStock === 'true') {
    filteredProducts = filteredProducts.filter(p => p.stock > 0);
  }
  
  // Apply sorting
  filteredProducts.sort((a, b) => {
    let aVal = a[sort];
    let bVal = b[sort];
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (order === 'desc') {
      return bVal > aVal ? 1 : -1;
    }
    return aVal > bVal ? 1 : -1;
  });
  
  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  res.json({
    products: paginatedProducts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / limit)
    },
    filters: {
      category,
      minPrice,
      maxPrice,
      search,
      inStock
    },
    sort: {
      field: sort,
      order
    }
  });
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  
  const product = {
    id: parseInt(id),
    name: 'MacBook Pro 16"',
    price: 2499.99,
    category: 'Electronics',
    description: 'High-performance laptop for professionals',
    stock: 50,
    rating: 4.8,
    reviews: 1250,
    tags: ['laptop', 'apple', 'professional'],
    images: [
      'https://example.com/macbook1.jpg',
      'https://example.com/macbook2.jpg',
      'https://example.com/macbook3.jpg'
    ],
    specifications: {
      processor: 'M2 Pro',
      memory: '16GB',
      storage: '512GB SSD',
      display: '16.2-inch Liquid Retina XDR',
      graphics: '19-core GPU',
      ports: ['Thunderbolt 4', 'HDMI', 'SDXC card slot']
    },
    reviews: [
      {
        id: 1,
        user: 'Tech Enthusiast',
        rating: 5,
        comment: 'Amazing performance!',
        date: '2023-12-01T00:00:00.000Z'
      }
    ],
    relatedProducts: [2, 3, 4]
  };
  
  res.json(product);
});

// 🛒 Shopping Cart and Orders
app.post('/api/cart/add', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  
  if (!productId) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Product ID is required',
      code: 'MISSING_PRODUCT_ID'
    });
  }
  
  res.json({
    success: true,
    message: 'Product added to cart',
    cart: {
      itemId: Math.floor(Math.random() * 1000),
      productId: parseInt(productId),
      quantity: parseInt(quantity),
      addedAt: new Date().toISOString()
    }
  });
});

app.post('/api/orders', (req, res) => {
  const { 
    items, 
    shippingAddress, 
    paymentMethod,
    customerInfo 
  } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Order must contain at least one item',
      code: 'EMPTY_ORDER'
    });
  }
  
  const order = {
    id: Math.floor(Math.random() * 10000),
    items,
    shippingAddress,
    paymentMethod,
    customerInfo,
    status: 'pending',
    total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    createdAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    order,
    trackingNumber: 'TRK' + Math.random().toString(36).substr(2, 8).toUpperCase()
  });
});

// 🏥 Health and Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected',
      cache: 'connected',
      queue: 'connected'
    }
  });
});

// 🚨 Error Handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    requestId: 'req_' + Date.now()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'POST /api/auth/login',
      'GET /api/users/profile',
      'GET /api/products',
      'GET /api/products/:id',
      'POST /api/cart/add',
      'POST /api/orders',
      'GET /api/health'
    ]
  });
});

// 🚀 Start Server
app.listen(port, () => {
  console.log(`\n🎉 Advanced OpenAPI Example Server Started!`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📡 Server: http://localhost:${port}`);
  console.log(`📁 OpenAPI spec: ./advanced-api-docs/E-Commerce_API.json`);
  console.log(`${'='.repeat(70)}`);
  console.log(`\n🧪 Test these endpoints to generate comprehensive documentation:`);
  console.log(`🔐 POST /api/auth/login (with body: { "email": "user@example.com", "password": "password123" })`);
  console.log(`👤 GET /api/users/profile`);
  console.log(`🛍️ GET /api/products?category=Electronics&minPrice=100&sort=price&order=asc`);
  console.log(`🛍️ GET /api/products/1`);
  console.log(`🛒 POST /api/cart/add (with body: { "productId": 1, "quantity": 2 })`);
  console.log(`📦 POST /api/orders (with complex order data)`);
  console.log(`🏥 GET /api/health`);
  console.log(`\n💡 The generated OpenAPI spec will have:`);
  console.log(`   ✅ Real captured data as examples`);
  console.log(`   ✅ Postman-compatible simple examples`);
  console.log(`   ✅ Swagger UI-compatible detailed examples`);
  console.log(`   ✅ Proper error responses`);
  console.log(`   ✅ Sensitive data redaction`);
  console.log(`\n📋 Import the spec into Postman or Swagger Editor to see the magic!`);
  console.log(`${'='.repeat(70)}\n`);
});
