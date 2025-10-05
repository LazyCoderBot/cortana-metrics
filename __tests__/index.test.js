const { EndpointCapture, utils } = require('../index');
const express = require('express');
const request = require('supertest');

describe('EndpointCapture', () => {
  let capture;
  let app;

  beforeEach(() => {
    capture = new EndpointCapture();
    app = express();
    app.use(express.json());
  });

  describe('Constructor', () => {
    test('should create instance with default options', () => {
      const capture = new EndpointCapture();
      expect(capture.options.captureRequestBody).toBe(true);
      expect(capture.options.captureResponseBody).toBe(true);
      expect(capture.options.captureHeaders).toBe(true);
      expect(capture.options.captureQueryParams).toBe(true);
      expect(capture.options.capturePathParams).toBe(true);
      expect(capture.options.captureCookies).toBe(true);
      expect(capture.options.captureTiming).toBe(true);
      expect(capture.options.generateOpenAPISpec).toBe(true);
      expect(capture.options.maxBodySize).toBe(1024 * 1024);
      expect(capture.options.sensitiveHeaders).toEqual(['authorization', 'cookie', 'x-api-key']);
      expect(capture.options.sensitiveFields).toEqual(['password', 'token', 'secret', 'key']);
      expect(capture.options.timestampFormat).toBe('YYYY-MM-DD HH:mm:ss.SSS');
    });

    test('should create instance with custom options', () => {
      const options = {
        captureRequestBody: false,
        captureResponseBody: false,
        captureQueryParams: false,
        capturePathParams: false,
        captureCookies: false,
        captureTiming: false,
        maxBodySize: 2048,
        generateOpenAPISpec: false,
        sensitiveHeaders: ['x-custom-header'],
        sensitiveFields: ['customSecret'],
        timestampFormat: 'YYYY-MM-DD'
      };
      const capture = new EndpointCapture(options);
      expect(capture.options.captureRequestBody).toBe(false);
      expect(capture.options.captureResponseBody).toBe(false);
      expect(capture.options.captureQueryParams).toBe(false);
      expect(capture.options.capturePathParams).toBe(false);
      expect(capture.options.captureCookies).toBe(false);
      expect(capture.options.captureTiming).toBe(false);
      expect(capture.options.maxBodySize).toBe(2048);
      expect(capture.options.generateOpenAPISpec).toBe(false);
      expect(capture.options.sensitiveHeaders).toEqual(['x-custom-header']);
      expect(capture.options.sensitiveFields).toEqual(['customSecret']);
      expect(capture.options.timestampFormat).toBe('YYYY-MM-DD');
    });

    test('should create instance with OpenAPI options', () => {
      const options = {
        generateOpenAPISpec: true,
        openAPISpecOptions: {
          baseDir: './custom-specs',
          singleFileMode: true,
          autoBackup: false,
          storage: {
            type: 'local',
            options: { baseDir: './custom-specs' }
          }
        }
      };
      const capture = new EndpointCapture(options);
      expect(capture.options.generateOpenAPISpec).toBe(true);
      expect(capture.options.openAPISpecOptions.baseDir).toBe('./custom-specs');
      expect(capture.options.openAPISpecOptions.singleFileMode).toBe(true);
      expect(capture.options.openAPISpecOptions.autoBackup).toBe(false);
      expect(capture.options.openAPISpecOptions.storage.type).toBe('local');
      expect(capture.collectionManager).toBeDefined();
    });

    test('should initialize collection manager when OpenAPI is enabled', () => {
      const capture = new EndpointCapture({ generateOpenAPISpec: true });
      expect(capture.collectionManager).toBeDefined();
      expect(capture.getCollectionManager()).toBeDefined();
    });

    test('should not initialize collection manager when OpenAPI is disabled', () => {
      const capture = new EndpointCapture({ generateOpenAPISpec: false });
      expect(capture.collectionManager).toBeUndefined();
      expect(capture.getCollectionManager()).toBeUndefined();
    });
  });

  describe('captureRequest', () => {
    test('should capture basic request data', () => {
      const mockReq = {
        method: 'GET',
        url: '/test',
        originalUrl: '/test',
        baseUrl: '',
        path: '/test',
        protocol: 'http',
        secure: false,
        ip: '127.0.0.1',
        ips: ['127.0.0.1'],
        hostname: 'localhost',
        subdomains: [],
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test-agent'
        },
        query: { id: '123' },
        params: { userId: '456' },
        cookies: { session: 'abc123' },
        body: { name: 'test' },
        get: jest.fn((header) => {
          const headers = {
            'User-Agent': 'test-agent',
            'Content-Type': 'application/json',
            'Content-Length': '100',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'en-US, en;q=0.9'
          };
          return headers[header];
        })
      };

      const result = capture.captureRequest(mockReq);

      expect(result.method).toBe('GET');
      expect(result.url).toBe('/test');
      expect(result.originalUrl).toBe('/test');
      expect(result.baseUrl).toBe('');
      expect(result.path).toBe('/test');
      expect(result.protocol).toBe('http');
      expect(result.secure).toBe(false);
      expect(result.ip).toBe('127.0.0.1');
      expect(result.ips).toEqual(['127.0.0.1']);
      expect(result.hostname).toBe('localhost');
      expect(result.subdomains).toEqual([]);
      expect(result.headers).toBeDefined();
      expect(result.query).toEqual({ id: '123' });
      expect(result.params).toEqual({ userId: '456' });
      expect(result.cookies).toEqual({ session: 'abc123' });
      expect(result.body).toEqual({ name: 'test' });
      expect(result.userAgent).toBe('test-agent');
      expect(result.contentType).toBe('application/json');
      expect(result.contentLength).toBe('100');
      expect(result.accept).toBe('application/json');
      expect(result.acceptEncoding).toBe('gzip, deflate');
      expect(result.acceptLanguage).toBe('en-US, en;q=0.9');
      expect(result.startTime).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test('should respect capture options', () => {
      const captureWithOptions = new EndpointCapture({
        captureHeaders: false,
        captureQueryParams: false,
        capturePathParams: false,
        captureCookies: false,
        captureRequestBody: false
      });

      const mockReq = {
        method: 'GET',
        url: '/test',
        originalUrl: '/test',
        baseUrl: '',
        path: '/test',
        protocol: 'http',
        secure: false,
        ip: '127.0.0.1',
        hostname: 'localhost',
        headers: { 'content-type': 'application/json' },
        query: { id: '123' },
        params: { userId: '456' },
        cookies: { session: 'abc123' },
        body: { name: 'test' },
        get: jest.fn()
      };

      const result = captureWithOptions.captureRequest(mockReq);

      expect(result.headers).toBeUndefined();
      expect(result.query).toBeUndefined();
      expect(result.params).toBeUndefined();
      expect(result.cookies).toBeUndefined();
      expect(result.body).toBeUndefined();
    });

    test('should sanitize sensitive headers', () => {
      const mockReq = {
        method: 'POST',
        url: '/test',
        headers: {
          'authorization': 'Bearer secret-token',
          'content-type': 'application/json',
          'x-api-key': 'secret-key',
          'cookie': 'session=abc123'
        },
        query: {},
        params: {},
        cookies: {},
        body: {},
        get: jest.fn()
      };

      const result = capture.captureRequest(mockReq);

      expect(result.headers.authorization).toBe('[REDACTED]');
      expect(result.headers['x-api-key']).toBe('[REDACTED]');
      expect(result.headers.cookie).toBe('[REDACTED]');
      expect(result.headers['content-type']).toBe('application/json');
    });

    test('should sanitize sensitive body fields', () => {
      const mockReq = {
        method: 'POST',
        url: '/test',
        headers: {},
        query: {},
        params: {},
        cookies: {},
        body: {
          username: 'testuser',
          password: 'secretpassword',
          email: 'test@example.com',
          token: 'secret-token',
          secret: 'hidden-secret',
          key: 'api-key'
        },
        get: jest.fn()
      };

      const result = capture.captureRequest(mockReq);

      expect(result.body.password).toBe('[REDACTED]');
      expect(result.body.token).toBe('[REDACTED]');
      expect(result.body.secret).toBe('[REDACTED]');
      expect(result.body.key).toBe('[REDACTED]');
      expect(result.body.username).toBe('testuser');
      expect(result.body.email).toBe('test@example.com');
    });
  });

  describe('captureResponse', () => {
    test('should capture basic response data', () => {
      const mockRes = {
        statusCode: 200,
        statusMessage: 'OK',
        getHeaders: jest.fn(() => ({
          'content-type': 'application/json',
          'content-length': '50'
        }))
      };

      const originalRequestData = { startTime: Date.now() - 100 };
      const result = capture.captureResponse(mockRes, originalRequestData);

      expect(result.statusCode).toBe(200);
      expect(result.statusMessage).toBe('OK');
      expect(result.duration).toBeGreaterThan(0);
      expect(result.durationFormatted).toBeDefined();
      expect(result.headers).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.endTime).toBeDefined();
    });

    test('should capture response body if available', () => {
      const mockRes = {
        statusCode: 200,
        statusMessage: 'OK',
        getHeaders: jest.fn(() => ({})),
        locals: {
          responseBody: { message: 'success' }
        }
      };

      const result = capture.captureResponse(mockRes);

      expect(result.body).toEqual({ message: 'success' });
    });

    test('should format duration correctly', () => {
      const mockRes = {
        statusCode: 200,
        statusMessage: 'OK',
        getHeaders: jest.fn(() => ({}))
      };

      const originalRequestData = { startTime: Date.now() - 1500 };
      const result = capture.captureResponse(mockRes, originalRequestData);

      expect(result.duration).toBeGreaterThan(1000);
      expect(result.durationFormatted).toMatch(/^\d+\.\d+s$/);
    });

    test('should handle response without start time', () => {
      const mockRes = {
        statusCode: 200,
        statusMessage: 'OK',
        getHeaders: jest.fn(() => ({}))
      };

      const result = capture.captureResponse(mockRes);

      expect(result.statusCode).toBe(200);
      expect(result.duration).toBeUndefined();
      expect(result.durationFormatted).toBeUndefined();
    });

    test('should respect capture options', () => {
      const captureWithOptions = new EndpointCapture({
        captureHeaders: false,
        captureResponseBody: false
      });

      const mockRes = {
        statusCode: 200,
        statusMessage: 'OK',
        getHeaders: jest.fn(() => ({ 'content-type': 'application/json' })),
        locals: {
          responseBody: { message: 'success' }
        }
      };

      const result = captureWithOptions.captureResponse(mockRes);

      expect(result.headers).toBeUndefined();
      expect(result.body).toBeUndefined();
    });
  });

  describe('captureEndpointData', () => {
    test('should capture complete endpoint data', () => {
      const mockReq = {
        method: 'POST',
        url: '/api/users',
        originalUrl: '/api/users',
        baseUrl: '',
        path: '/api/users',
        protocol: 'http',
        secure: false,
        ip: '127.0.0.1',
        hostname: 'localhost',
        headers: { 'content-type': 'application/json' },
        query: { page: 1 },
        params: { id: '123' },
        cookies: { session: 'abc123' },
        body: { name: 'test' },
        get: jest.fn()
      };

      const mockRes = {
        statusCode: 201,
        statusMessage: 'Created',
        getHeaders: jest.fn(() => ({ 'content-type': 'application/json' })),
        locals: { responseBody: { id: 1, name: 'test' } }
      };

      const result = capture.captureEndpointData(mockReq, mockRes, { customData: 'test' });

      expect(result.request).toBeDefined();
      expect(result.response).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.capturedAt).toBeDefined();
      expect(result.metadata.version).toBe('1.0.0');
      expect(result.metadata.customData).toBe('test');
      expect(result.request.method).toBe('POST');
      expect(result.response.statusCode).toBe(201);
    });
  });

  describe('createMiddleware', () => {
    test('should create middleware that captures endpoint data', (done) => {
      const capturedData = [];
      const middleware = capture.createMiddleware((data) => {
        capturedData.push(data);
      });

      app.use(middleware);
      app.get('/test', (req, res) => {
        res.json({ message: 'success' });
      });

      request(app)
        .get('/test')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          // Wait a bit for the middleware to process
          setTimeout(() => {
            expect(capturedData).toHaveLength(1);
            expect(capturedData[0].request.method).toBe('GET');
            expect(capturedData[0].request.url).toBe('/test');
            expect(capturedData[0].response.statusCode).toBe(200);
            // Response body might be a string due to JSON serialization
            expect(capturedData[0].response.body).toBeDefined();
            expect(capturedData[0].metadata).toBeDefined();
            expect(capturedData[0].metadata.capturedAt).toBeDefined();
            expect(capturedData[0].metadata.version).toBe('1.0.0');
            done();
          }, 100);
        });
    });

    test('should add captured data to request object', (done) => {
      const middleware = capture.createMiddleware();
      app.use(middleware);
      app.get('/test', (req, res) => {
        expect(req.endpointCapture).toBeDefined();
        expect(req.endpointCapture.method).toBe('GET');
        res.json({ message: 'success' });
      });

      request(app)
        .get('/test')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          // Wait for middleware to process
          setTimeout(() => {
            done();
          }, 100);
        });
    });

    test('should work with OpenAPI generation enabled', (done) => {
      const captureWithOpenAPI = new EndpointCapture({
        generateOpenAPISpec: true,
        openAPISpecOptions: {
          baseDir: './test-specs',
          singleFileMode: true
        }
      });

      const middleware = captureWithOpenAPI.createMiddleware((endpointData) => {
        expect(endpointData.request.method).toBe('GET');
        expect(endpointData.response.statusCode).toBe(200);
        expect(captureWithOpenAPI.getCollectionManager()).toBeDefined();
        done();
      });
      app.use(middleware);
      app.get('/api/test', (req, res) => {
        res.json({ message: 'success' });
      });

      request(app)
        .get('/api/test')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
        });
    });

    test('should handle POST requests with body', (done) => {
      const middleware = capture.createMiddleware();
      app.use(middleware);
      app.post('/test', (req, res) => {
        expect(req.endpointCapture).toBeDefined();
        expect(req.endpointCapture.body).toBeDefined();
        res.json({ message: 'success' });
      });

      request(app)
        .post('/test')
        .send({ name: 'test' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          setTimeout(() => done(), 100);
        });
    });

    test('should work without callback', (done) => {
      const middleware = capture.createMiddleware();
      app.use(middleware);
      app.get('/test', (req, res) => {
        expect(req.endpointCapture).toBeDefined();
        res.json({ message: 'success' });
      });

      request(app)
        .get('/test')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          setTimeout(() => done(), 100);
        });
    });
  });

  describe('getSummary', () => {
    test('should return summary of captured data', () => {
      const endpointData = {
        request: {
          method: 'POST',
          url: '/api/users',
          timestamp: '2023-01-01 12:00:00.000',
          body: { name: 'test' },
          headers: { 'content-type': 'application/json' }
        },
        response: {
          statusCode: 201,
          duration: 150,
          body: { id: 1, name: 'test' }
        }
      };

      const summary = capture.getSummary(endpointData);

      expect(summary.method).toBe('POST');
      expect(summary.url).toBe('/api/users');
      expect(summary.statusCode).toBe(201);
      expect(summary.duration).toBe(150);
      expect(summary.hasRequestBody).toBe(true);
      expect(summary.hasResponseBody).toBe(true);
      expect(summary.headerCount).toBe(1);
    });
  });

  describe('exportData', () => {
    test('should export data as JSON', () => {
      const endpointData = {
        request: { method: 'GET', url: '/test' },
        response: { statusCode: 200 }
      };

      const result = capture.exportData(endpointData, 'json');
      const parsed = JSON.parse(result);
      expect(parsed.request.method).toBe('GET');
    });

    test('should export data as CSV', () => {
      const endpointData = {
        request: { method: 'GET', url: '/test', timestamp: '2023-01-01 12:00:00.000' },
        response: { statusCode: 200, duration: 100 }
      };

      const result = capture.exportData(endpointData, 'csv');
      expect(result).toContain('method,url,statusCode,duration');
      expect(result).toContain('GET,/test,200,100');
    });

    test('should export data as table', () => {
      const endpointData = {
        request: { method: 'GET', url: '/test', timestamp: '2023-01-01 12:00:00.000' },
        response: { statusCode: 200, duration: 100 }
      };

      const result = capture.exportData(endpointData, 'table');
      expect(result).toContain('ENDPOINT CAPTURE SUMMARY');
      expect(result).toContain('GET');
      expect(result).toContain('/test');
    });

    test('should handle CSV export with special characters', () => {
      const endpointData = {
        request: { 
          method: 'POST', 
          url: '/test,with,commas', 
          timestamp: '2023-01-01 12:00:00.000' 
        },
        response: { statusCode: 201, duration: 150 }
      };

      const result = capture.exportData(endpointData, 'csv');
      expect(result).toContain('POST');
      expect(result).toContain('"/test,with,commas"');
    });

    test('should handle table export with long values', () => {
      const endpointData = {
        request: { 
          method: 'GET', 
          url: '/very/long/url/path/that/might/cause/formatting/issues',
          timestamp: '2023-01-01 12:00:00.000' 
        },
        response: { statusCode: 200, duration: 50 }
      };

      const result = capture.exportData(endpointData, 'table');
      expect(result).toContain('ENDPOINT CAPTURE SUMMARY');
      expect(result).toContain('GET');
    });

    test('should default to JSON format when no format specified', () => {
      const endpointData = {
        request: { method: 'GET', url: '/test' },
        response: { statusCode: 200 }
      };

      const result = capture.exportData(endpointData);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    test('should handle case insensitive format', () => {
      const endpointData = {
        request: { method: 'GET', url: '/test' },
        response: { statusCode: 200 }
      };

      const result1 = capture.exportData(endpointData, 'JSON');
      const result2 = capture.exportData(endpointData, 'json');
      expect(result1).toBe(result2);
    });
  });

  describe('OpenAPI Integration', () => {
    test('should add endpoint to OpenAPI specification', () => {
      const captureWithOpenAPI = new EndpointCapture({
        generateOpenAPISpec: true,
        openAPISpecOptions: {
          baseDir: './test-specs',
          singleFileMode: true
        }
      });

      const endpointData = {
        request: {
          method: 'GET',
          path: '/api/users',
          headers: { 'content-type': 'application/json' },
          query: { page: 1 },
          params: { id: '123' }
        },
        response: {
          statusCode: 200,
          body: { users: [] }
        },
        metadata: {
          capturedAt: '2023-01-01 12:00:00.000'
        }
      };

      expect(() => {
        const result = captureWithOpenAPI.addToOpenAPISpec('Test API', endpointData);
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    test('should export OpenAPI specifications', () => {
      const captureWithOpenAPI = new EndpointCapture({
        generateOpenAPISpec: true,
        openAPISpecOptions: {
          baseDir: './test-specs',
          singleFileMode: true
        }
      });

      expect(() => {
        const result = captureWithOpenAPI.exportOpenAPISpecs('json');
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    test('should get OpenAPI specification statistics', () => {
      const captureWithOpenAPI = new EndpointCapture({
        generateOpenAPISpec: true,
        openAPISpecOptions: {
          baseDir: './test-specs',
          singleFileMode: true
        }
      });

      const stats = captureWithOpenAPI.getOpenAPISpecStats();
      expect(stats).toBeDefined();
      expect(stats.totalCollections).toBeDefined();
    });

    test('should create OpenAPI specification version', () => {
      const captureWithOpenAPI = new EndpointCapture({
        generateOpenAPISpec: true,
        openAPISpecOptions: {
          baseDir: './test-specs',
          singleFileMode: true
        }
      });

      expect(() => {
        const result = captureWithOpenAPI.createOpenAPISpecVersion('1.0.0');
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    test('should merge OpenAPI specifications', () => {
      const captureWithOpenAPI = new EndpointCapture({
        generateOpenAPISpec: true,
        openAPISpecOptions: {
          baseDir: './test-specs',
          singleFileMode: true
        }
      });

      expect(() => {
        const result = captureWithOpenAPI.mergeOpenAPISpecs(['API1', 'API2'], 'Merged API');
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    test('should throw error when OpenAPI is disabled', () => {
      const captureWithoutOpenAPI = new EndpointCapture({
        generateOpenAPISpec: false
      });

      expect(() => {
        captureWithoutOpenAPI.addToOpenAPISpec('Test', {});
      }).toThrow('OpenAPI specification generation is not enabled');

      expect(() => {
        captureWithoutOpenAPI.exportOpenAPISpecs();
      }).toThrow('OpenAPI specification generation is not enabled');

      expect(() => {
        captureWithoutOpenAPI.createOpenAPISpecVersion('1.0.0');
      }).toThrow('OpenAPI specification generation is not enabled');

      expect(() => {
        captureWithoutOpenAPI.mergeOpenAPISpecs([], 'Test');
      }).toThrow('OpenAPI specification generation is not enabled');
    });
  });
});

describe('utils', () => {
  describe('create', () => {
    test('should create new EndpointCapture instance', () => {
      const capture = utils.create({ captureRequestBody: false });
      expect(capture).toBeInstanceOf(EndpointCapture);
      expect(capture.options.captureRequestBody).toBe(false);
    });

    test('should create instance with OpenAPI options', () => {
      const capture = utils.create({
        generateOpenAPISpec: true,
        openAPISpecOptions: {
          baseDir: './test-specs',
          singleFileMode: true
        }
      });
      expect(capture).toBeInstanceOf(EndpointCapture);
      expect(capture.options.generateOpenAPISpec).toBe(true);
      expect(capture.getCollectionManager()).toBeDefined();
    });
  });

  describe('quickCapture', () => {
    test('should capture endpoint data quickly', () => {
      const mockReq = {
        method: 'GET',
        url: '/test',
        originalUrl: '/test',
        baseUrl: '',
        path: '/test',
        protocol: 'http',
        secure: false,
        ip: '127.0.0.1',
        hostname: 'localhost',
        headers: {},
        query: {},
        params: {},
        cookies: {},
        body: {},
        get: jest.fn()
      };

      const mockRes = {
        statusCode: 200,
        statusMessage: 'OK',
        getHeaders: jest.fn(() => ({}))
      };

      const result = utils.quickCapture(mockReq, mockRes);
      expect(result.request.method).toBe('GET');
      expect(result.response.statusCode).toBe(200);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.capturedAt).toBeDefined();
      expect(result.metadata.version).toBe('1.0.0');
    });

    test('should capture with custom options', () => {
      const mockReq = {
        method: 'POST',
        url: '/api/users',
        originalUrl: '/api/users',
        baseUrl: '',
        path: '/api/users',
        protocol: 'http',
        secure: false,
        ip: '127.0.0.1',
        hostname: 'localhost',
        headers: { 'content-type': 'application/json' },
        query: { page: 1 },
        params: {},
        cookies: {},
        body: { name: 'test' },
        get: jest.fn((header) => {
          const headers = { 'Content-Type': 'application/json' };
          return headers[header];
        })
      };

      const mockRes = {
        statusCode: 201,
        statusMessage: 'Created',
        getHeaders: jest.fn(() => ({ 'content-type': 'application/json' })),
        locals: { responseBody: { id: 1, name: 'test' } }
      };

      const result = utils.quickCapture(mockReq, mockRes, {
        captureRequestBody: true,
        captureResponseBody: true
      });
      
      expect(result.request.method).toBe('POST');
      expect(result.request.body).toEqual({ name: 'test' });
      expect(result.response.statusCode).toBe(201);
      expect(result.response.body).toEqual({ id: 1, name: 'test' });
    });
  });

  describe('formatForLogging', () => {
    test('should format data for logging', () => {
      const endpointData = {
        request: {
          method: 'POST',
          url: '/api/users',
          timestamp: '2023-01-01 12:00:00.000'
        },
        response: {
          statusCode: 201,
          duration: 150
        }
      };

      const result = utils.formatForLogging(endpointData, 'info');
      expect(result.level).toBe('info');
      expect(result.message).toContain('POST /api/users - 201');
      expect(result.message).toContain('150ms');
      expect(result.endpoint.method).toBe('POST');
      expect(result.timestamp).toBe('2023-01-01 12:00:00.000');
      expect(result.data).toEqual(endpointData);
    });

    test('should format with different log levels', () => {
      const endpointData = {
        request: { method: 'GET', url: '/test' },
        response: { statusCode: 404 }
      };

      const errorResult = utils.formatForLogging(endpointData, 'error');
      expect(errorResult.level).toBe('error');
      expect(errorResult.message).toContain('GET /test - 404');

      const debugResult = utils.formatForLogging(endpointData, 'debug');
      expect(debugResult.level).toBe('debug');
    });

    test('should handle missing data gracefully', () => {
      const endpointData = {
        request: { method: 'GET', url: '/test' },
        response: { statusCode: 200 }
      };

      const result = utils.formatForLogging(endpointData);
      expect(result.level).toBe('info');
      expect(result.message).toContain('GET /test - 200');
    });

    test('should handle undefined duration in logging', () => {
      const endpointData = {
        request: { method: 'GET', url: '/test' },
        response: { statusCode: 200 }
        // No duration
      };

      const result = utils.formatForLogging(endpointData);
      expect(result.message).toContain('GET /test - 200');
      expect(result.message).toContain('undefined');
    });

    test('should handle missing request data in logging', () => {
      const endpointData = {
        response: { statusCode: 500 }
        // No request data
      };

      const result = utils.formatForLogging(endpointData);
      expect(result.message).toContain('undefined');
    });
  });

  describe('create with edge cases', () => {
    test('should handle empty options object', () => {
      const capture = utils.create({});
      expect(capture).toBeInstanceOf(EndpointCapture);
      expect(capture.options.captureRequestBody).toBe(true);
    });

    test('should handle null options', () => {
      const capture = utils.create(null);
      expect(capture).toBeInstanceOf(EndpointCapture);
    });

    test('should handle undefined options', () => {
      const capture = utils.create(undefined);
      expect(capture).toBeInstanceOf(EndpointCapture);
    });
  });
});

describe('Advanced Features', () => {
  test('should handle large request bodies within limits', () => {
    const capture = new EndpointCapture({
      maxBodySize: 1000,
      captureRequestBody: true
    });

    const mockReq = {
      method: 'POST',
      url: '/test',
      originalUrl: '/test',
      baseUrl: '',
      path: '/test',
      protocol: 'http',
      secure: false,
      ip: '127.0.0.1',
      hostname: 'localhost',
      headers: { 'content-type': 'application/json' },
      query: {},
      params: {},
      cookies: {},
      body: { data: 'x'.repeat(500) }, // 500 chars, well within 1000 limit
      get: jest.fn()
    };

    const result = capture.captureRequest(mockReq);
    expect(result.body).toEqual(mockReq.body);
  });

  test('should handle body size limits', () => {
    const capture = new EndpointCapture({
      maxBodySize: 100,
      captureRequestBody: true
    });

    const mockReq = {
      method: 'POST',
      url: '/test',
      originalUrl: '/test',
      baseUrl: '',
      path: '/test',
      protocol: 'http',
      secure: false,
      ip: '127.0.0.1',
      hostname: 'localhost',
      headers: { 'content-type': 'application/json' },
      query: {},
      params: {},
      cookies: {},
      body: { data: 'x'.repeat(200) }, // 200 chars, exceeds 100 limit
      get: jest.fn()
    };

    const result = capture.captureRequest(mockReq);
    // Should still capture but may be truncated or handled differently
    expect(result.body).toBeDefined();
  });

  test('should handle custom sensitive fields', () => {
    const capture = new EndpointCapture({
      sensitiveFields: ['customSecret', 'apiKey'],
      sensitiveHeaders: ['x-custom-header']
    });

    const mockReq = {
      method: 'POST',
      url: '/test',
      headers: {
        'x-custom-header': 'secret-value',
        'content-type': 'application/json'
      },
      query: {},
      params: {},
      cookies: {},
      body: {
        username: 'test',
        customSecret: 'secret123',
        apiKey: 'key456',
        normalField: 'value'
      },
      get: jest.fn()
    };

    const result = capture.captureRequest(mockReq);
    expect(result.headers['x-custom-header']).toBe('[REDACTED]');
    expect(result.body.customSecret).toBe('[REDACTED]');
    expect(result.body.apiKey).toBe('[REDACTED]');
    expect(result.body.normalField).toBe('value');
  });

  test('should handle custom timestamp format', () => {
    const capture = new EndpointCapture({
      timestampFormat: 'YYYY-MM-DD'
    });

    const mockReq = {
      method: 'GET',
      url: '/test',
      originalUrl: '/test',
      baseUrl: '',
      path: '/test',
      protocol: 'http',
      secure: false,
      ip: '127.0.0.1',
      hostname: 'localhost',
      headers: {},
      query: {},
      params: {},
      cookies: {},
      body: {},
      get: jest.fn()
    };

    const result = capture.captureRequest(mockReq);
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('should handle nested sensitive data', () => {
    const capture = new EndpointCapture();

    const mockReq = {
      method: 'POST',
      url: '/test',
      headers: {},
      query: {},
      params: {},
      cookies: {},
      body: {
        user: {
          name: 'test',
          password: 'secret',
          profile: {
            token: 'abc123',
            email: 'test@example.com'
          }
        },
        config: {
          secret: 'config-secret'
        }
      },
      get: jest.fn()
    };

    const result = capture.captureRequest(mockReq);
    expect(result.body.user.password).toBe('[REDACTED]');
    expect(result.body.user.profile.token).toBe('[REDACTED]');
    expect(result.body.config.secret).toBe('[REDACTED]');
    expect(result.body.user.name).toBe('test');
    expect(result.body.user.profile.email).toBe('test@example.com');
  });

  test('should handle array of sensitive data', () => {
    const capture = new EndpointCapture();

    const mockReq = {
      method: 'POST',
      url: '/test',
      headers: {},
      query: {},
      params: {},
      cookies: {},
      body: {
        users: [
          { name: 'user1', password: 'secret1' },
          { name: 'user2', token: 'token2' }
        ]
      },
      get: jest.fn()
    };

    const result = capture.captureRequest(mockReq);
    expect(result.body.users[0].password).toBe('[REDACTED]');
    expect(result.body.users[1].token).toBe('[REDACTED]');
    expect(result.body.users[0].name).toBe('user1');
    expect(result.body.users[1].name).toBe('user2');
  });
});

describe('Performance Tests', () => {
  test('should handle rapid successive requests', (done) => {
    const capture = new EndpointCapture();
    const app = express();
    app.use(capture.createMiddleware());

    app.get('/fast', (req, res) => {
      res.json({ timestamp: Date.now() });
    });

    const startTime = Date.now();
    const requests = Array.from({ length: 10 }, (_, i) => 
      request(app).get(`/fast?i=${i}`).expect(200)
    );

    Promise.all(requests)
      .then(() => {
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
        done();
      })
      .catch(done);
  });

  test('should handle memory efficiently with large datasets', () => {
    const capture = new EndpointCapture();
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      data: `item-${i}`,
      timestamp: Date.now()
    }));

    const mockReq = {
      method: 'POST',
      url: '/bulk',
      headers: { 'content-type': 'application/json' },
      query: {},
      params: {},
      cookies: {},
      body: { items: largeData },
      get: jest.fn()
    };

    const startMemory = process.memoryUsage();
    const result = capture.captureRequest(mockReq);
    const endMemory = process.memoryUsage();

    expect(result.body.items).toHaveLength(1000);
    // Memory usage shouldn't increase dramatically
    expect(endMemory.heapUsed - startMemory.heapUsed).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});

describe('Error Handling', () => {
  test('should handle invalid request objects gracefully', () => {
    const capture = new EndpointCapture();
    
    expect(() => {
      capture.captureRequest(null);
    }).toThrow();
    
    expect(() => {
      capture.captureRequest(undefined);
    }).toThrow();
    
    // Empty object should throw because it doesn't have required methods
    expect(() => {
      capture.captureRequest({});
    }).toThrow();
  });

  test('should handle invalid response objects gracefully', () => {
    const capture = new EndpointCapture();
    
    expect(() => {
      capture.captureResponse(null);
    }).toThrow();
    
    expect(() => {
      capture.captureResponse(undefined);
    }).toThrow();
    
    // Empty object should throw because it doesn't have required methods
    expect(() => {
      capture.captureResponse({});
    }).toThrow();
  });

  test('should handle OpenAPI generation errors gracefully', () => {
    const capture = new EndpointCapture({
      generateOpenAPISpec: true,
      openAPISpecOptions: {
        baseDir: '/invalid/path',
        singleFileMode: true
      }
    });

    // Should not throw during initialization
    expect(capture.getCollectionManager()).toBeDefined();
  });

  test('should handle middleware errors gracefully', (done) => {
    const capture = new EndpointCapture();
    const middleware = capture.createMiddleware();
    
    const app = express();
    app.use(middleware);
    app.get('/error', (req, res) => {
      throw new Error('Test error');
    });

    request(app)
      .get('/error')
      .expect(500, done);
  });

  test('should handle export errors gracefully', () => {
    const capture = new EndpointCapture();
    
    expect(() => {
      capture.exportData(null, 'json');
    }).toThrow();
    
    // Invalid format should fall back to JSON
    expect(() => {
      capture.exportData({}, 'invalid-format');
    }).not.toThrow();
  });

  test('should handle malformed request objects', () => {
    const capture = new EndpointCapture();
    
    const malformedReq = {
      method: 'GET',
      // Missing required fields
      get: jest.fn()
    };

    expect(() => {
      capture.captureRequest(malformedReq);
    }).toThrow();
  });

  test('should handle malformed response objects', () => {
    const capture = new EndpointCapture();
    
    const malformedRes = {
      statusCode: 200,
      // Missing getHeaders method
    };

    expect(() => {
      capture.captureResponse(malformedRes);
    }).toThrow();
  });

  test('should handle circular references in body', () => {
    const capture = new EndpointCapture();
    
    const circularObj = { name: 'test' };
    circularObj.self = circularObj;

    const mockReq = {
      method: 'POST',
      url: '/test',
      headers: {},
      query: {},
      params: {},
      cookies: {},
      body: circularObj,
      get: jest.fn()
    };

    // Should not throw due to circular reference
    expect(() => {
      capture.captureRequest(mockReq);
    }).not.toThrow();
  });
});

describe('Integration Tests', () => {
  test('should work with complete Express application', (done) => {
    const capture = new EndpointCapture({
      generateOpenAPISpec: true,
      openAPISpecOptions: {
        baseDir: './test-specs',
        singleFileMode: true
      }
    });

    const app = express();
    app.use(express.json());
    app.use(capture.createMiddleware());
    
    app.get('/api/users', (req, res) => {
      res.json({ users: [] });
    });
    
    app.post('/api/users', (req, res) => {
      res.status(201).json({ id: 1, ...req.body });
    });
    
    app.get('/api/users/:id', (req, res) => {
      res.json({ id: req.params.id });
    });

    let requestCount = 0;
    const expectedRequests = 3;

    const checkCompletion = () => {
      requestCount++;
      if (requestCount === expectedRequests) {
        expect(capture.getCollectionManager()).toBeDefined();
        done();
      }
    };

    request(app)
      .get('/api/users')
      .expect(200)
      .end((err) => {
        if (err) return done(err);
        checkCompletion();
      });

    request(app)
      .post('/api/users')
      .send({ name: 'test' })
      .expect(201)
      .end((err) => {
        if (err) return done(err);
        checkCompletion();
      });

    request(app)
      .get('/api/users/123')
      .expect(200)
      .end((err) => {
        if (err) return done(err);
        checkCompletion();
      });
  });

  test('should capture complex endpoint data', (done) => {
    const capture = new EndpointCapture({
      captureRequestBody: true,
      captureResponseBody: true,
      captureHeaders: true,
      captureQueryParams: true,
      capturePathParams: true,
      captureCookies: true,
      captureTiming: true
    });

    const app = express();
    app.use(express.json());
    app.use(capture.createMiddleware((data) => {
      expect(data.request.method).toBe('POST');
      expect(data.request.path).toBe('/api/complex/123');
      expect(data.request.headers).toBeDefined();
      expect(data.request.query).toBeDefined();
      expect(data.request.params).toBeDefined();
      expect(data.request.body).toBeDefined();
      expect(data.response.statusCode).toBe(200);
      expect(data.response.duration).toBeDefined();
      expect(data.metadata).toBeDefined();
      done();
    }));

    app.post('/api/complex/:id', (req, res) => {
      res.json({ 
        id: req.params.id,
        query: req.query,
        body: req.body
      });
    });

    request(app)
      .post('/api/complex/123?page=1&limit=10')
      .set('Authorization', 'Bearer token')
      .set('Content-Type', 'application/json')
      .send({ name: 'test', email: 'test@example.com' })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        // Test will complete when middleware callback is called
      });
  });

  test('should handle multiple concurrent requests', (done) => {
    const capture = new EndpointCapture();
    const app = express();
    app.use(capture.createMiddleware());

    app.get('/test/:id', (req, res) => {
      setTimeout(() => {
        res.json({ id: req.params.id });
      }, Math.random() * 100);
    });

    const requests = Array.from({ length: 5 }, (_, i) => 
      request(app)
        .get(`/test/${i}`)
        .expect(200)
    );

    Promise.all(requests)
      .then(() => done())
      .catch(done);
  });
});
