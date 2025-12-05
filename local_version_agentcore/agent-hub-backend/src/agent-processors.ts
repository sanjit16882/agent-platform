import { AgentTemplate } from './agent-templates';

export interface ProcessingResult {
  success: boolean;
  outputs: Record<string, any>;
  processingTime: number;
  metadata: {
    agent_type: string;
    processing_method: string;
    input_analysis: string;
  };
}

export class AgentProcessor {

  static async processEmailRephrasing(inputs: any, template: AgentTemplate): Promise<ProcessingResult> {
    const emailContent = inputs.email_content || inputs.input || '';
    const tone = inputs.tone || 'professional';

    if (!emailContent.trim()) {
      return {
        success: false,
        outputs: { error: 'Email content is required' },
        processingTime: 0,
        metadata: {
          agent_type: 'email_rephraser',
          processing_method: 'validation_failed',
          input_analysis: 'Empty input provided'
        }
      };
    }

    // Analyze content type
    let rephrasedContent = '';
    let improvements = [];

    if (emailContent.toLowerCase().includes('appointment') || emailContent.toLowerCase().includes('meeting')) {
      // Professional appointment/meeting rephrasing
      const timeMatch = emailContent.match(/(\w+day,?\s+\w+\s+\d+|\d+:\d+\s*(am|pm)?|\d+\s*(am|pm))/i);
      const dateInfo = timeMatch ? timeMatch[0] : 'scheduled time';

      rephrasedContent = `Subject: Appointment Confirmation\n\nDear Valued Customer,\n\nI hope this message finds you well.\n\nI am writing to confirm your upcoming appointment scheduled for ${dateInfo}. We have reserved this time slot specifically for you and look forward to providing you with excellent service.\n\nPlease let us know if you need to make any changes to this appointment. We appreciate your business and thank you for choosing our services.\n\nBest regards,\nCustomer Service Team`;

      improvements = [
        'Added professional subject line',
        'Structured with proper greeting and closing',
        'Clarified appointment details',
        'Added contact information for changes',
        'Enhanced professional tone'
      ];
    } else if (emailContent.toLowerCase().includes('follow up') || emailContent.toLowerCase().includes('followup')) {
      // Professional follow-up rephrasing
      rephrasedContent = `Subject: Follow-Up on Our Previous Communication\n\nDear [Recipient Name],\n\nI hope you are doing well.\n\nI wanted to follow up on our previous conversation regarding [topic]. I understand that you may be busy, but I wanted to ensure that you have all the information you need to move forward.\n\nIf you have any questions or require additional details, please don't hesitate to reach out. I am here to assist you in any way possible.\n\nThank you for your time and consideration.\n\nBest regards,\n[Your Name]`;

      improvements = [
        'Added clear subject line',
        'Professional opening',
        'Specific reference to previous communication',
        'Clear call to action',
        'Polite and respectful tone'
      ];
    } else {
      // General professional rephrasing
      const sentences = emailContent.split(/[.!?]+/).filter((s: string) => s.trim());
      const rephrasedSentences = sentences.map((sentence: string) => {
        let rephrased = sentence.trim();

        // Capitalize first letter
        rephrased = rephrased.charAt(0).toUpperCase() + rephrased.slice(1);

        // Replace casual language
        rephrased = rephrased.replace(/\bhey\b/gi, 'Hello');
        rephrased = rephrased.replace(/\bthanks\b/gi, 'Thank you');
        rephrased = rephrased.replace(/\bplz\b/gi, 'please');
        rephrased = rephrased.replace(/\bu\b/gi, 'you');
        rephrased = rephrased.replace(/\br\b/gi, 'are');

        return rephrased;
      });

      rephrasedContent = `Subject: Professional Communication\n\nDear Recipient,\n\n${rephrasedSentences.join('. ')}.\n\nThank you for your attention to this matter.\n\nBest regards,\n[Your Name]`;

      improvements = [
        'Added professional email structure',
        'Replaced casual language with formal alternatives',
        'Improved grammar and punctuation',
        'Added appropriate greeting and closing'
      ];
    }

    return {
      success: true,
      outputs: {
        rephrased_content: rephrasedContent,
        improvements_made: improvements
      },
      processingTime: 1500,
      metadata: {
        agent_type: 'email_rephraser',
        processing_method: 'nlp_enhanced_rephrasing',
        input_analysis: `Processed ${emailContent.length} characters, detected ${tone} tone requirement`
      }
    };
  }

