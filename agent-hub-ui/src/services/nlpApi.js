// NLP API Service - Use production API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api/v1';

// Debug: Log the API URL
console.log('NLP API Base URL:', API_BASE_URL);
console.log('Environment variable:', process.env.REACT_APP_API_BASE_URL);

class NLPApiService {
  async testConnection() {
    try {
      const url = `${API_BASE_URL}/nlp/test`;
      console.log('Testing connection to:', url);
      const response = await fetch(url);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('API Test failed:', error);
      console.error('Full error:', error);
      throw error;
    }
  }

  async getExamples() {
    try {
      const response = await fetch(`${API_BASE_URL}/nlp/examples`);
      return await response.json();
    } catch (error) {
      console.error('Get examples failed:', error);
      throw error;
    }
  }

  async getCapabilities() {
    try {
      const response = await fetch(`${API_BASE_URL}/nlp/capabilities`);
      return await response.json();
    } catch (error) {
      console.error('Get capabilities failed:', error);
      throw error;
    }
  }

  async processDescription(description, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/nlp/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Process description failed:', error);
      throw error;
    }
  }

  async parseIntent(description) {
    try {
      const response = await fetch(`${API_BASE_URL}/nlp/parse-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Parse intent failed:', error);
      throw error;
    }
  }

  async getTemplates(category = null) {
    try {
      const url = category ? `${API_BASE_URL}/nlp/templates?category=${category}` : `${API_BASE_URL}/nlp/templates`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Get templates failed:', error);
      throw error;
    }
  }

  async generateFromTemplate(templateId, customizations = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/nlp/generate-from-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId, customizations })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Generate from template failed:', error);
      throw error;
    }
  }

  async editConfig(config, editRequest) {
    try {
      const response = await fetch(`${API_BASE_URL}/nlp/edit-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config, editRequest })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Edit config failed:', error);
      throw error;
    }
  }

  async validateConfigDetailed(config) {
    try {
      const response = await fetch(`${API_BASE_URL}/nlp/validate-detailed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Detailed validation failed:', error);
      throw error;
    }
  }

  async refineConfigAdvanced(originalConfig, refinementDescription, preserveExisting = true) {
    try {
      const response = await fetch(`${API_BASE_URL}/nlp/refine-config-advanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalConfig, refinementDescription, preserveExisting })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Advanced refinement failed:', error);
      throw error;
    }
  }
}

export const nlpApi = new NLPApiService();
export default nlpApi;