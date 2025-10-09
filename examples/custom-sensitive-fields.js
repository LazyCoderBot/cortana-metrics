const express = require('express');
const { EndpointCapture } = require('../index');

const app = express();
app.use(express.json());

// Example 1: Minimal sensitive field configuration
const minimalCapture = new EndpointCapture({
  // Only redact the most basic sensitive fields
  sensitiveHeaders: ['authorization'],
  sensitiveFields: ['password', 'token']
});

// Example 2: Comprehensive sensitive field configuration
const comprehensiveCapture = new EndpointCapture({
  sensitiveHeaders: [
    'authorization', 'cookie', 'x-api-key', 'x-auth-token', 'x-csrf-token',
    'x-session-token', 'x-access-token', 'x-refresh-token'
  ],
  sensitiveFields: [
    'password', 'token', 'secret', 'key', 'apiKey', 'accessToken', 'refreshToken',
    'ssn', 'socialSecurityNumber', 'creditCard', 'cardNumber', 'cvv', 'cvc',
    'bankAccount', 'routingNumber', 'pin', 'pincode', 'otp', 'verificationCode',
    'privateKey', 'secretKey', 'authToken', 'sessionId', 'sessionToken',
    'clientSecret', 'appSecret', 'webhookSecret', 'signature'
  ]
});

// Example 3: Industry-specific sensitive field configuration
const healthcareCapture = new EndpointCapture({
  sensitiveHeaders: ['authorization', 'x-patient-token', 'x-medical-auth'],
  sensitiveFields: [
    'patientId', 'medicalRecordNumber', 'ssn', 'socialSecurityNumber',
    'insuranceNumber', 'policyNumber', 'diagnosis', 'treatment',
    'medication', 'allergies', 'bloodType', 'emergencyContact'
  ]
});

// Example 4: Financial services sensitive field configuration
const financialCapture = new EndpointCapture({
  sensitiveHeaders: ['authorization', 'x-financial-token', 'x-bank-auth'],
  sensitiveFields: [
    'accountNumber', 'routingNumber', 'creditCard', 'cardNumber', 'cvv', 'cvc',
    'bankAccount', 'swiftCode', 'iban', 'ssn', 'taxId', 'ein',
    'balance', 'transactionAmount', 'pin', 'pincode'
  ]
});

// Example 5: E-commerce sensitive field configuration
const ecommerceCapture = new EndpointCapture({
  sensitiveHeaders: ['authorization', 'x-session-token', 'x-cart-token'],
  sensitiveFields: [
    'password', 'email', 'phone', 'address', 'billingAddress', 'shippingAddress',
    'creditCard', 'cardNumber', 'cvv', 'cvc', 'paymentMethod',
    'orderTotal', 'discountCode', 'couponCode'
  ]
});

// Example 6: No sensitive field redaction (capture everything)
const noRedactionCapture = new EndpointCapture({
  sensitiveHeaders: [],
  sensitiveFields: []
});

// Example 7: Custom sensitive field patterns
const customCapture = new EndpointCapture({
  sensitiveHeaders: [
    'authorization', 'cookie', 'x-api-key',
    'x-custom-auth', 'x-internal-token'  // Custom headers
  ],
  sensitiveFields: [
    'password', 'token', 'secret', 'key',
    'customField', 'internalData', 'confidential',  // Custom fields
    'user.*.password', 'profile.*.secret'  // Pattern matching
  ]
});

// Use the comprehensive capture for this example
app.use(comprehensiveCapture.createMiddleware((data) => {
  console.log('\n' + '='.repeat(60));
  console.log('🔒 CUSTOM SENSITIVE FIELD CONFIGURATION');
  console.log('='.repeat(60));
  console.log(`📊 Method: ${data.request.method}`);
  console.log(`🌐 URL: ${data.request.url}`);
  console.log(`📈 Status: ${data.response.statusCode}`);
  
  if (data.request.hasSensitiveData) {
    console.log(`\n🚨 Sensitive Data Detected: ${data.request.sensitiveFields.length} fields`);
    data.request.sensitiveFields.forEach(field => {
      console.log(`   - ${field.path}: ${field.type} (${field.field})`);
    });
  } else {
    console.log('\n✅ No sensitive data detected');
  }
  
  console.log('\n📋 Sanitized Request Body:');
  console.log(JSON.stringify(data.request.body, null, 2));
  console.log('='.repeat(60));
}));

// Test endpoint
app.post('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Request processed with custom sensitive field configuration',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Custom Sensitive Fields Server running on port ${PORT}`);
  console.log('\n📋 Configuration Examples:');
  console.log('1. Minimal: Only password, token, authorization');
  console.log('2. Comprehensive: 20+ sensitive field patterns');
  console.log('3. Healthcare: Medical data protection');
  console.log('4. Financial: Banking and payment data protection');
  console.log('5. E-commerce: Customer and payment data protection');
  console.log('6. No Redaction: Capture everything (use with caution)');
  console.log('7. Custom: Your own specific patterns');
  console.log('\n💡 Configure sensitive fields based on your specific needs!');
  console.log('\n🧪 Test: POST /api/test with sensitive data');
});

module.exports = app;
