/**
 * Mock Definition Loader
 * 
 * Loads mock definitions from JSON files and registers them with MockRegistry
 */

const fs = require('fs').promises;
const path = require('path');
const { config } = require('../config/testing');

class MockLoader {
  constructor(mockRegistry) {
    this.mockRegistry = mockRegistry;
    this.mocksDirectory = config.mock.mocksDirectory;
    this.loadedFiles = new Set();
    this.watchHandles = new Map();
  }

  /**
   * Load all mock definitions from directory
   * @returns {Promise<number>} - Number of mocks loaded
   */
  async loadAll() {
    try {
      console.log(`Loading mocks from: ${this.mocksDirectory}`);

      // Check if directory exists
      try {
        await fs.access(this.mocksDirectory);
      } catch (error) {
        console.warn(`Mocks directory not found: ${this.mocksDirectory}`);
        console.log('Creating mocks directory...');
        await fs.mkdir(this.mocksDirectory, { recursive: true });
        return 0;
      }

      // Read all files in directory
      const files = await fs.readdir(this.mocksDirectory);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      let totalLoaded = 0;

      for (const file of jsonFiles) {
        const count = await this.loadFile(file);
        totalLoaded += count;
      }

      console.log(`✓ Loaded ${totalLoaded} mock(s) from ${jsonFiles.length} file(s)`);

      // Set up hot-reloading if enabled
      if (config.mock.hotReload) {
        this.setupHotReload();
      }

      return totalLoaded;

    } catch (error) {
      console.error(`Failed to load mocks: ${error.message}`);
      return 0;
    }
  }

  /**
   * Load mock definitions from a specific file
   * @param {string} filename - Name of the file to load
   * @returns {Promise<number>} - Number of mocks loaded
   */
  async loadFile(filename) {
    const filepath = path.join(this.mocksDirectory, filename);

    try {
      // Read file content
      const content = await fs.readFile(filepath, 'utf8');

      // Parse JSON
      const data = JSON.parse(content);

      // Validate structure
      if (!data.mocks || !Array.isArray(data.mocks)) {
        throw new Error('Invalid mock file structure: missing "mocks" array');
      }

      // Register each mock
      let loaded = 0;
      for (const mock of data.mocks) {
        if (this.mockRegistry.register(mock)) {
          loaded++;
        }
      }

      this.loadedFiles.add(filename);
      console.log(`✓ Loaded ${loaded} mock(s) from ${filename}`);

      return loaded;

    } catch (error) {
      console.error(`Failed to load ${filename}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Reload a specific file
   * @param {string} filename - Name of the file to reload
   * @returns {Promise<number>} - Number of mocks loaded
   */
  async reloadFile(filename) {
    console.log(`Reloading mocks from: ${filename}`);

    // Clear existing mocks from this file
    // (In a real implementation, we'd track which mocks came from which file)
    this.mockRegistry.clear();

    // Reload all files
    return await this.loadAll();
  }

  /**
   * Set up hot-reloading of mock files
   */
  setupHotReload() {
    console.log('Setting up hot-reload for mock files...');

    const fsWatch = require('fs');

    try {
      const watcher = fsWatch.watch(
        this.mocksDirectory,
        { persistent: false },
        async (eventType, filename) => {
          if (filename && filename.endsWith('.json')) {
            console.log(`Mock file changed: ${filename} (${eventType})`);

            // Debounce reload
            if (this.reloadTimeout) {
              clearTimeout(this.reloadTimeout);
            }

            this.reloadTimeout = setTimeout(async () => {
              await this.reloadFile(filename);
            }, 1000);
          }
        }
      );

      this.watchHandles.set(this.mocksDirectory, watcher);
      console.log('✓ Hot-reload enabled for mock files');

    } catch (error) {
      console.error(`Failed to set up hot-reload: ${error.message}`);
    }
  }

  /**
   * Stop watching for file changes
   */
  stopHotReload() {
    for (const [dir, watcher] of this.watchHandles.entries()) {
      watcher.close();
      console.log(`✓ Stopped watching: ${dir}`);
    }
    this.watchHandles.clear();
  }

  /**
   * Validate mock definition schema
   * @param {object} mock - Mock definition to validate
   * @returns {object} - Validation result
   */
  validateSchema(mock) {
    const errors = [];

    // Required fields
    const requiredFields = ['id', 'service', 'endpoint', 'method', 'response'];
    for (const field of requiredFields) {
      if (!mock[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Response validation
    if (mock.response) {
      if (typeof mock.response.status !== 'number') {
        errors.push('response.status must be a number');
      }

      if (mock.response.status < 100 || mock.response.status > 599) {
        errors.push('response.status must be between 100 and 599');
      }
    }

    // Method validation
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (mock.method && !validMethods.includes(mock.method)) {
      errors.push(`Invalid method: ${mock.method}. Must be one of: ${validMethods.join(', ')}`);
    }

    // Latency validation
    if (mock.response && mock.response.latency_ms !== undefined) {
      if (typeof mock.response.latency_ms !== 'number' || mock.response.latency_ms < 0) {
        errors.push('response.latency_ms must be a non-negative number');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get loaded files list
   * @returns {Array<string>} - List of loaded files
   */
  getLoadedFiles() {
    return Array.from(this.loadedFiles);
  }
}

module.exports = MockLoader;