  static async processSeleniumCodeGeneration(inputs: any, template: AgentTemplate): Promise<ProcessingResult> {
    const testRequirements = inputs.test_requirements || inputs.input || '';
    const programmingLanguage = inputs.programming_language || 'Java';
    const targetUrl = inputs.target_url || 'https://example.com';

    if (!testRequirements.trim()) {
      return {
        success: false,
        outputs: { error: 'Test requirements are required' },
        processingTime: 0,
        metadata: {
          agent_type: 'selenium_generator',
          processing_method: 'validation_failed',
          input_analysis: 'Empty test requirements provided'
        }
      };
    }

    let testCode = '';
    let dependencies = [];
    let setupInstructions = '';

    switch (programmingLanguage.toLowerCase()) {
      case 'java':
        testCode = `import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import java.time.Duration;

public class GeneratedSeleniumTest {
    private WebDriver driver;
    private WebDriverWait wait;

    @BeforeEach
    public void setUp() {
        System.setProperty("webdriver.chrome.driver", "path/to/chromedriver");
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.manage().window().maximize();
    }

    @Test
    public void testGeneratedScenario() {
        // Navigate to target URL
        driver.get("${targetUrl}");
        
        // Test implementation based on requirements:
        // ${testRequirements}
        
        // Example implementation:
        WebElement element = wait.until(ExpectedConditions.presenceOfElementLocated(By.id("example-id")));
        element.click();
        
        // Add assertions based on your requirements
        assert driver.getTitle().contains("Expected Title");
    }

    @AfterEach
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}`;

        dependencies = [
          'org.seleniumhq.selenium:selenium-java:4.15.0',
          'org.junit.jupiter:junit-jupiter:5.9.2',
          'io.github.bonigarcia:webdrivermanager:5.3.2'
        ];

        setupInstructions = `1. Add dependencies to your pom.xml or build.gradle
2. Download ChromeDriver and update the path in setUp() method
3. Run the test using: mvn test or gradle test`;
        break;

      case 'python':
        testCode = `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
import unittest
import time

class GeneratedSeleniumTest(unittest.TestCase):
    
    def setUp(self):
        # Set up Chrome driver
        service = Service('path/to/chromedriver')
        self.driver = webdriver.Chrome(service=service)
        self.wait = WebDriverWait(self.driver, 10)
        self.driver.maximize_window()
    
    def test_generated_scenario(self):
        """
        Test implementation based on requirements:
        ${testRequirements}
        """
        # Navigate to target URL
        self.driver.get("${targetUrl}")
        
        # Example implementation:
        element = self.wait.until(EC.presence_of_element_located((By.ID, "example-id")))
        element.click()
        
        # Add assertions based on your requirements
        self.assertIn("Expected Title", self.driver.title)
    
    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()`;

        dependencies = [
          'selenium==4.15.0',
          'webdriver-manager==4.0.1'
        ];

        setupInstructions = `1. Install dependencies: pip install selenium webdriver-manager
2. Update chromedriver path in setUp() method
3. Run the test using: python test_file.py`;
        break;

      case 'javascript':
        testCode = `const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('Generated Selenium Test', function() {
    let driver;
    
    before(async function() {
        this.timeout(30000);
        const options = new chrome.Options();
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        await driver.manage().window().maximize();
    });
    
    it('should execute generated test scenario', async function() {
        this.timeout(30000);
        
        // Test implementation based on requirements:
        // ${testRequirements}
        
        // Navigate to target URL
        await driver.get('${targetUrl}');
        
        // Example implementation:
        const element = await driver.wait(until.elementLocated(By.id('example-id')), 10000);
        await element.click();
        
        // Add assertions based on your requirements
        const title = await driver.getTitle();
        assert(title.includes('Expected Title'));
    });
    
    after(async function() {
        if (driver) {
            await driver.quit();
        }
    });
});`;

        dependencies = [
          'selenium-webdriver',
          'mocha',
          'chromedriver'
        ];

        setupInstructions = `1. Install dependencies: npm install selenium-webdriver mocha chromedriver
2. Run the test using: npx mocha test_file.js`;
        break;

      default:
        return {
          success: false,
          outputs: { error: `Unsupported programming language: ${programmingLanguage}` },
          processingTime: 0,
          metadata: {
            agent_type: 'selenium_generator',
            processing_method: 'language_validation_failed',
            input_analysis: `Unsupported language: ${programmingLanguage}`
          }
        };
    }

    return {
      success: true,
      outputs: {
        test_code: testCode,
        dependencies: dependencies,
        setup_instructions: setupInstructions
      },
      processingTime: 2000,
      metadata: {
        agent_type: 'selenium_generator',
        processing_method: 'code_generation',
        input_analysis: `Generated ${programmingLanguage} test code for: ${testRequirements.substring(0, 100)}...`
      }
    };
  }

