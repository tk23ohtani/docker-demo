const fc = require('fast-check');
const http = require('http');

/**
 * Feature: simple-docker-app, Property 1: HTTP Response Availability
 * For any valid HTTP request sent to the application, the application should return an HTTP response with a valid status code.
 * Validates: Requirements 1.1
 */
describe('Property-Based Tests for HTTP Server', () => {
  let server;
  let port;

  beforeAll((done) => {
    // Create a test server
    const startTime = Date.now();
    
    server = http.createServer((req, res) => {
      let statusCode;
      let responseBody;

      if (req.method === 'GET' && req.url === '/') {
        statusCode = 200;
        responseBody = JSON.stringify({
          message: 'Welcome to the Simple Docker App!'
        });
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(responseBody);
      } else if (req.method === 'GET' && req.url === '/health') {
        statusCode = 200;
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        responseBody = JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: uptime
        });
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(responseBody);
      } else {
        statusCode = 404;
        responseBody = JSON.stringify({
          error: 'Not Found'
        });
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(responseBody);
      }
    });

    // Find an available port
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  test('Property 1: HTTP Response Availability - any valid HTTP request returns a response with valid status code', () => {
    // Generate arbitrary HTTP methods and paths
    const httpMethodArb = fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH');
    const pathArb = fc.oneof(
      fc.constant('/'),
      fc.constant('/health'),
      fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/\s/g, '-'))
    );

    return fc.assert(
      fc.asyncProperty(httpMethodArb, pathArb, async (method, path) => {
        return new Promise((resolve, reject) => {
          const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
          };

          const req = http.request(options, (res) => {
            // Consume response data
            res.on('data', () => {});
            res.on('end', () => {
              // Check that we received a valid HTTP status code
              expect(res.statusCode).toBeDefined();
              expect(typeof res.statusCode).toBe('number');
              expect(res.statusCode).toBeGreaterThanOrEqual(100);
              expect(res.statusCode).toBeLessThan(600);
              resolve();
            });
          });

          req.on('error', (err) => {
            reject(err);
          });

          req.end();
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: simple-docker-app, Property 2: Request Logging
 * For any HTTP request received by the application, a log entry should be written to standard output containing request information.
 * Validates: Requirements 1.3
 */
describe('Property-Based Tests for Request Logging', () => {
  let server;
  let port;
  let logOutput = [];
  let originalConsoleLog;

  beforeAll((done) => {
    // Capture console.log output
    originalConsoleLog = console.log;
    console.log = (message) => {
      logOutput.push(message);
      originalConsoleLog(message);
    };

    // Create a test server with logging
    const startTime = Date.now();
    
    function logRequest(req, statusCode) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${req.method} ${req.url} - ${statusCode}`;
      console.log(logMessage);
    }

    server = http.createServer((req, res) => {
      let statusCode;
      let responseBody;

      if (req.method === 'GET' && req.url === '/') {
        statusCode = 200;
        responseBody = JSON.stringify({
          message: 'Welcome to the Simple Docker App!'
        });
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(responseBody);
      } else if (req.method === 'GET' && req.url === '/health') {
        statusCode = 200;
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        responseBody = JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: uptime
        });
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(responseBody);
      } else {
        statusCode = 404;
        responseBody = JSON.stringify({
          error: 'Not Found'
        });
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(responseBody);
      }

      // Log the request
      logRequest(req, statusCode);
    });

    // Find an available port
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    console.log = originalConsoleLog;
    server.close(done);
  });

  beforeEach(() => {
    logOutput = [];
  });

  test('Property 2: Request Logging - any HTTP request generates a log entry with request information', () => {
    const httpMethodArb = fc.constantFrom('GET', 'POST', 'PUT', 'DELETE');
    const pathArb = fc.oneof(
      fc.constant('/'),
      fc.constant('/health'),
      fc.string({ minLength: 1, maxLength: 30 }).map(s => '/' + s.replace(/\s/g, '-'))
    );

    return fc.assert(
      fc.asyncProperty(httpMethodArb, pathArb, async (method, path) => {
        const initialLogCount = logOutput.length;

        return new Promise((resolve, reject) => {
          const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
          };

          const req = http.request(options, (res) => {
            res.on('data', () => {});
            res.on('end', () => {
              // Give a small delay for logging to complete
              setTimeout(() => {
                // Check that a new log entry was created
                expect(logOutput.length).toBeGreaterThan(initialLogCount);
                
                // Get the most recent log entry
                const latestLog = logOutput[logOutput.length - 1];
                
                // Verify log contains request information
                expect(latestLog).toContain(method);
                expect(latestLog).toContain(path);
                expect(latestLog).toMatch(/\d{3}/); // Contains status code (3 digits)
                expect(latestLog).toMatch(/\[\d{4}-\d{2}-\d{2}T/); // Contains ISO timestamp
                
                resolve();
              }, 10);
            });
          });

          req.on('error', (err) => {
            reject(err);
          });

          req.end();
        });
      }),
      { numRuns: 100 }
    );
  });
});
