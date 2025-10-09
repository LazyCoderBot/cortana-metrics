const express = require('express');
const { EndpointCapture } = require('../index');

const app = express();
app.use(express.json());

// Enhanced data capture with actual values stored in API collection
const capture = new EndpointCapture({
  captureRequestBody: true,
  captureResponseBody: true,
  captureHeaders: true,
  captureQueryParams: true,
  capturePathParams: true,
  captureCookies: true,
  captureTiming: true,
  
  // User-defined sensitive field detection
  sensitiveHeaders: [
    'authorization', 'cookie', 'x-api-key', 'x-auth-token', 'x-csrf-token'
  ],
  sensitiveFields: [
    'password', 'token', 'secret', 'key', 'apiKey', 'accessToken', 'refreshToken',
    'ssn', 'creditCard', 'cvv', 'privateKey', 'sessionId', 'clientSecret'
  ],
  
  // OpenAPI specification with S3 storage
  generateOpenAPISpec: true,
  openAPISpecOptions: {
    storage: {
      type: 's3',
      options: {
        bucket: 'your-api-collections',
        region: 'us-east-1',
        prefix: 'api-collections/'
        // Uses IAM role automatically
      }
    },
    defaultCollectionOptions: {
      title: 'API Collection with Actual Values',
      version: '1.0.0',
      includeExamples: true,
      includeSchemas: true,
      groupByPath: true
    }
  }
});

// Enhanced middleware with detailed logging
app.use(capture.createMiddleware((data) => {
  const summary = capture.getSummary(data);
  
  console.log('\n' + '='.repeat(80));
  console.log('🚀 API REQUEST CAPTURED WITH ACTUAL VALUES');
  console.log('='.repeat(80));
  console.log(`📊 Method: ${summary.method}`);
  console.log(`🌐 URL: ${summary.url}`);
  console.log(`📈 Status: ${summary.statusCode}`);
  console.log(`⏱️  Duration: ${summary.duration}ms`);
  console.log(`🕐 Timestamp: ${summary.timestamp}`);
  
  // Enhanced data analysis
  if (data.request.hasSensitiveData) {
    console.log('\n🔒 SENSITIVE DATA DETECTED:');
    console.log(`   Found ${data.request.sensitiveFields.length} sensitive fields:`);
    data.request.sensitiveFields.forEach(field => {
      console.log(`   - ${field.path}: ${field.type} (${field.field})`);
      console.log(`     Sanitized: [REDACTED]`);
      console.log(`     Actual: ${field.actualValue}`);
    });
  }
  
  // Show what's stored in the API collection
  console.log('\n📚 STORED IN API COLLECTION:');
  console.log('   ✅ Sanitized request/response bodies (safe to store)');
  console.log('   ✅ Actual request/response bodies (for reference)');
  console.log('   ✅ Data type analysis for all fields');
  console.log('   ✅ Sensitive field metadata with actual values');
  console.log('   ✅ Complete OpenAPI 3.0 specification');
  console.log('   ✅ Examples with both sanitized and actual data');
  console.log('   ✅ Custom extensions with actual values');
  
  console.log('\n📋 SANITIZED REQUEST BODY (Safe to store):');
  console.log(JSON.stringify(data.request.body, null, 2));
  
  console.log('\n🔍 ACTUAL REQUEST BODY (For reference):');
  console.log(JSON.stringify(data.request.bodyActual, null, 2));
  
  console.log('\n🏷️  DATA TYPES ANALYSIS:');
  console.log(JSON.stringify(data.request.bodyTypes, null, 2));
  
  console.log('='.repeat(80));
  console.log('💾 Data saved to S3 with actual values for reference');
  console.log('='.repeat(80));
}));

// Example API routes demonstrating actual value storage
app.post('/api/users', (req, res) => {
  // Simulate user creation with sensitive data
  const user = {
    id: 'user_' + Date.now(),
    username: req.body.username,
    email: req.body.email,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: user,
    // Include sensitive token in response
    accessToken: 'at_' + Math.random().toString(36).substr(2, 9),
    refreshToken: 'rt_' + Math.random().toString(36).substr(2, 9)
  });
});

app.post('/api/auth/login', (req, res) => {
  // Simulate authentication with sensitive tokens
  const tokens = {
    accessToken: 'at_' + Math.random().toString(36).substr(2, 9),
    refreshToken: 'rt_' + Math.random().toString(36).substr(2, 9),
    expiresIn: 3600
  };
  
  res.json({
    success: true,
    message: 'Login successful',
    tokens: tokens,
    user: {
      id: 'user_123',
      username: req.body.username,
      email: req.body.email
    }
  });
});

app.get('/api/users/:id', (req, res) => {
  // Simulate user retrieval with sensitive profile data
  const user = {
    id: req.params.id,
    username: 'john_doe',
    email: 'john@example.com',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      ssn: '123-45-6789', // This will be redacted
      creditCard: '4111-1111-1111-1111' // This will be redacted
    }
  };
  
  res.json({
    success: true,
    user: user
  });
});

app.post('/api/payments', (req, res) => {
  // Simulate payment processing with sensitive financial data
  const payment = {
    id: 'pay_' + Date.now(),
    amount: req.body.amount,
    currency: req.body.currency,
    status: 'processed',
    processedAt: new Date().toISOString(),
    // Include sensitive payment data
    transactionId: 'txn_' + Math.random().toString(36).substr(2, 9),
    cardLastFour: req.body.creditCard ? req.body.creditCard.slice(-4) : null
  };
  
  res.status(201).json({
    success: true,
    message: 'Payment processed successfully',
    payment: payment
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Collection with Actual Values Server running on port ${PORT}`);
  console.log('📊 Features enabled:');
  console.log('   ✅ User-defined sensitive data detection');
  console.log('   ✅ Data type analysis');
  console.log('   ✅ S3 storage with IAM roles');
  console.log('   ✅ Custom field sanitization');
  console.log('   ✅ Actual value capture with security');
  console.log('   ✅ Dual data capture (sanitized + actual)');
  console.log('   ✅ API collection storage with reference data');
  console.log('');
  console.log('🧪 Test endpoints:');
  console.log('POST /api/users (with sensitive user data)');
  console.log('POST /api/auth/login (with tokens)');
  console.log('GET /api/users/:id (with sensitive profile data)');
  console.log('POST /api/payments (with financial data)');
  console.log('');
  console.log('💡 All sensitive data will be automatically redacted');
  console.log('💡 Data types will be analyzed and captured');
  console.log('💡 Actual values will be stored for reference');
  console.log('💡 Files will be saved to S3 with IAM role authentication');
  console.log('💡 API collection will contain both sanitized and actual data');
});

module.exports = app;