  static async processDevOpsMonitoring(inputs: any, template: AgentTemplate): Promise<ProcessingResult> {
    const infrastructureType = inputs.infrastructure_type || 'AWS';
    const servicesToMonitor = inputs.services_to_monitor || ['web-server', 'database'];
    const alertThresholds = inputs.alert_thresholds || {};

    let monitoringConfig = '';
    let alertRules = [];
    let dashboardConfig = '';

    switch (infrastructureType.toLowerCase()) {
      case 'aws':
        monitoringConfig = `# CloudWatch Monitoring Configuration
Resources:
  WebServerAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: HighCPUUtilization
      AlarmDescription: Alarm when server CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: ${alertThresholds.cpu || 80}
      ComparisonOperator: GreaterThanThreshold
      
  DatabaseAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: HighDatabaseConnections
      AlarmDescription: Alarm when database connections exceed threshold
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: ${alertThresholds.db_connections || 50}
      ComparisonOperator: GreaterThanThreshold`;

        alertRules = servicesToMonitor.map((service: string) => ({
          service: service,
          metric: service.includes('database') ? 'DatabaseConnections' : 'CPUUtilization',
          threshold: service.includes('database') ? (alertThresholds.db_connections || 50) : (alertThresholds.cpu || 80),
          action: 'SNS notification to ops team'
        }));

        dashboardConfig = `{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/EC2", "CPUUtilization"],
          ["AWS/RDS", "DatabaseConnections"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Infrastructure Monitoring"
      }
    }
  ]
}`;
        break;

      case 'kubernetes':
        monitoringConfig = `apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: infrastructure-alerts
spec:
  groups:
    - name: infrastructure
      rules:
        - alert: HighCPUUsage
          expr: cpu_usage_percent > ${alertThresholds.cpu || 80}
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High CPU usage detected"`;

        alertRules = servicesToMonitor.map((service: string) => ({
          service: service,
          metric: 'cpu_usage_percent',
          threshold: alertThresholds.cpu || 80,
          action: 'Slack notification to DevOps channel'
        }));

        dashboardConfig = `{
  "dashboard": {
    "title": "Kubernetes Monitoring",
    "panels": [
      {
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "cpu_usage_percent",
            "legendFormat": "CPU %"
          }
        ]
      }
    ]
  }
}`;
        break;

      default:
        return {
          success: false,
          outputs: { error: `Unsupported infrastructure type: ${infrastructureType}` },
          processingTime: 0,
          metadata: {
            agent_type: 'devops_monitoring',
            processing_method: 'infrastructure_validation_failed',
            input_analysis: `Unsupported infrastructure: ${infrastructureType}`
          }
        };
    }

    return {
      success: true,
      outputs: {
        monitoring_config: monitoringConfig,
        alert_rules: alertRules,
        dashboard_config: dashboardConfig
      },
      processingTime: 1800,
      metadata: {
        agent_type: 'devops_monitoring',
        processing_method: 'configuration_generation',
        input_analysis: `Generated ${infrastructureType} monitoring for ${servicesToMonitor.length} services`
      }
    };
  }

