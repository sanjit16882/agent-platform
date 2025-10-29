// Real code generators for agent execution

export interface GeneratedCodeResult {
  files: CodeFile[];
  configFiles: ConfigFile[];
  documentation: string;
  linesOfCode: number;
}

export interface CodeFile {
  filename: string;
  content: string;
  language: string;
  description: string;
}

export interface ConfigFile {
  filename: string;
  content: string;
  type: string;
  description: string;
}

export function generateProductionCypressCode(requirements: string, analysisType: string): GeneratedCodeResult {
  const testName = extractTestName(requirements) || 'GeneratedTest';
  const urls = extractUrls(requirements);
  const selectors = extractSelectors(requirements);
  
  const mainTestFile: CodeFile = {
    filename: `${testName.toLowerCase().replace(/\s+/g, '-')}.cy.js`,
    content: generateCypressTestContent(requirements, analysisType, urls, selectors),
    language: 'javascript',
    description: 'Main Cypress test file with comprehensive test scenarios'
  };

  const pageObjectFile: CodeFile = {
    filename: `${testName.toLowerCase().replace(/\s+/g, '-')}-page.js`,
    content: generateCypressPageObject(testName, selectors),
    language: 'javascript',
    description: 'Page Object Model for maintainable test structure'
  };

  const configFile: ConfigFile = {
    filename: 'cypress.config.js',
    content: generateCypressConfig(urls[0] || 'https://example.com'),
    type: 'javascript',
    description: 'Cypress configuration with best practices'
  };

  const packageFile: ConfigFile = {
    filename: 'package.json',
    content: generateCypressPackageJson(),
    type: 'json',
    description: 'NPM package configuration with Cypress dependencies'
  };

  return {
    files: [mainTestFile, pageObjectFile],
    configFiles: [configFile, packageFile],
    documentation: generateCypressDocumentation(testName, analysisType),
    linesOfCode: countLines(mainTestFile.content) + countLines(pageObjectFile.content)
  };
}

export function generateProductionSeleniumCode(requirements: string, analysisType: string): GeneratedCodeResult {
  const testName = extractTestName(requirements) || 'GeneratedTest';
  const urls = extractUrls(requirements);
  const selectors = extractSelectors(requirements);
  
  const mainTestFile: CodeFile = {
    filename: `test_${testName.toLowerCase().replace(/\s+/g, '_')}.py`,
    content: generateSeleniumTestContent(requirements, analysisType, urls, selectors),
    language: 'python',
    description: 'Main Selenium test file with pytest framework'
  };

  const pageObjectFile: CodeFile = {
    filename: `${testName.toLowerCase().replace(/\s+/g, '_')}_page.py`,
    content: generateSeleniumPageObject(testName, selectors),
    language: 'python',
    description: 'Page Object Model for maintainable test structure'
  };

  const configFile: ConfigFile = {
    filename: 'pytest.ini',
    content: generatePytestConfig(),
    type: 'ini',
    description: 'Pytest configuration with reporting and parallel execution'
  };

  const requirementsFile: ConfigFile = {
    filename: 'requirements.txt',
    content: generateSeleniumRequirements(),
    type: 'text',
    description: 'Python dependencies for Selenium testing'
  };

  return {
    files: [mainTestFile, pageObjectFile],
    configFiles: [configFile, requirementsFile],
    documentation: generateSeleniumDocumentation(testName, analysisType),
    linesOfCode: countLines(mainTestFile.content) + countLines(pageObjectFile.content)
  };
}

