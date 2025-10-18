// Template manager for handling different code generation templates

import { GenerationContext, OutputFormat, Feature } from './contextAnalyzer';
import { ParsedRequirements } from './requirementParser';

export interface Template {
  id: string;
  name: string;
  category: string;
  baseTemplate: string;
  dynamicSections: DynamicSection[];
  requiredContext: string[];
}

export interface DynamicSection {
  placeholder: string;
  generator: (context: any) => string;
  conditions?: Condition[];
}

export interface Condition {
  field: string;
  operator: 'equals' | 'includes' | 'exists';
  value: any;
}

export class TemplateManager {
  private static templates: Map<string, Template> = new Map();

  /**
   * Initialize template manager with default templates
   */
  static initialize(): void {
    this.registerDefaultTemplates();
  }

  /**
   * Register a new template
   */
  static registerTemplate(template: Template): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get template by ID
   */
  static getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  /**
   * Get template for specific context
   */
  static getTemplateForContext(context: GenerationContext): Template | undefined {
    const templateId = this.getTemplateId(context);
    return this.getTemplate(templateId);
  }

  /**
   * Process template with dynamic content
   */
  static processTemplate(
    template: Template,
    requirements: ParsedRequirements,
    context: GenerationContext
  ): string {
    let processedTemplate = template.baseTemplate;

    // Process dynamic sections
    template.dynamicSections.forEach(section => {
      if (this.shouldIncludeSection(section, context)) {
        const generatedContent = section.generator({
          requirements,
          context,
          selectors: requirements.selectors,
          workflows: requirements.workflows,
          technologies: requirements.technologies
        });
        
        processedTemplate = processedTemplate.replace(
          section.placeholder,
          generatedContent
        );
      } else {
        // Remove placeholder if section shouldn't be included
        processedTemplate = processedTemplate.replace(section.placeholder, '');
      }
    });

    return processedTemplate;
  }

  /**
   * Register default templates
   */
  private static registerDefaultTemplates(): void {
    // Selenium Python template
    this.registerTemplate({
      id: 'selenium-python-basic',
      name: 'Selenium Python Basic',
      category: 'qe-testing',
      baseTemplate: this.getSeleniumPythonTemplate(),
      dynamicSections: [
        {
          placeholder: '{{IMPORTS}}',
          generator: (ctx) => this.generateSeleniumImports(ctx)
        },
        {
          placeholder: '{{PAGE_OBJECTS}}',
          generator: (ctx) => this.generatePageObjects(ctx),
          conditions: [{ field: 'features', operator: 'includes', value: Feature.PAGE_OBJECT_MODEL }]
        },
        {
          placeholder: '{{TEST_METHODS}}',
          generator: (ctx) => this.generateTestMethods(ctx)
        },
        {
          placeholder: '{{SETUP_TEARDOWN}}',
          generator: (ctx) => this.generateSetupTeardown(ctx)
        }
      ],
      requiredContext: ['requirements', 'context']
    });

    // Cypress template
    this.registerTemplate({
      id: 'cypress-basic',
      name: 'Cypress Basic',
      category: 'qe-testing',
      baseTemplate: this.getCypressTemplate(),
      dynamicSections: [
        {
          placeholder: '{{CUSTOM_COMMANDS}}',
          generator: (ctx) => this.generateCypressCommands(ctx)
        },
        {
          placeholder: '{{TEST_SPECS}}',
          generator: (ctx) => this.generateCypressSpecs(ctx)
        },
        {
          placeholder: '{{PAGE_OBJECTS}}',
          generator: (ctx) => this.generateCypressPageObjects(ctx),
          conditions: [{ field: 'features', operator: 'includes', value: Feature.PAGE_OBJECT_MODEL }]
        }
      ],
      requiredContext: ['requirements', 'context']
    });

    // Playwright template
    this.registerTemplate({
      id: 'playwright-typescript',
      name: 'Playwright TypeScript',
      category: 'qe-testing',
      baseTemplate: this.getPlaywrightTemplate(),
      dynamicSections: [
        {
          placeholder: '{{FIXTURES}}',
          generator: (ctx) => this.generatePlaywrightFixtures(ctx)
        },
        {
          placeholder: '{{PAGE_OBJECTS}}',
          generator: (ctx) => this.generatePlaywrightPageObjects(ctx)
        },
        {
          placeholder: '{{TEST_SPECS}}',
          generator: (ctx) => this.generatePlaywrightSpecs(ctx)
        }
      ],
      requiredContext: ['requirements', 'context']
    });
  }

  /**
   * Get template ID based on context
   */
  private static getTemplateId(context: GenerationContext): string {
    switch (context.outputFormat) {
      case OutputFormat.SELENIUM_PYTHON:
        return 'selenium-python-basic';
      case OutputFormat.CYPRESS:
        return 'cypress-basic';
      case OutputFormat.PLAYWRIGHT_JS:
        return 'playwright-typescript';
      default:
        return 'selenium-python-basic';
    }
  }

