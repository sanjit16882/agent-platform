const fs = require('fs');
const path = require('path');

/**
 * Configuration loader that supports environment-specific configs
 * Usage: const config = require('./config');
 */
class ConfigLoader {
  constructor() {
    this.environment = process.env.NODE_ENV || 'local';
    this.config = this.loadConfig();
  }

  loadConfig() {
    const configPath = path.join(__dirname, `${this.environment}.json`);
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    const rawConfig = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(rawConfig);
    
    // Replace environment variables in production config
    if (this.environment === 'production') {
      return this.replaceEnvVars(config);
    }
    
    return config;
  }

  replaceEnvVars(obj) {
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        result[key] = this.replaceEnvVars(value);
      } else if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const envVar = value.slice(2, -1);
        result[key] = process.env[envVar] || value;
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  get(path) {
    return path.split('.').reduce((obj, key) => obj && obj[key], this.config);
  }

  getAll() {
    return this.config;
  }
}

module.exports = new ConfigLoader();