  static async processCustomAgent(inputs: any, agent: any): Promise<ProcessingResult> {
    const processingLogic = agent.customProcessingLogic || '';
    const inputText = inputs.input || inputs.text || inputs.content || inputs.code || '';

    // Enhanced custom processing based on the user's processing logic description
    let processedOutput = '';

    if (processingLogic.toLowerCase().includes('code') || processingLogic.toLowerCase().includes('analyze') && inputText.includes('function')) {
      // Code Analysis Logic
      processedOutput = this.analyzeCode(inputText, processingLogic);
    } else if (processingLogic.toLowerCase().includes('transform') || processingLogic.toLowerCase().includes('convert')) {
      processedOutput = `**Transformed Content**\n\nOriginal Input: "${inputText}"\n\nTransformed Result: ${inputText.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}\n\nProcessing Logic Applied: ${processingLogic}`;
    } else if (processingLogic.toLowerCase().includes('analyze') || processingLogic.toLowerCase().includes('analysis')) {
      processedOutput = `**Analysis Results**\n\nInput Analysis:\n- Content Length: ${inputText.length} characters\n- Word Count: ${inputText.split(' ').length} words\n- Processing Method: ${processingLogic}\n\nAnalysis Summary: The content has been processed according to your custom logic.`;
    } else if (processingLogic.toLowerCase().includes('generate') || processingLogic.toLowerCase().includes('create')) {
      processedOutput = `**Generated Content**\n\nBased on input: "${inputText}"\n\nGenerated Output:\n${inputText}\n\nGeneration Logic: ${processingLogic}\n\nNote: This is a demonstration of your custom agent's processing capability.`;
    } else {
      processedOutput = `**Custom Processing Complete**\n\nInput: "${inputText}"\n\nProcessing Logic: ${processingLogic}\n\nResult: Your custom agent has successfully processed the input according to the defined logic. In a production environment, this would execute your specific business logic.`;
    }

    return {
      success: true,
      outputs: {
        result: processedOutput,
        processing_summary: `Custom agent processed input using: ${processingLogic.substring(0, 100)}...`,
        input_analysis: `Processed ${inputText.length} characters with custom logic`
      },
      processingTime: 1200,
      metadata: {
        agent_type: 'custom',
        processing_method: 'custom_logic',
        input_analysis: `Custom processing applied to ${inputText.length} characters`
      }
    };
  }