  /**
   * Check if section should be included based on conditions
   */
  private static shouldIncludeSection(section: DynamicSection, context: GenerationContext): boolean {
    if (!section.conditions) return true;

    return section.conditions.every(condition => {
      const contextValue = (context as any)[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return contextValue === condition.value;
        case 'includes':
          return Array.isArray(contextValue) && contextValue.includes(condition.value);
        case 'exists':
          return contextValue !== undefined && contextValue !== null;
        default:
          return false;
      }
    });
  }

  // Template generators
  private static getSeleniumPythonTemplate(): string {
    return `{{IMPORTS}}

{{PAGE_OBJECTS}}

class TestSuite:
    {{SETUP_TEARDOWN}}
    
    {{TEST_METHODS}}`;
  }

  private static getCypressTemplate(): string {
    return `{{CUSTOM_COMMANDS}}

{{PAGE_OBJECTS}}

{{TEST_SPECS}}`;
  }

  private static getPlaywrightTemplate(): string {
    return `{{FIXTURES}}

{{PAGE_OBJECTS}}

{{TEST_SPECS}}`;
  }

  // Dynamic content generators
  private static generateSeleniumImports(ctx: any): string {
    const imports = [
      'import pytest',
      'from selenium import webdriver',
      'from selenium.webdriver.common.by import By',
      'from selenium.webdriver.support.ui import WebDriverWait',
      'from selenium.webdriver.support import expected_conditions as EC',
      'from selenium.webdriver.chrome.service import Service',
      'from webdriver_manager.chrome import ChromeDriverManager',
      'import logging'
    ];

    if (ctx.context.requiredFeatures.includes(Feature.ERROR_HANDLING)) {
      imports.push('from selenium.common.exceptions import TimeoutException, NoSuchElementException');
    }

    return imports.join('\n');
  }

  private static generatePageObjects(ctx: any): string {
    if (!ctx.context.requiredFeatures.includes(Feature.PAGE_OBJECT_MODEL)) {
      return '';
    }

    const workflows = ctx.requirements.workflows || [];
    const pageObjects = workflows.map((workflow: any) => {
      const className = workflow.name.replace(/\s+/g, '') + 'Page';
      return `
class ${className}:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)
    
    def perform_${workflow.type}_action(self):
        """Perform ${workflow.type} action"""
        # Implementation based on workflow steps
        pass`;
    });

    return pageObjects.join('\n');
  }

  private static generateTestMethods(ctx: any): string {
    const scenarios = ctx.requirements.testScenarios || ['general_testing'];
    
    return scenarios.map((scenario: string) => `
    def test_${scenario}(self):
        """Test ${scenario.replace(/_/g, ' ')}"""
        # Test implementation for ${scenario}
        assert True`).join('\n');
  }

  private static generateSetupTeardown(ctx: any): string {
    return `
    @pytest.fixture(autouse=True)
    def setup_and_teardown(self):
        """Setup and teardown for each test"""
        # Setup
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service)
        self.driver.maximize_window()
        
        yield
        
        # Teardown
        self.driver.quit()`;
  }

  private static generateCypressCommands(ctx: any): string {
    return `
// Custom Cypress commands
Cypress.Commands.add('login', (email, password) => {
  cy.get('#email').type(email);
  cy.get('#password').type(password);
  cy.get('#login-btn').click();
});

Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout });
});`;
  }

  private static generateCypressSpecs(ctx: any): string {
    const scenarios = ctx.requirements.testScenarios || ['general_testing'];
    
    return scenarios.map((scenario: string) => `
describe('${scenario.replace(/_/g, ' ')}', () => {
  it('should perform ${scenario.replace(/_/g, ' ')}', () => {
    // Test implementation for ${scenario}
    cy.visit('${ctx.requirements.baseUrl || 'https://example.com'}');
    // Add test steps here
  });
});`).join('\n');
  }

  private static generateCypressPageObjects(ctx: any): string {
    if (!ctx.context.requiredFeatures.includes(Feature.PAGE_OBJECT_MODEL)) {
      return '';
    }

    return `
class PageObject {
  constructor() {
    this.selectors = {
      // Add selectors based on requirements
    };
  }
  
  visit(url) {
    cy.visit(url);
  }
  
  clickElement(selector) {
    cy.get(selector).click();
  }
}

export default PageObject;`;
  }

  private static generatePlaywrightFixtures(ctx: any): string {
    return `
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  // Add custom fixtures here
});

export { expect };`;
  }

  private static generatePlaywrightPageObjects(ctx: any): string {
    return `
export class BasePage {
  constructor(page) {
    this.page = page;
  }
  
  async navigate(url) {
    await this.page.goto(url);
  }
  
  async clickElement(selector) {
    await this.page.click(selector);
  }
}`;
  }

  private static generatePlaywrightSpecs(ctx: any): string {
    const scenarios = ctx.requirements.testScenarios || ['general_testing'];
    
    return scenarios.map((scenario: string) => `
test('${scenario.replace(/_/g, ' ')}', async ({ page }) => {
  // Test implementation for ${scenario}
  await page.goto('${ctx.requirements.baseUrl || 'https://example.com'}');
  // Add test steps here
});`).join('\n');
  }
}

// Initialize template manager
TemplateManager.initialize();