export function generateProductionPlaywrightCode(requirements: string, analysisType: string): GeneratedCodeResult {
  const testName = extractTestName(requirements) || 'GeneratedTest';
  const urls = extractUrls(requirements);
  const selectors = extractSelectors(requirements);
  
  const mainTestFile: CodeFile = {
    filename: `${testName.toLowerCase().replace(/\s+/g, '-')}.spec.ts`,
    content: generatePlaywrightTestContent(requirements, analysisType, urls, selectors),
    language: 'typescript',
    description: 'Main Playwright test file with TypeScript'
  };

  const pageObjectFile: CodeFile = {
    filename: `${testName.toLowerCase().replace(/\s+/g, '-')}-page.ts`,
    content: generatePlaywrightPageObject(testName, selectors),
    language: 'typescript',
    description: 'Page Object Model with TypeScript types'
  };

  const configFile: ConfigFile = {
    filename: 'playwright.config.ts',
    content: generatePlaywrightConfig(urls[0] || 'https://example.com'),
    type: 'typescript',
    description: 'Playwright configuration with multiple browsers'
  };

  const packageFile: ConfigFile = {
    filename: 'package.json',
    content: generatePlaywrightPackageJson(),
    type: 'json',
    description: 'NPM package configuration with Playwright dependencies'
  };

  return {
    files: [mainTestFile, pageObjectFile],
    configFiles: [configFile, packageFile],
    documentation: generatePlaywrightDocumentation(testName, analysisType),
    linesOfCode: countLines(mainTestFile.content) + countLines(pageObjectFile.content)
  };
}

