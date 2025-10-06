const express = require('express');
const { EndpointCapture, utils } = require('cortana-metrics');

const app = express();
app.use(express.json());

// Create capture instance with comprehensive options
const capture = new EndpointCapture({
  captureRequestBody: true,
  captureResponseBody: true,
  captureHeaders: true,
  captureQueryParams: true,
  capturePathParams: true,
  captureCookies: true,
  captureTiming: true,
  maxBodySize: 1024 * 1024, // 1MB
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
    'apiKey'
  ],
  timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
});

// Use middleware for automatic capture with enhanced logging
app.use(capture.createMiddleware((data) => {
  // Get summary of captured data
  const summary = capture.getSummary(data);

  console.log(`\n${'='.repeat(50)}`);
  console.log('ENDPOINT CAPTURED');
  console.log('='.repeat(50));
  console.log(`Method: ${summary.method}`);
  console.log(`URL: ${summary.url}`);
  console.log(`Status: ${summary.statusCode}`);
  console.log(`Duration: ${summary.duration}ms`);
  console.log(`Timestamp: ${summary.timestamp}`);
  console.log(`Has Request Body: ${summary.hasRequestBody}`);
  console.log(`Has Response Body: ${summary.hasResponseBody}`);
  console.log(`Header Count: ${summary.headerCount}`);
  console.log('='.repeat(50));

  // Show different export formats
  console.log('\n📊 Data Export Examples:');
  console.log('JSON:', `${capture.exportData(data, 'json').substring(0, 100)}...`);
  console.log('CSV:', capture.exportData(data, 'csv'));
  console.log('Table:', capture.exportData(data, 'table'));

  // Show formatted logging
  const logData = utils.formatForLogging(data, 'info');
  console.log('\n📝 Formatted for Logging:');
  console.log(JSON.stringify(logData, null, 2));
}));

// Example routes with comprehensive data capture
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/users', (req, res) => {
  // Access captured data and query parameters
  const { page = 1, limit = 10, search, sort } = req.query;
  console.log('Query params captured:', { page, limit, search, sort });
  console.log('Captured data available:', !!req.capturedEndpointData);

  // Simulate database query with pagination
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
  ];

  res.json({
    users: users.slice((page - 1) * limit, page * limit),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: users.length
    }
  });
});

app.post('/api/users', (req, res) => {
  const { name, email, password } = req.body;

  // Simulate validation
  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['name', 'email', 'password']
    });
  }

  // Simulate user creation with sensitive data
  const newUser = {
    id: Date.now(),
    name,
    email,
    password: '[REDACTED]', // Password would be redacted in captured data
    ssn: '[REDACTED]', // SSN would be redacted in captured data
    creditCard: '[REDACTED]', // Credit card would be redacted in captured data
    createdAt: new Date().toISOString()
  };
  res.status(201).json(newUser);
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  console.log('Path param captured:', { id });

  // Simulate user lookup
  const user = {
    id: parseInt(id),
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: '2023-01-01T00:00:00.000Z'
  };
  res.json(user);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  // Simulate user update
  const updatedUser = {
    id: parseInt(id),
    name: name || 'John Doe',
    email: email || 'john@example.com',
    password: '[REDACTED]',
    updatedAt: new Date().toISOString()
  };
  res.json(updatedUser);
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  console.log('Deleting user:', id);
  res.status(204).send();
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error('Error occurred:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler for non-existent routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n🚀 Basic Usage Example Server Started!');
  console.log('='.repeat(60));
  console.log(`📡 Server running on port ${PORT}`);
  console.log('🔧 Features enabled:');
  console.log('  ✅ Request/Response body capture');
  console.log('  ✅ Headers capture with sensitive data redaction');
  console.log('  ✅ Query parameters capture');
  console.log('  ✅ Path parameters capture');
  console.log('  ✅ Cookies capture');
  console.log('  ✅ Timing information');
  console.log('  ✅ Data export (JSON, CSV, Table)');
  console.log('  ✅ Formatted logging');
  console.log('='.repeat(60));
  console.log('\n📋 Try these endpoints to see data capture in action:');
  console.log('🔍 GET /api/health');
  console.log('👥 GET /api/users?page=1&limit=5&search=john&sort=name');
  console.log('➕ POST /api/users (with body: { "name": "Test", "email": "test@example.com", "password": "secret", "ssn": "123-45-6789", "creditCard": "4111-1111-1111-1111" })');
  console.log('👤 GET /api/users/123');
  console.log('✏️  PUT /api/users/123 (with body: { "name": "Updated Name" })');
  console.log('🗑️  DELETE /api/users/123');
  console.log('❌ GET /api/nonexistent (404 error)');
  console.log('\n💡 Watch the console for detailed capture information!');
  console.log('='.repeat(60));
});
