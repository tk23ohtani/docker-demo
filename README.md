# Simple Docker App

A simple web application demonstrating Docker containerization with Node.js. This application provides a basic HTTP server with health check functionality and request logging.

## Features

- 🚀 Lightweight HTTP server built with Node.js
- 🏥 Health check endpoint for monitoring
- 📝 Request logging to standard output
- 🐳 Fully containerized with Docker
- 🔒 Runs as non-root user for security
- ⚡ Fast startup time (< 5 seconds)

## Prerequisites

- Docker installed on your machine
- For local development: Node.js 18 or higher

## Building the Docker Image

To build the Docker image, run the following command from the project root directory:

```bash
docker build -t simple-docker-app .
```

This command will:
- Use the `node:18-alpine` base image
- Install all dependencies
- Copy the application source code
- Configure a non-root user for security
- Create an optimized image (< 500MB)

### Verify the Build

Check that the image was created successfully:

```bash
docker images | grep simple-docker-app
```

## Running the Container

### Basic Run Command

To run the container with default settings:

```bash
docker run -p 3000:3000 simple-docker-app
```

### Run in Detached Mode

To run the container in the background:

```bash
docker run -d -p 3000:3000 --name my-docker-app simple-docker-app
```

### Custom Port Mapping

To map the container to a different host port (e.g., 8080):

```bash
docker run -p 8080:3000 simple-docker-app
```

### Run with Environment Variables

To specify a custom port inside the container:

```bash
docker run -p 3000:3000 -e PORT=3000 simple-docker-app
```

## Accessing the Application

Once the container is running, you can access the application endpoints:

### Root Endpoint

Returns a welcome message:

```bash
curl http://localhost:3000/
```

**Response:**
```json
{
  "message": "Welcome to the Simple Docker App!"
}
```

### Health Check Endpoint

Returns the application health status and uptime:

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-02T10:30:45.123Z",
  "uptime": 120
}
```

### Using a Web Browser

You can also access the endpoints directly in your web browser:
- Root: `http://localhost:3000/`
- Health: `http://localhost:3000/health`

## Viewing Container Logs

### View Logs in Real-Time

To view the application logs as they are generated:

```bash
docker logs -f my-docker-app
```

### View Recent Logs

To view the last 50 lines of logs:

```bash
docker logs --tail 50 my-docker-app
```

### View Logs with Timestamps

To view logs with timestamps:

```bash
docker logs -t my-docker-app
```

### Log Format

The application logs all incoming requests in the following format:

```
[2024-12-02T10:30:45.123Z] GET / - 200
[2024-12-02T10:30:50.456Z] GET /health - 200
```

## Container Management

### List Running Containers

```bash
docker ps
```

### Stop the Container

```bash
docker stop my-docker-app
```

The application will shut down gracefully, completing any in-flight requests.

### Remove the Container

```bash
docker rm my-docker-app
```

### Remove the Image

```bash
docker rmi simple-docker-app
```

## Exposed Ports

- **Container Port:** 3000
- **Default Host Port:** 3000 (configurable via `-p` flag)

## Development

### Running Locally (Without Docker)

Install dependencies:

```bash
npm install
```

Start the application:

```bash
npm start
```

### Running Tests

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Architecture

The application consists of:
- **HTTP Server:** Node.js built-in `http` module
- **Request Logger:** Logs all requests to stdout
- **Health Check:** Monitors application status and uptime
- **Graceful Shutdown:** Handles SIGTERM/SIGINT signals

## Troubleshooting

### Port Already in Use

If you see an error about the port being in use:

```bash
# Find and stop the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different host port
docker run -p 8080:3000 simple-docker-app
```

### Container Won't Start

Check the container logs for errors:

```bash
docker logs my-docker-app
```

### Image Build Fails

Ensure you're in the project root directory and have a stable internet connection for downloading dependencies.

## License

MIT