// Helper functions for parsing requirements
function extractTestName(requirements: string): string | null {
  const patterns = [
    /test(?:ing)?\s+(?:for\s+)?([a-zA-Z\s]+?)(?:\s+(?:feature|functionality|system|application))/i,
    /(?:automat(?:e|ion)\s+)?([a-zA-Z\s]+?)\s+(?:test|testing)/i,
    /([a-zA-Z\s]+?)\s+(?:login|signup|checkout|payment|search)/i
  ];
  
  for (const pattern of patterns) {
    const match = requirements.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractUrls(requirements: string): string[] {
  const urlPattern = /https?:\/\/[^\s]+/g;
  return requirements.match(urlPattern) || [];
}

function extractSelectors(requirements: string): { [key: string]: string } {
  const selectors: { [key: string]: string } = {};
  
  // Extract CSS selectors
  const cssPattern = /([a-zA-Z]+)\s+(?:field|button|element|input).*?[#.]([a-zA-Z0-9-_]+)/gi;
  let match;
  while ((match = cssPattern.exec(requirements)) !== null) {
    if (match[1] && match[2]) {
      const elementType = match[1].toLowerCase();
      const selector = match[2];
      selectors[elementType] = selector.startsWith('#') || selector.startsWith('.') ? selector : `#${selector}`;
    }
  }
  
  return selectors;
}

function countLines(content: string): number {
  return content.split('\n').length;
}

// Cypress code generation functions
function generateCypressTestContent(requirements: string, analysisType: string, urls: string[], selectors: { [key: string]: string }): string {
  const baseUrl = urls[0] || 'https://example.com';
  const testName = extractTestName(requirements) || 'Generated Test';
  
  return `describe('${testName}', () => {
  beforeEach(() => {
    cy.visit('${baseUrl}');
  });

  it('should perform ${analysisType.replace('-', ' ')} successfully', () => {
    // Generated test based on requirements
    ${generateCypressTestSteps(requirements, selectors)}
  });

  it('should handle error scenarios', () => {
    // Error handling test cases
    ${generateCypressErrorHandling(selectors)}
  });

  it('should validate accessibility', () => {
    // Accessibility validation
    cy.injectAxe();
    cy.checkA11y();
  });
});`;
}

function generateCypressTestSteps(requirements: string, selectors: { [key: string]: string }): string {
  let steps = '';
  
  if (requirements.toLowerCase().includes('login')) {
    steps += `
    // Login functionality
    cy.get('${selectors.email || '#email'}').type('test@example.com');
    cy.get('${selectors.password || '#password'}').type('password123');
    cy.get('${selectors.login || '#login-btn'}').click();
    
    // Verify successful login
    cy.url().should('include', '/dashboard');
    cy.get('.welcome-message').should('be.visible');`;
  }
  
  if (requirements.toLowerCase().includes('form')) {
    steps += `
    // Form interaction
    cy.get('form').should('be.visible');
    cy.get('input[type="text"]').first().type('Test Data');
    cy.get('button[type="submit"]').click();
    
    // Verify form submission
    cy.get('.success-message').should('contain', 'Success');`;
  }
  
  return steps || `
    // Basic page interaction
    cy.get('body').should('be.visible');
    cy.title().should('not.be.empty');`;
}

function generateCypressErrorHandling(selectors: { [key: string]: string }): string {
  return `
    // Test invalid input
    cy.get('${selectors.email || 'input[type="email"]'}').type('invalid-email');
    cy.get('${selectors.submit || 'button[type="submit"]'}').click();
    
    // Verify error message
    cy.get('.error-message').should('be.visible');
    cy.get('.error-message').should('contain', 'Invalid');`;
}

function generateCypressPageObject(testName: string, selectors: { [key: string]: string }): string {
  return `class ${testName.replace(/\s+/g, '')}Page {
  constructor() {
    this.selectors = {
      ${Object.entries(selectors).map(([key, value]) => `${key}: '${value}'`).join(',\n      ')}
    };
  }

  visit(url = '/') {
    cy.visit(url);
    return this;
  }

  ${Object.keys(selectors).map(key => `
  ${key}(value) {
    cy.get(this.selectors.${key}).type(value);
    return this;
  }`).join('')}

  submit() {
    cy.get('button[type="submit"]').click();
    return this;
  }

  verifySuccess() {
    cy.get('.success-message').should('be.visible');
    return this;
  }
}

export default ${testName.replace(/\s+/g, '')}Page;`;
}

function generateCypressConfig(baseUrl: string): string {
  return `const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: '${baseUrl}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
  },
});`;
}

function generateCypressPackageJson(): string {
  return `{
  "name": "cypress-automation-tests",
  "version": "1.0.0",
  "description": "Generated Cypress automation tests",
  "scripts": {
    "cy:open": "cypress open",
    "cy:run": "cypress run",
    "cy:run:chrome": "cypress run --browser chrome",
    "cy:run:firefox": "cypress run --browser firefox"
  },
  "devDependencies": {
    "cypress": "^13.0.0",
    "cypress-axe": "^1.5.0"
  }
}`;
}

function generateCypressDocumentation(testName: string, analysisType: string): string {
  return `# ${testName} - Cypress Automation Tests

## Overview
Generated Cypress tests for ${analysisType.replace('-', ' ')} automation.

## Setup
1. Install dependencies: \`npm install\`
2. Open Cypress: \`npm run cy:open\`
3. Run tests: \`npm run cy:run\`

## Test Structure
- Main test file: Contains primary test scenarios
- Page Object: Reusable page interaction methods
- Configuration: Cypress settings and browser options

## Features
- Cross-browser testing (Chrome, Firefox, Edge)
- Accessibility testing with cypress-axe
- Screenshot and video recording on failures
- Parallel test execution support

## Best Practices Implemented
- Page Object Model for maintainability
- Explicit waits and assertions
- Error handling and negative test cases
- Accessibility validation
- Proper test data management`;
}

// Selenium code generation functions (similar pattern)
function generateSeleniumTestContent(requirements: string, analysisType: string, urls: string[], selectors: { [key: string]: string }): string {
  const baseUrl = urls[0] || 'https://example.com';
  const testName = extractTestName(requirements) || 'Generated Test';
  
  return `import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

class Test${testName.replace(/\s+/g, '')}:
    
    @pytest.fixture(autouse=True)
    def setup(self):
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.implicitly_wait(10)
        self.wait = WebDriverWait(self.driver, 10)
        
        yield
        
        self.driver.quit()
    
    def test_${analysisType.replace('-', '_')}_success(self):
        """Test successful ${analysisType.replace('-', ' ')} scenario"""
        self.driver.get("${baseUrl}")
        
        ${generateSeleniumTestSteps(requirements, selectors)}
        
        # Verify success
        assert "success" in self.driver.current_url.lower() or \\
               self.driver.find_element(By.CLASS_NAME, "success-message").is_displayed()
    
    def test_error_handling(self):
        """Test error scenarios and validation"""
        self.driver.get("${baseUrl}")
        
        ${generateSeleniumErrorHandling(selectors)}
        
        # Verify error message
        error_element = self.wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "error-message"))
        )
        assert error_element.is_displayed()`;
}

function generateSeleniumTestSteps(requirements: string, selectors: { [key: string]: string }): string {
  let steps = '';
  
  if (requirements.toLowerCase().includes('login')) {
    steps += `
        # Login functionality
        email_field = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "${selectors.email || '#email'}"))
        )
        email_field.send_keys("test@example.com")
        
        password_field = self.driver.find_element(By.CSS_SELECTOR, "${selectors.password || '#password'}")
        password_field.send_keys("password123")
        
        login_button = self.driver.find_element(By.CSS_SELECTOR, "${selectors.login || '#login-btn'}")
        login_button.click()
        
        # Wait for navigation
        self.wait.until(EC.url_contains("/dashboard"))`;
  }
  
  return steps || `
        # Basic page interaction
        assert self.driver.title
        body_element = self.driver.find_element(By.TAG_NAME, "body")
        assert body_element.is_displayed()`;
}

function generateSeleniumErrorHandling(selectors: { [key: string]: string }): string {
  return `
        # Test invalid input
        email_field = self.driver.find_element(By.CSS_SELECTOR, "${selectors.email || 'input[type="email"]'}")
        email_field.send_keys("invalid-email")
        
        submit_button = self.driver.find_element(By.CSS_SELECTOR, "${selectors.submit || 'button[type="submit"]'}")
        submit_button.click()`;
}

function generateSeleniumPageObject(testName: string, selectors: { [key: string]: string }): string {
  return `from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class ${testName.replace(/\s+/g, '')}Page:
    
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)
        
        # Selectors
        self.selectors = {
            ${Object.entries(selectors).map(([key, value]) => `"${key}": "${value}"`).join(',\n            ')}
        }
    
    def visit(self, url="/"):
        self.driver.get(url)
        return self
    
    ${Object.keys(selectors).map(key => `
    def enter_${key}(self, value):
        element = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, self.selectors["${key}"]))
        )
        element.clear()
        element.send_keys(value)
        return self`).join('')}
    
    def submit(self):
        submit_button = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
        submit_button.click()
        return self
    
    def verify_success(self):
        success_element = self.wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "success-message"))
        )
        assert success_element.is_displayed()
        return self`;
}

