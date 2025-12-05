import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';

/**
 * IntegrationGuidePage Component
 * 
 * Comprehensive guide for integrating DDTF with popular testing frameworks
 * and test management tools.
 */
const IntegrationGuidePage: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'frameworks' | 'testmgmt' | 'architecture'>('frameworks');

  // Function to get detailed integration content
  const getIntegrationContent = (id: string) => {
    const content: Record<string, any> = {
      robot: {
        title: 'Robot Framework Integration',
        icon: '🤖',
        sections: [
          {
            title: 'Overview',
            content: 'Integrate DDTF with Robot Framework using REST API calls or a custom library wrapper.'
          },
          {
            title: 'Method 1: REST API Integration',
            code: `*** Settings ***
Library    RequestsLibrary

*** Variables ***
\${DDTF_API}    http://localhost:4002/api/testing

*** Test Cases ***
Test AI Agent Quality
    \${response}=    POST    \${DDTF_API}/execute
    ...    json={"agentId": "chatbot", "testIds": ["quality_check"]}
    Should Be Equal As Strings    \${response.json()['success']}    True`
          },
          {
            title: 'Method 2: Custom Library',
            content: 'Create a Python library wrapper for seamless integration with Robot Framework keywords.'
          },
          {
            title: 'CI/CD Integration',
            code: `# GitHub Actions
- name: Run Robot + DDTF Tests
  run: robot --outputdir results tests/`
          }
        ]
      },
      selenium: {
        title: 'Selenium WebDriver Integration',
        icon: '🌐',
        sections: [
          {
            title: 'Overview',
            content: 'Combine Selenium for UI testing with DDTF for AI agent validation in end-to-end scenarios.'
          },
          {
            title: 'Java Example',
            code: `// Execute DDTF test after UI interaction
HttpClient client = HttpClient.newHttpClient();
String payload = "{\\"agentId\\":\\"chatbot\\",\\"testIds\\":[\\"quality_check\\"]}";
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("http://localhost:4002/api/testing/execute"))
    .POST(HttpRequest.BodyPublishers.ofString(payload))
    .build();
HttpResponse<String> response = client.send(request, 
    HttpResponse.BodyHandlers.ofString());`
          },
          {
            title: 'Python Example',
            code: `from selenium import webdriver
import requests

# Selenium UI interaction
driver = webdriver.Chrome()
driver.get("https://myapp.com/chatbot")
response_text = driver.find_element(By.CLASS_NAME, "bot-message").text

# Validate with DDTF
result = requests.post('http://localhost:4002/api/testing/execute',
    json={'agentId': 'chatbot', 'customInput': response_text})
assert result.json()['passRate'] >= 80`
          }
        ]
      },
      cypress: {
        title: 'Cypress Integration',
        icon: '🔷',
        sections: [
          {
            title: 'Overview',
            content: 'Add DDTF validation to your Cypress E2E tests with custom commands.'
          },
          {
            title: 'Custom Command',
            code: `// cypress/support/commands.js
Cypress.Commands.add('validateAI', (agentId, testIds) => {
  return cy.request({
    method: 'POST',
    url: 'http://localhost:4002/api/testing/execute',
    body: { agentId, testIds }
  }).then((response) => {
    expect(response.body.success).to.be.true;
    return response.body.runId;
  });
});`
          },
          {
            title: 'Usage in Tests',
            code: `describe('AI Chatbot Tests', () => {
  it('validates chatbot quality', () => {
    cy.visit('/chatbot');
    cy.get('#chat-input').type('Hello');
    cy.get('#send').click();
    
    cy.get('.bot-message').invoke('text').then((text) => {
      cy.validateAI('chatbot', ['quality_check']);
    });
  });
});`
          }
        ]
      },
      junit: {
        title: 'JUnit Integration',
        icon: '☕',
        sections: [
          {
            title: 'Overview',
            content: 'Integrate DDTF with JUnit for Java-based AI agent testing.'
          },
          {
            title: 'Maven Dependency',
            code: `<dependency>
    <groupId>com.agenthub</groupId>
    <artifactId>ddtf-client</artifactId>
    <version>1.0.0</version>
    <scope>test</scope>
</dependency>`
          },
          {
            title: 'Test Example',
            code: `@Test
public void testAIQuality() throws Exception {
    DDTFClient client = new DDTFClient("http://localhost:4002");
    TestRun result = client.executeTest(
        TestRequest.builder()
            .agentId("chatbot")
            .testIds(Arrays.asList("quality_check"))
            .build()
    );
    assertTrue(result.getPassRate() >= 80);
}`
          }
        ]
      },
      pytest: {
        title: 'Pytest Integration',
        icon: '🐍',
        sections: [
          {
            title: 'Overview',
            content: 'Integrate DDTF with Pytest using fixtures and plugins.'
          },
          {
            title: 'Fixture Setup',
            code: `# conftest.py
import pytest
import requests

@pytest.fixture(scope="session")
def ddtf_client():
    class DDTFClient:
        def execute_test(self, agent_id, test_ids):
            response = requests.post(
                'http://localhost:4002/api/testing/execute',
                json={'agentId': agent_id, 'testIds': test_ids}
            )
            return response.json()
    return DDTFClient()`
          },
          {
            title: 'Test Example',
            code: `def test_ai_quality(ddtf_client):
    result = ddtf_client.execute_test(
        agent_id="chatbot",
        test_ids=["quality_check"]
    )
    assert result["passRate"] >= 80`
          }
        ]
      },
      testrail: {
        title: 'TestRail Integration',
        icon: '🚂',
        sections: [
          {
            title: 'Overview',
            content: 'Integrate DDTF with TestRail for automated test result reporting and management.'
          },
          {
            title: 'Configuration',
            code: `const config = {
  host: 'https://yourcompany.testrail.io',
  user: 'your-email@company.com',
  apiKey: process.env.TESTRAIL_API_KEY,
  projectId: 1,
  suiteId: 2
};`
          },
          {
            title: 'Automated Reporting',
            content: 'DDTF test results are automatically synced to TestRail via API integration, updating test cases with pass/fail status, scores, and detailed execution logs.'
          },
          {
            title: 'Webhook Support',
            content: 'Configure TestRail webhooks to trigger DDTF tests automatically when test runs are created or updated.'
          }
        ]
      },
      xray: {
        title: 'Xray (Jira) Integration',
        icon: '📋',
        sections: [
          {
            title: 'Overview',
            content: 'Integrate DDTF with Xray Test Management for Jira to manage AI agent tests within your Jira workflow.'
          },
          {
            title: 'Authentication',
            code: `const response = await axios.post(
  'https://xray.cloud.getxray.app/api/v2/authenticate',
  {
    client_id: process.env.XRAY_CLIENT_ID,
    client_secret: process.env.XRAY_CLIENT_SECRET
  }
);`
          },
          {
            title: 'Result Import',
            content: 'DDTF results are converted to Xray format and imported automatically, linking test executions to Jira issues and requirements.'
          },
          {
            title: 'Jira Automation',
            content: 'Create Jira automation rules to trigger DDTF tests when test executions are created or when specific conditions are met.'
          }
        ]
      },
      qtest: {
        title: 'qTest Integration',
        icon: '🧪',
        sections: [
          {
            title: 'Overview',
            content: 'Integrate DDTF with qTest for enterprise test management and reporting.'
          },
          {
            title: 'API Configuration',
            code: `const config = {
  qtestUrl: 'https://yourcompany.qtestnet.com',
  apiToken: process.env.QTEST_API_TOKEN,
  projectId: 12345,
  testCycleId: 67890
};`
          },
          {
            title: 'Test Log Submission',
            content: 'DDTF automatically submits test logs to qTest with detailed execution information, including pass/fail status, duration, and AI-specific metrics.'
          },
          {
            title: 'Dashboard Integration',
            content: 'View DDTF test results in qTest dashboards alongside your other test automation results for unified reporting.'
          }
        ]
      }
    };
    return content[id] || null;
  };

  const frameworks = [
    {
      id: 'robot',
      name: 'Robot Framework',
      icon: 'https://robotframework.org/img/RF.svg',
      iconFallback: '🤖',
      complexity: 'Low',
      effort: '1-2 hours',
      description: 'REST API + Custom Library integration'
    },
    {
      id: 'selenium',
      name: 'Selenium WebDriver',
      icon: 'https://selenium.dev/images/selenium_logo_square_green.png',
      iconFallback: '🌐',
      complexity: 'Low',
      effort: '1-2 hours',
      description: 'Side-by-side execution with UI testing'
    },
    {
      id: 'cypress',
      name: 'Cypress',
      icon: 'https://asset.brandfetch.io/idIq_kF0rb/idv3zwmSiY.jpeg',
      iconFallback: '🔷',
      complexity: 'Low',
      effort: '2-3 hours',
      description: 'Custom commands and plugin integration'
    },
    {
      id: 'junit',
      name: 'JUnit',
      icon: 'https://junit.org/junit5/assets/img/junit5-logo.png',
      iconFallback: '☕',
      complexity: 'Medium',
      effort: '2-4 hours',
      description: 'Maven plugin and Java client'
    },
    {
      id: 'pytest',
      name: 'Pytest',
      icon: 'https://docs.pytest.org/en/stable/_static/pytest_logo_curves.svg',
      iconFallback: '🐍',
      complexity: 'Medium',
      effort: '2-4 hours',
      description: 'Fixtures and plugin integration'
    }
  ];

  const testMgmtTools = [
    {
      id: 'testrail',
      name: 'TestRail',
      icon: 'https://www.gurock.com/images/testrail-logo.svg',
      iconFallback: '🚂',
      complexity: 'Medium',
      effort: '1-2 days',
      description: 'API integration with automated reporting'
    },
    {
      id: 'xray',
      name: 'Xray (Jira)',
      icon: 'https://marketplace-cdn.atlassian.com/files/images/e2e09e2e-cb2e-4223-9b2a-34b2a7e5c2e4.png',
      iconFallback: '📋',
      complexity: 'Medium',
      effort: '1-2 days',
      description: 'Jira integration with Xray plugin'
    },
    {
      id: 'qtest',
      name: 'qTest',
      icon: 'https://www.tricentis.com/wp-content/uploads/2023/03/qTest-logo.svg',
      iconFallback: '🧪',
      complexity: 'Medium',
      effort: '1-2 days',
      description: 'Enterprise test management integration'
    }
  ];

  return (
    <div style={{ padding: theme.spacing.xl }}>
      {/* Header */}
      <div style={{ marginBottom: theme.spacing['2xl'] }}>
        <Button
          variant="secondary"
          onClick={() => window.history.back()}
          style={{ marginBottom: theme.spacing.lg }}
        >
          ← Back to Agent Testing
        </Button>
        
        <h1 style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary,
          marginBottom: theme.spacing.sm
        }}>
          DDTF Integration Guide
        </h1>
        <p style={{
          fontSize: theme.typography.fontSize.lg,
          color: theme.colors.textSecondary
        }}>
          Integrate DDTF with your existing testing frameworks and test management tools
        </p>
      </div>

      {/* Overview Card */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Body>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: theme.spacing.xl,
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: theme.spacing.sm }}>🔌</div>
              <strong>4 Integration Methods</strong>
              <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                REST API, CLI, SDK, Plugins
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: theme.spacing.sm }}>🧪</div>
              <strong>5 Testing Frameworks</strong>
              <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                Robot, Selenium, Cypress, JUnit, Pytest
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: theme.spacing.sm }}>📊</div>
              <strong>3 Test Management Tools</strong>
              <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                TestRail, Xray, qTest
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: theme.spacing.sm }}>⚡</div>
              <strong>Easy Integration</strong>
              <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                30 min to 2 days setup time
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
        borderBottom: `2px solid ${theme.colors.border}`
      }}>
        <button
          onClick={() => setSelectedTab('frameworks')}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            background: 'none',
            border: 'none',
            borderBottom: selectedTab === 'frameworks' ? `3px solid ${theme.colors.primary}` : 'none',
            color: selectedTab === 'frameworks' ? theme.colors.primary : theme.colors.textSecondary,
            fontWeight: selectedTab === 'frameworks' ? theme.typography.fontWeight.semibold : 'normal',
            cursor: 'pointer',
            fontSize: theme.typography.fontSize.base
          }}
        >
          Testing Frameworks
        </button>
        <button
          onClick={() => setSelectedTab('testmgmt')}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            background: 'none',
            border: 'none',
            borderBottom: selectedTab === 'testmgmt' ? `3px solid ${theme.colors.primary}` : 'none',
            color: selectedTab === 'testmgmt' ? theme.colors.primary : theme.colors.textSecondary,
            fontWeight: selectedTab === 'testmgmt' ? theme.typography.fontWeight.semibold : 'normal',
            cursor: 'pointer',
            fontSize: theme.typography.fontSize.base
          }}
        >
          Test Management
        </button>
        <button
          onClick={() => setSelectedTab('architecture')}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            background: 'none',
            border: 'none',
            borderBottom: selectedTab === 'architecture' ? `3px solid ${theme.colors.primary}` : 'none',
            color: selectedTab === 'architecture' ? theme.colors.primary : theme.colors.textSecondary,
            fontWeight: selectedTab === 'architecture' ? theme.typography.fontWeight.semibold : 'normal',
            cursor: 'pointer',
            fontSize: theme.typography.fontSize.base
          }}
        >
          Architecture
        </button>
      </div>

      {/* Detailed View */}
      {selectedFramework && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Header>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                {(() => {
                  const item = [...frameworks, ...testMgmtTools].find(f => f.id === selectedFramework);
                  return item ? (
                    <>
                      <img 
                        src={item.icon} 
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'inline';
                        }}
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          objectFit: 'contain' 
                        }}
                      />
                      <span style={{ fontSize: '2rem', display: 'none' }}>{item.iconFallback}</span>
                    </>
                  ) : <span style={{ fontSize: '2rem' }}>{getIntegrationContent(selectedFramework)?.icon}</span>;
                })()}
                <Card.Title>{getIntegrationContent(selectedFramework)?.title}</Card.Title>
              </div>
              <Button
                variant="secondary"
                onClick={() => setSelectedFramework(null)}
              >
                ← Back to List
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {getIntegrationContent(selectedFramework)?.sections.map((section: any, index: number) => (
              <div key={index} style={{ marginBottom: theme.spacing.xl }}>
                <h3 style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  marginBottom: theme.spacing.md,
                  color: theme.colors.primary
                }}>
                  {section.title}
                </h3>
                {section.content && (
                  <p style={{
                    marginBottom: theme.spacing.md,
                    color: theme.colors.textSecondary,
                    lineHeight: '1.6'
                  }}>
                    {section.content}
                  </p>
                )}
                {section.code && (
                  <pre style={{
                    background: theme.colors.backgroundSecondary,
                    padding: theme.spacing.lg,
                    borderRadius: theme.borderRadius.md,
                    overflow: 'auto',
                    fontSize: theme.typography.fontSize.sm,
                    border: `1px solid ${theme.colors.border}`
                  }}>
                    <code>{section.code}</code>
                  </pre>
                )}
              </div>
            ))}
            
            <div style={{
              marginTop: theme.spacing.xl,
              padding: theme.spacing.lg,
              background: theme.colors.infoLight,
              borderRadius: theme.borderRadius.md
            }}>
              <strong>📚 Need More Details?</strong>
              <p style={{ marginTop: theme.spacing.sm, marginBottom: 0 }}>
                For comprehensive integration guides with more examples, see the documentation in 
                <code style={{ margin: `0 ${theme.spacing.xs}` }}>/docs/integrations/</code>
                directory.
              </p>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Testing Frameworks Tab */}
      {selectedTab === 'frameworks' && !selectedFramework && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: theme.spacing.xl
        }}>
          {frameworks.map(framework => (
            <Card key={framework.id} style={{ cursor: 'pointer' }}>
              <Card.Header>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                  <img 
                    src={framework.icon} 
                    alt={framework.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'inline';
                    }}
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      objectFit: 'contain' 
                    }}
                  />
                  <span style={{ fontSize: '2rem', display: 'none' }}>{framework.iconFallback}</span>
                  <Card.Title>{framework.name}</Card.Title>
                </div>
              </Card.Header>
              <Card.Body>
                <p style={{ marginBottom: theme.spacing.md, color: theme.colors.textSecondary }}>
                  {framework.description}
                </p>
                <div style={{ marginBottom: theme.spacing.md }}>
                  <div style={{
                    display: 'inline-block',
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    background: theme.colors.successLight,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.sm,
                    marginRight: theme.spacing.sm
                  }}>
                    Complexity: {framework.complexity}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    background: theme.colors.infoLight,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.sm
                  }}>
                    Setup: {framework.effort}
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={() => setSelectedFramework(framework.id)}
                  style={{ width: '100%' }}
                >
                  View Integration Guide →
                </Button>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Test Management Tab */}
      {selectedTab === 'testmgmt' && !selectedFramework && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: theme.spacing.xl
        }}>
          {testMgmtTools.map(tool => (
            <Card key={tool.id} style={{ cursor: 'pointer' }}>
              <Card.Header>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                  <img 
                    src={tool.icon} 
                    alt={tool.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'inline';
                    }}
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      objectFit: 'contain' 
                    }}
                  />
                  <span style={{ fontSize: '2rem', display: 'none' }}>{tool.iconFallback}</span>
                  <Card.Title>{tool.name}</Card.Title>
                </div>
              </Card.Header>
              <Card.Body>
                <p style={{ marginBottom: theme.spacing.md, color: theme.colors.textSecondary }}>
                  {tool.description}
                </p>
                <div style={{ marginBottom: theme.spacing.md }}>
                  <div style={{
                    display: 'inline-block',
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    background: theme.colors.warningLight,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.sm,
                    marginRight: theme.spacing.sm
                  }}>
                    Complexity: {tool.complexity}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    background: theme.colors.infoLight,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.sm
                  }}>
                    Setup: {tool.effort}
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={() => setSelectedFramework(tool.id)}
                  style={{ width: '100%' }}
                >
                  View Integration Guide →
                </Button>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Architecture Tab */}
      {selectedTab === 'architecture' && !selectedFramework && (
        <Card>
          <Card.Header>
            <Card.Title>Integration Architecture</Card.Title>
          </Card.Header>
          <Card.Body>
            <div style={{ marginBottom: theme.spacing.xl }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.md
              }}>
                Integration Layers
              </h3>
              <pre style={{
                background: theme.colors.backgroundSecondary,
                padding: theme.spacing.lg,
                borderRadius: theme.borderRadius.md,
                overflow: 'auto',
                fontSize: theme.typography.fontSize.sm
              }}>
{`┌─────────────────────────────────────────────────────────┐
│         Your Existing Testing Infrastructure            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Robot    │  │ Selenium │  │ Cypress  │             │
│  │ Framework│  │ WebDriver│  │          │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼────────────────────┘
        │             │             │
        └─────────────┴─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │    DDTF Integration Layer  │
        │  (API / CLI / SDK / Plugin)│
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │      DDTF Core Engine      │
        │  • Test Execution          │
        │  • AI Model Integration    │
        │  • Quality Evaluation      │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Test Management Tools    │
        │  TestRail | Xray | qTest   │
        └───────────────────────────┘`}
              </pre>
            </div>

            <div style={{ marginBottom: theme.spacing.xl }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.md
              }}>
                Integration Methods
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: theme.spacing.lg
              }}>
                <div style={{
                  padding: theme.spacing.lg,
                  background: theme.colors.backgroundSecondary,
                  borderRadius: theme.borderRadius.md
                }}>
                  <strong>1. REST API</strong>
                  <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                    Language agnostic HTTP/JSON endpoints
                  </p>
                </div>
                <div style={{
                  padding: theme.spacing.lg,
                  background: theme.colors.backgroundSecondary,
                  borderRadius: theme.borderRadius.md
                }}>
                  <strong>2. CLI Tool</strong>
                  <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                    Command-line interface for automation
                  </p>
                </div>
                <div style={{
                  padding: theme.spacing.lg,
                  background: theme.colors.backgroundSecondary,
                  borderRadius: theme.borderRadius.md
                }}>
                  <strong>3. SDK</strong>
                  <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                    TypeScript/JavaScript library
                  </p>
                </div>
                <div style={{
                  padding: theme.spacing.lg,
                  background: theme.colors.backgroundSecondary,
                  borderRadius: theme.borderRadius.md
                }}>
                  <strong>4. Plugins</strong>
                  <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                    Framework-specific integrations
                  </p>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Quick Start Section */}
      {!selectedFramework && (
      <Card style={{ marginTop: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title>Quick Start</Card.Title>
        </Card.Header>
        <Card.Body>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: theme.spacing.xl
          }}>
            <div>
              <h4 style={{ marginBottom: theme.spacing.md }}>Step 1: Choose Integration</h4>
              <p style={{ color: theme.colors.textSecondary }}>
                Select the framework or tool you want to integrate with based on your current stack.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: theme.spacing.md }}>Step 2: Install DDTF</h4>
              <pre style={{
                background: theme.colors.backgroundSecondary,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.sm,
                fontSize: theme.typography.fontSize.sm
              }}>
                npm install -g @agent-hub/testing-cli
              </pre>
            </div>
            <div>
              <h4 style={{ marginBottom: theme.spacing.md }}>Step 3: Run First Test</h4>
              <pre style={{
                background: theme.colors.backgroundSecondary,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.sm,
                fontSize: theme.typography.fontSize.sm
              }}>
                agent-test run --agent my-agent
              </pre>
            </div>
          </div>
        </Card.Body>
      </Card>

      )}

      {/* Benefits Section */}
      {!selectedFramework && (
      <Card style={{ marginTop: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title>Why Integrate DDTF?</Card.Title>
        </Card.Header>
        <Card.Body>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: theme.spacing.lg
          }}>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: theme.spacing.sm }}>🔄</div>
              <strong>No Disruption</strong>
              <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                Works alongside existing frameworks
              </p>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: theme.spacing.sm }}>⚡</div>
              <strong>Easy Setup</strong>
              <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                30 minutes to 2 hours integration time
              </p>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: theme.spacing.sm }}>🌐</div>
              <strong>Language Agnostic</strong>
              <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                Works with any programming language
              </p>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: theme.spacing.sm }}>📊</div>
              <strong>Unified Reporting</strong>
              <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                Export to JUnit XML, TAP, JSON
              </p>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: theme.spacing.sm }}>🏢</div>
              <strong>Enterprise Ready</strong>
              <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                Integrates with test management tools
              </p>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: theme.spacing.sm }}>💰</div>
              <strong>Cost Effective</strong>
              <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                80% reduction in manual testing time
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>
      )}
    </div>
  );
};

export default IntegrationGuidePage;
