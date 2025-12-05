# Cypress Integration

## Overview

Integrate DDTF with Cypress for end-to-end testing of AI-powered web applications.

## Installation

```bash
npm install --save-dev @agent-hub/cypress-ddtf-plugin
```

## Configuration

**cypress.config.js:**
```javascript
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // DDTF plugin
      require('@agent-hub/cypress-ddtf-plugin')(on, config);
      return config;
    },
    env: {
      DDTF_API_URL: 'http://localhost:3002',
      DDTF_API_KEY: 'your-api-key'
    }
  }
});
```

## Custom Commands

**cypress/support/commands.js:**
```javascript
// Add DDTF validation command
Cypress.Commands.add('validateAIResponse', (agentId, response, options = {}) => {
  const apiUrl = Cypress.env('DDTF_API_URL');
  const minPassRate = options.minPassRate || 80;
  
  return cy.request({
    method: 'POST',
    url: `${apiUrl}/api/testing/execute`,
    body: {
      agentId: agentId,
      testIds: options.testIds || ['quality_check'],
      customInput: response
    }
  }).then((executeResponse) => {
    const runId = executeResponse.body.runId;
    
    // Poll for results
    return cy.waitForDDTFCompletion(runId).then((results) => {
      expect(results.passRate).to.be.at.least(minPassRate);
      return results;
    });
  });
});

Cypress.Commands.add('waitForDDTFCompletion', (runId, timeout = 60000) => {
  const apiUrl = Cypress.env('DDTF_API_URL');
  const startTime = Date.now();
  
  const checkStatus = () => {
    return cy.request(`${apiUrl}/api/testing/results/${runId}`)
      .then((response) => {
        if (response.body.status === 'completed') {
          return response.body;
        }
        
        if (Date.now() - startTime > timeout) {
          throw new Error('DDTF test timeout');
        }
        
        return cy.wait(2000).then(checkStatus);
      });
  };
  
  return checkStatus();
});
```


## Example Tests

**cypress/e2e/chatbot.cy.js:**
```javascript
describe('AI Chatbot Quality Tests', () => {
  
  beforeEach(() => {
    cy.visit('https://myapp.com/chat');
  });
  
  it('validates chatbot response quality', () => {
    // Interact with chatbot
    cy.get('#chat-input').type('What are your business hours?');
    cy.get('#send-button').click();
    
    // Wait for response
    cy.get('.bot-message', { timeout: 10000 }).should('be.visible');
    
    // Get bot response text
    cy.get('.bot-message').last().invoke('text').then((response) => {
      // Validate with DDTF
      cy.validateAIResponse('chatbot_support', response, {
        minPassRate: 85,
        testIds: ['accuracy_check', 'hallucination_check']
      }).then((results) => {
        // Log results
        cy.log(`AI Quality Score: ${results.passRate}%`);
        
        // Additional assertions
        expect(results.hasHallucination).to.be.false;
        expect(results.averageScore).to.be.at.least(75);
      });
    });
  });
  
  it('validates AI search recommendations', () => {
    // Perform AI-powered search
    cy.get('#ai-search').type('best laptop for developers{enter}');
    
    // Wait for AI recommendations
    cy.get('.ai-recommendations', { timeout: 10000 }).should('exist');
    
    // Extract AI summary
    cy.get('.ai-summary').invoke('text').then((summary) => {
      cy.validateAIResponse('search_assistant', summary, {
        minPassRate: 80,
        testIds: ['relevance_check']
      });
    });
  });
  
  it('validates AI content generation', () => {
    // Trigger AI content generation
    cy.get('#generate-description').click();
    
    // Wait for generated content
    cy.get('#ai-generated-content', { timeout: 15000 })
      .should('not.be.empty');
    
    // Validate generated content
    cy.get('#ai-generated-content').invoke('text').then((content) => {
      cy.validateAIResponse('content_generator', content, {
        minPassRate: 75,
        testIds: ['quality_check', 'coherence_check']
      }).then((results) => {
        // Ensure no hallucinations in generated content
        expect(results.hasHallucination).to.be.false;
        
        // Ensure content meets quality standards
        expect(results.qualityMetrics.coherence).to.be.at.least(70);
      });
    });
  });
});
```

## Parallel Testing

**cypress.config.js:**
```javascript
module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      require('@agent-hub/cypress-ddtf-plugin')(on, config);
      
      // Run DDTF tests in parallel
      on('task', {
        async validateAIInBackground({ agentId, response, testIds }) {
          const axios = require('axios');
          const apiUrl = config.env.DDTF_API_URL;
          
          // Fire and forget - don't wait for completion
          axios.post(`${apiUrl}/api/testing/execute`, {
            agentId,
            testIds,
            customInput: response
          });
          
          return null;
        }
      });
      
      return config;
    }
  }
});
```

## CI/CD Integration

**GitHub Actions:**
```yaml
name: Cypress + DDTF Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start DDTF service
        run: |
          npm install -g @agent-hub/testing-cli
          agent-test serve &
      
      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          start: npm start
          wait-on: 'http://localhost:3000'
        env:
          DDTF_API_URL: http://localhost:3002
          DDTF_API_KEY: ${{ secrets.DDTF_API_KEY }}
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: cypress-results
          path: cypress/results
```

## Best Practices

1. **Custom Commands**: Create reusable Cypress commands for DDTF validation
2. **Async Validation**: Don't block UI tests waiting for DDTF results
3. **Retry Logic**: Implement retry for transient DDTF API failures
4. **Parallel Execution**: Run DDTF validations in parallel with UI tests
5. **Quality Thresholds**: Set appropriate pass rates for different AI features

## Reporting

Combine Cypress and DDTF results in unified reports:

```javascript
// cypress/plugins/index.js
const { merge } = require('mochawesome-merge');

module.exports = (on, config) => {
  on('after:run', async (results) => {
    // Merge Cypress and DDTF results
    const cypressReport = results;
    const ddtfReport = await fetchDDTFResults();
    
    const combinedReport = {
      ...cypressReport,
      aiQuality: ddtfReport
    };
    
    // Generate unified report
    await generateReport(combinedReport);
  });
};
```
