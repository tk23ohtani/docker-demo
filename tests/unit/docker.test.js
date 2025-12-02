const { execSync } = require('child_process');

describe('Docker Integration Tests', () => {
  const imageName = 'simple-docker-app:test';
  const containerName = 'simple-docker-app-test';

  // Clean up any existing test containers/images before tests
  beforeAll(() => {
    try {
      execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' });
    } catch (error) {
      // Container doesn't exist, ignore
    }
  });

  // Clean up after tests
  afterAll(() => {
    try {
      execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' });
    } catch (error) {
      // Container doesn't exist, ignore
    }
    try {
      execSync(`docker rmi -f ${imageName}`, { stdio: 'ignore' });
    } catch (error) {
      // Image doesn't exist, ignore
    }
  });

  test('Docker image builds successfully', () => {
    expect(() => {
      execSync(`docker build -t ${imageName} .`, {
        stdio: 'pipe',
        timeout: 120000 // 2 minute timeout
      });
    }).not.toThrow();
  });

  test('Docker image size is under 500MB', () => {
    // Build the image first
    execSync(`docker build -t ${imageName} .`, { stdio: 'pipe' });

    // Get image size
    const output = execSync(`docker images ${imageName} --format "{{.Size}}"`, {
      encoding: 'utf-8'
    }).trim();

    // Parse size (could be in MB or GB)
    const sizeMatch = output.match(/^([\d.]+)(MB|GB)$/);
    expect(sizeMatch).not.toBeNull();

    const size = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2];

    if (unit === 'GB') {
      // Convert GB to MB
      expect(size * 1024).toBeLessThan(500);
    } else {
      expect(size).toBeLessThan(500);
    }
  });

  test('Container exposes correct port', () => {
    // Build the image first
    execSync(`docker build -t ${imageName} .`, { stdio: 'pipe' });

    // Inspect the image to check exposed ports
    const output = execSync(
      `docker inspect ${imageName} --format "{{json .Config.ExposedPorts}}"`,
      { encoding: 'utf-8' }
    ).trim();

    const exposedPorts = JSON.parse(output);
    expect(exposedPorts).toHaveProperty('3000/tcp');
  });
});
