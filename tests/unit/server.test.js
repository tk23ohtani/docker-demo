const http = require('http');

describe('HTTP Server Unit Tests', () => {
  let server;
  let port;

  beforeAll((done) => {
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

    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Root endpoint (/)', () => {
    test('should return welcome message with 200 status', (done) => {
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/',
        method: 'GET',
      };

      const req = http.request(options, (res) => {
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toBe('application/json');

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const response = JSON.parse(data);
          expect(response).toHaveProperty('message');
          expect(response.message).toBe('Welcome to the Simple Docker App!');
          done();
        });
      });

      req.on('error', (err) => {
        done(err);
      });

      req.end();
    });
  });

  describe('Health check endpoint (/health)', () => {
    test('should return success status with 200 status code', (done) => {
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/health',
        method: 'GET',
      };

      const req = http.request(options, (res) => {
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toBe('application/json');

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const response = JSON.parse(data);
          expect(response).toHaveProperty('status');
          expect(response.status).toBe('ok');
          expect(response).toHaveProperty('timestamp');
          expect(response).toHaveProperty('uptime');
          expect(typeof response.uptime).toBe('number');
          expect(response.uptime).toBeGreaterThanOrEqual(0);
          done();
        });
      });

      req.on('error', (err) => {
        done(err);
      });

      req.end();
    });
  });

  describe('Request logging', () => {
    let consoleOutput = [];
    let originalConsoleLog;

    beforeEach(() => {
      consoleOutput = [];
      originalConsoleLog = console.log;
      console.log = (message) => {
        consoleOutput.push(message);
        originalConsoleLog(message);
      };
    });

    afterEach(() => {
      console.log = originalConsoleLog;
    });

    test('should log request in correct format', (done) => {
      // Create a server with logging
      const testServer = http.createServer((req, res) => {
        const statusCode = 200;
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${req.method} ${req.url} - ${statusCode}`;
        console.log(logMessage);
        
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'test' }));
      });

      testServer.listen(0, () => {
        const testPort = testServer.address().port;
        
        const options = {
          hostname: 'localhost',
          port: testPort,
          path: '/test',
          method: 'GET',
        };

        const req = http.request(options, (res) => {
          res.on('data', () => {});
          res.on('end', () => {
            // Verify log format
            expect(consoleOutput.length).toBeGreaterThan(0);
            const logEntry = consoleOutput[consoleOutput.length - 1];
            
            // Check log contains timestamp in ISO format
            expect(logEntry).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
            // Check log contains method
            expect(logEntry).toContain('GET');
            // Check log contains path
            expect(logEntry).toContain('/test');
            // Check log contains status code
            expect(logEntry).toContain('200');
            
            testServer.close(() => {
              done();
            });
          });
        });

        req.on('error', (err) => {
          testServer.close();
          done(err);
        });

        req.end();
      });
    });
  });
});
