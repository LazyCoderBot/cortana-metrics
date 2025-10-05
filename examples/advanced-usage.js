const express = require('express');
const { EndpointCapture, utils } = require('../index');

const app = express();
app.use(express.json());

// Advanced configuration
const capture = new EndpointCapture({
  captureRequestBody: true,
  captureResponseBody: true,
  captureHeaders: true,
  captureQueryParams: true,
  capturePathParams: true,
  captureCookies: true,
  captureTiming: true,
  maxBodySize: 2 * 1024 * 1024, // 2MB
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

// Custom middleware for analytics
app.use(capture.createMiddleware((data) => {
  const summary = capture.getSummary(data);
  
  // Log to console with formatting
  console.log('\n' + '='.repeat(60));
  console.log('API REQUEST CAPTURED');
  console.log('='.repeat(60));
  console.log(`Method: ${summary.method}`);
  console.log(`URL: ${summary.url}`);
  console.log(`Status: ${summary.statusCode}`);
  console.log(`Duration: ${summary.duration}ms`);
  console.log(`Timestamp: ${summary.timestamp}`);
  console.log(`Has Request Body: ${summary.hasRequestBody}`);
  console.log(`Has Response Body: ${summary.hasResponseBody}`);
  console.log(`Header Count: ${summary.headerCount}`);
  console.log('='.repeat(60));
  
  // Export data in different formats
  console.log('\nJSON Export:');
  console.log(capture.exportData(data, 'json'));
  
  console.log('\nCSV Export:');
  console.log(capture.exportData(data, 'csv'));
  
  console.log('\nTable Export:');
  console.log(capture.exportData(data, 'table'));
  
  // Format for logging
  const logData = utils.formatForLogging(data, 'info');
  console.log('\nFormatted for Logging:');
  console.log(logData);
}));

// Example API routes with different scenarios
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/users', (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  
  // Simulate database query
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  
  res.json({
    users,
    pagination: { page, limit, total: users.length }
  });
});

app.post('/api/users', (req, res) => {
  const { name, email, password, ssn } = req.body;
  
  // Simulate validation
  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['name', 'email', 'password']
    });
  }
  
  // Simulate user creation
  const newUser = {
    id: Date.now(),
    name,
    email,
    ssn: '[REDACTED]', // SSN would be redacted in captured data
    password: '[REDACTED]', // Password would be redacted in captured data
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json(newUser);
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
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
  const { name, email, password } = req.body;
  
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
  
  // Simulate user deletion
  res.status(204).send();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Advanced example server running on port ${PORT}`);
  console.log('\nTry these endpoints:');
  console.log('GET /api/health');
  console.log('GET /api/users?page=1&limit=5&search=john');
  console.log('POST /api/users (with body: { "name": "Test", "email": "test@example.com", "password": "secret", "ssn": "123-45-6789" })');
  console.log('GET /api/users/123');
  console.log('PUT /api/users/123 (with body: { "name": "Updated Name" })');
  console.log('DELETE /api/users/123');
  console.log('GET /api/nonexistent (404 error)');
});