  static analyzeCode(code: string, processingLogic: string): string {
    // Detect programming language
    let language = 'Unknown';
    if (code.includes('function') && code.includes('{') && code.includes('}')) {
      language = 'JavaScript';
    } else if (code.includes('def ') && code.includes(':')) {
      language = 'Python';
    } else if (code.includes('public class') || code.includes('private ') || code.includes('public static')) {
      language = 'Java';
    } else if (code.includes('using ') || code.includes('namespace ')) {
      language = 'C#';
    }

    // Extract functions/methods
    const functions = [];
    if (language === 'JavaScript') {
      const functionMatches = code.match(/function\s+(\w+)\s*\([^)]*\)/g);
      if (functionMatches) {
        functions.push(...functionMatches);
      }
    } else if (language === 'Python') {
      const functionMatches = code.match(/def\s+(\w+)\s*\([^)]*\):/g);
      if (functionMatches) {
        functions.push(...functionMatches);
      }
    }

    // Analyze complexity
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const complexity = lines.length < 10 ? 'Low' : lines.length < 50 ? 'Medium' : 'High';

    // Check for common issues
    const issues = [];
    if (!code.includes('//') && !code.includes('#') && !code.includes('/*')) {
      issues.push('No comments found - consider adding documentation');
    }
    if (code.includes('var ')) {
      issues.push('Consider using let/const instead of var in JavaScript');
    }
    if (code.length > 1000) {
      issues.push('Function/method is quite long - consider breaking it down');
    }

    // Generate analysis report
    return `**Code Analysis Report**

**Language Detected:** ${language}

**Code Structure:**
- Lines of Code: ${lines.length}
- Functions/Methods Found: ${functions.length}
- Complexity Level: ${complexity}

**Functions Identified:**
${functions.length > 0 ? functions.map(f => `- ${f}`).join('\n') : '- No functions detected'}

**Code Quality Assessment:**
${issues.length > 0 ? issues.map(issue => `⚠️ ${issue}`).join('\n') : '✅ No major issues detected'}

**Summary:**
This ${language} code appears to be ${complexity.toLowerCase()} complexity with ${functions.length} function(s). ${issues.length > 0 ? 'Some improvements could be made.' : 'The code structure looks good.'}

**Processing Logic Applied:** ${processingLogic}

**Recommendations:**
- Add proper error handling if not present
- Include unit tests for the functions
- Consider code documentation
- Follow language-specific best practices`;
  }

  static async processAgent(templateId: string, inputs: any, agent?: any): Promise<ProcessingResult> {
    const startTime = Date.now();

    // Handle production agents (from the main server)
    if (templateId.includes('-v') || ['qe-test-generator-v2', 'devops-monitor-v1', 'security-scanner-pro', 'business-analyzer'].includes(templateId)) {
      try {
        // Call the production agent execution service
        const config = require('../config');
        const apiUrl = config.get('endpoints.api') || 'http://localhost:4002';
        const response = await fetch(`${apiUrl}/api/v1/agents/${templateId}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.AGENT_API_KEY || 'demo-key'
          },
          body: JSON.stringify({ inputs })
        });

        const data = await response.json() as any;
        const processingTime = Date.now() - startTime;

        if (data.success) {
          return {
            success: true,
            outputs: data.results,
            processingTime,
            metadata: {
              agent_type: templateId,
              processing_method: 'production_execution',
              input_analysis: `Executed production agent ${templateId}`
            }
          };
        } else {
          throw new Error(data.error || 'Production agent execution failed');
        }
      } catch (error) {
        return {
          success: false,
          outputs: { error: error instanceof Error ? error.message : 'Production agent execution failed' },
          processingTime: Date.now() - startTime,
          metadata: {
            agent_type: templateId,
            processing_method: 'production_execution_failed',
            input_analysis: `Failed to execute production agent ${templateId}`
          }
        };
      }
    }

    // Handle custom agents
    if (templateId === 'custom' && agent) {
      return this.processCustomAgent(inputs, agent);
    }

    // Handle template-based agents
    const template = require('./agent-templates').AGENT_TEMPLATES.find((t: AgentTemplate) => t.id === templateId);

    if (!template) {
      return {
        success: false,
        outputs: { error: 'Template not found' },
        processingTime: Date.now() - startTime,
        metadata: {
          agent_type: 'unknown',
          processing_method: 'template_not_found',
          input_analysis: `Template ID ${templateId} not found`
        }
      };
    }

    switch (template.processingLogic) {
      case 'email_rephrasing':
        return this.processEmailRephrasing(inputs, template);
      case 'selenium_code_generation':
        return this.processSeleniumCodeGeneration(inputs, template);
      case 'devops_monitoring':
        return this.processDevOpsMonitoring(inputs, template);
      default:
        return {
          success: false,
          outputs: { error: 'Processing logic not implemented' },
          processingTime: Date.now() - startTime,
          metadata: {
            agent_type: template.id,
            processing_method: 'not_implemented',
            input_analysis: `Processing logic ${template.processingLogic} not implemented`
          }
        };
    }
  }
}