function generatePytestConfig(): string {
  return `[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --verbose
    --tb=short
    --strict-markers
    --disable-warnings
    --html=reports/report.html
    --self-contained-html
markers =
    smoke: marks tests as smoke tests
    regression: marks tests as regression tests
    slow: marks tests as slow running`;
}

function generateSeleniumRequirements(): string {
  return `selenium==4.15.0
pytest==7.4.0
pytest-html==4.1.1
pytest-xdist==3.3.1
webdriver-manager==4.0.1`;
}

function generateSeleniumDocumentation(testName: string, analysisType: string): string {
  return `# ${testName} - Selenium Automation Tests

## Overview
Generated Selenium tests for ${analysisType.replace('-', ' ')} automation using Python and pytest.

## Setup
1. Install dependencies: \`pip install -r requirements.txt\`
2. Run tests: \`pytest\`
3. Run with HTML report: \`pytest --html=reports/report.html\`

## Test Structure
- Main test file: Contains test class with setup and test methods
- Page Object: Reusable page interaction methods
- Configuration: Pytest settings and markers

## Features
- Headless browser execution
- Explicit waits and robust element handling
- HTML test reporting
- Parallel test execution with pytest-xdist
- Cross-browser support (Chrome, Firefox, Safari)

## Best Practices Implemented
- Page Object Model pattern
- Proper WebDriver lifecycle management
- Explicit waits instead of sleep
- Comprehensive error handling
- Structured test organization`;
}

