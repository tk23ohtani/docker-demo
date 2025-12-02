const http = require('http');

const PORT = process.env.PORT || 3000;
const startTime = Date.now();

// Logger function
function log(message) {
  console.log(message);
}

// Request logger middleware
function logRequest(req, statusCode) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${req.method} ${req.url} - ${statusCode}`;
  log(logMessage);
}

// Create HTTP server
const server = http.createServer((req, res) => {
  let statusCode;
  let responseBody;

  // Route handling
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

// Graceful shutdown handler
function gracefulShutdown(signal) {
  log(`Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    log('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    log('Forcing shutdown');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
server.listen(PORT, () => {
  log(`Server is running on port ${PORT}`);
});

// Export for testing
module.exports = { server, log, logRequest };