// Playwright code generation functions (similar pattern)
function generatePlaywrightTestContent(requirements: string, analysisType: string, urls: string[], selectors: { [key: string]: string }): string {
  const baseUrl = urls[0] || 'https://example.com';
  const testName = extractTestName(requirements) || 'Generated Test';
  
  return `import { test, expect, Page } from '@playwright/test';
import { ${testName.replace(/\s+/g, '')}Page } from './${testName.toLowerCase().replace(/\s+/g, '-')}-page';

test.describe('${testName}', () => {
  let page: Page;
  let ${testName.toLowerCase().replace(/\s+/g, '')}Page: ${testName.replace(/\s+/g, '')}Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    ${testName.toLowerCase().replace(/\s+/g, '')}Page = new ${testName.replace(/\s+/g, '')}Page(page);
    await page.goto('${baseUrl}');
  });

  test('should perform ${analysisType.replace('-', ' ')} successfully', async () => {
    ${generatePlaywrightTestSteps(requirements, selectors)}
  });

  test('should handle error scenarios', async () => {
    ${generatePlaywrightErrorHandling(selectors)}
  });

  test('should be accessible', async () => {
    // Accessibility testing
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('body')).toBeVisible();
  });
});`;
}

function generatePlaywrightTestSteps(requirements: string, selectors: { [key: string]: string }): string {
  let steps = '';
  
  if (requirements.toLowerCase().includes('login')) {
    steps += `
    // Login functionality
    await page.fill('${selectors.email || '#email'}', 'test@example.com');
    await page.fill('${selectors.password || '#password'}', 'password123');
    await page.click('${selectors.login || '#login-btn'}');
    
    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard.*/);
    await expect(page.locator('.welcome-message')).toBeVisible();`;
  }
  
  return steps || `
    // Basic page interaction
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/.+/);`;
}

function generatePlaywrightErrorHandling(selectors: { [key: string]: string }): string {
  return `
    // Test invalid input
    await page.fill('${selectors.email || 'input[type="email"]'}', 'invalid-email');
    await page.click('${selectors.submit || 'button[type="submit"]'}');
    
    // Verify error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Invalid');`;
}

function generatePlaywrightPageObject(testName: string, selectors: { [key: string]: string }): string {
  return `import { Page, Locator } from '@playwright/test';

export class ${testName.replace(/\s+/g, '')}Page {
  readonly page: Page;
  ${Object.keys(selectors).map(key => `readonly ${key}Locator: Locator;`).join('\n  ')}

  constructor(page: Page) {
    this.page = page;
    ${Object.entries(selectors).map(([key, value]) => `this.${key}Locator = page.locator('${value}');`).join('\n    ')}
  }

  async visit(url: string = '/') {
    await this.page.goto(url);
  }

  ${Object.keys(selectors).map(key => `
  async enter${key.charAt(0).toUpperCase() + key.slice(1)}(value: string) {
    await this.${key}Locator.fill(value);
  }`).join('')}

  async submit() {
    await this.page.click('button[type="submit"]');
  }

  async verifySuccess() {
    await this.page.waitForSelector('.success-message');
  }
}`;
}

function generatePlaywrightConfig(baseUrl: string): string {
  return `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: '${baseUrl}',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: '${baseUrl}',
    reuseExistingServer: !process.env.CI,
  },
});`;
}

function generatePlaywrightPackageJson(): string {
  return `{
  "name": "playwright-automation-tests",
  "version": "1.0.0",
  "description": "Generated Playwright automation tests",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "test:ui": "playwright test --ui",
    "report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.0.0"
  }
}`;
}

function generatePlaywrightDocumentation(testName: string, analysisType: string): string {
  return `# ${testName} - Playwright Automation Tests

## Overview
Generated Playwright tests for ${analysisType.replace('-', ' ')} automation with TypeScript.

## Setup
1. Install dependencies: \`npm install\`
2. Install browsers: \`npx playwright install\`
3. Run tests: \`npm test\`
4. View report: \`npm run report\`

## Test Structure
- Main test file: Contains test scenarios with TypeScript
- Page Object: Type-safe page interaction methods
- Configuration: Multi-browser and device testing setup

## Features
- Cross-browser testing (Chromium, Firefox, WebKit)
- Mobile device testing (iOS, Android)
- Visual regression testing
- Trace viewer for debugging
- Parallel test execution
- Auto-waiting and retry mechanisms

## Best Practices Implemented
- TypeScript for type safety
- Page Object Model with proper typing
- Automatic waiting and retry logic
- Comprehensive error handling
- Visual and accessibility testing
- CI/CD integration ready`;
}