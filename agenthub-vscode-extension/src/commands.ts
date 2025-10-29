import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AgentService } from './agentService';
import { OutputChannelManager } from './outputChannel';
import { StatusBarManager } from './statusBar';
import { HistoryTreeDataProvider } from './treeDataProvider';
import { Agent, OperationHistory } from './types';

export class CommandManager {
  private outputManager: OutputChannelManager;
  private statusBarManager: StatusBarManager;

  constructor(
    private agentService: AgentService,
    private historyProvider: HistoryTreeDataProvider
  ) {
    this.outputManager = OutputChannelManager.getInstance();
    this.statusBarManager = StatusBarManager.getInstance(agentService);
  }

  async generateTests(uri?: vscode.Uri) {
    const startTime = Date.now();
    const operation = 'Generate Tests';
    
    try {
      const filePath = uri?.fsPath || vscode.window.activeTextEditor?.document.fileName;
      if (!filePath) {
        vscode.window.showErrorMessage('No file selected for test generation');
        return;
      }

      this.outputManager.logOperation(operation, path.basename(filePath));
      this.statusBarManager.showOperation('Generating Tests');

      const sourceCode = fs.readFileSync(filePath, 'utf-8');
      const result = await this.agentService.generateTests(filePath, sourceCode);

      const duration = Date.now() - startTime;

      if (result.success && result.data.test_cases) {
        // Create test file
        const testDir = path.join(path.dirname(filePath), 'tests');
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }

        const fileName = path.basename(filePath, path.extname(filePath));
        const testFileName = `${fileName}.test${path.extname(filePath)}`;
        const testFilePath = path.join(testDir, testFileName);

        fs.writeFileSync(testFilePath, result.data.test_cases);

        this.outputManager.logSuccess(operation, duration, `Created ${testFileName}`);
        this.outputManager.logResult('Generated Tests', result.data.test_cases);

        // Open the generated test file
        const doc = await vscode.workspace.openTextDocument(testFilePath);
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(`Tests generated successfully: ${testFileName}`);
      } else {
        throw new Error(result.error || 'Failed to generate tests');
      }

      this.statusBarManager.operationCompleted(true);
      this.addToHistory({
        id: Date.now().toString(),
        timestamp: new Date(),
        operation,
        file: path.basename(filePath),
        agent: 'test-generator',
        success: true,
        duration,
        result: 'Tests generated successfully'
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.outputManager.logError(operation, error.message);
      this.statusBarManager.operationCompleted(false);
      vscode.window.showErrorMessage(`Test generation failed: ${error.message}`);

      this.addToHistory({
        id: Date.now().toString(),
        timestamp: new Date(),
        operation,
        file: uri ? path.basename(uri.fsPath) : 'unknown',
        agent: 'test-generator',
        success: false,
        duration,
        result: error.message
      });
    }
  }

  async analyzeSecurity(uri?: vscode.Uri) {
    const startTime = Date.now();
    const operation = 'Security Analysis';
    
    try {
      const filePath = uri?.fsPath || vscode.window.activeTextEditor?.document.fileName;
      if (!filePath) {
        vscode.window.showErrorMessage('No file selected for security analysis');
        return;
      }

      this.outputManager.logOperation(operation, path.basename(filePath));
      this.statusBarManager.showOperation('Analyzing Security');

      const sourceCode = fs.readFileSync(filePath, 'utf-8');
      const result = await this.agentService.analyzeSecurity(filePath, sourceCode);

      const duration = Date.now() - startTime;

      if (result.success) {
        const issues = result.data.security_issues || [];
        
        this.outputManager.logSuccess(operation, duration, `Found ${issues.length} issues`);
        this.outputManager.logSecurityIssues(issues);

        if (result.data.suggestions) {
          this.outputManager.logSuggestions(result.data.suggestions);
        }

        // Show diagnostic information in VS Code
        this.showSecurityDiagnostics(filePath, issues);

        const message = issues.length === 0 
          ? 'No security issues found!' 
          : `Found ${issues.length} security issue(s). Check output for details.`;
        
        if (issues.length === 0) {
          vscode.window.showInformationMessage(message);
        } else {
          vscode.window.showWarningMessage(message, 'Show Output').then(selection => {
            if (selection === 'Show Output') {
              this.outputManager.show();
            }
          });
        }
      } else {
        throw new Error(result.error || 'Security analysis failed');
      }

      this.statusBarManager.operationCompleted(true);
      this.addToHistory({
        id: Date.now().toString(),
        timestamp: new Date(),
        operation,
        file: path.basename(filePath),
        agent: 'security-scanner',
        success: true,
        duration,
        result: `Found ${result.data.security_issues?.length || 0} issues`
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.outputManager.logError(operation, error.message);
      this.statusBarManager.operationCompleted(false);
      vscode.window.showErrorMessage(`Security analysis failed: ${error.message}`);

      this.addToHistory({
        id: Date.now().toString(),
        timestamp: new Date(),
        operation,
        file: uri ? path.basename(uri.fsPath) : 'unknown',
        agent: 'security-scanner',
        success: false,
        duration,
        result: error.message
      });
    }
  }

  async generateDocumentation(uri?: vscode.Uri) {
    const startTime = Date.now();
    const operation = 'Generate Documentation';
    
    try {
      const filePath = uri?.fsPath || vscode.window.activeTextEditor?.document.fileName;
      if (!filePath) {
        vscode.window.showErrorMessage('No file selected for documentation generation');
        return;
      }

      this.outputManager.logOperation(operation, path.basename(filePath));
      this.statusBarManager.showOperation('Generating Docs');

      const sourceCode = fs.readFileSync(filePath, 'utf-8');
      const result = await this.agentService.generateDocumentation(filePath, sourceCode);

      const duration = Date.now() - startTime;

      if (result.success && result.data.generated_code) {
        const docDir = path.join(path.dirname(filePath), 'docs');
        if (!fs.existsSync(docDir)) {
          fs.mkdirSync(docDir, { recursive: true });
        }

        const fileName = path.basename(filePath, path.extname(filePath));
        const docFileName = `${fileName}.md`;
        const docFilePath = path.join(docDir, docFileName);

        fs.writeFileSync(docFilePath, result.data.generated_code);

        this.outputManager.logSuccess(operation, duration, `Created ${docFileName}`);
        this.outputManager.logResult('Generated Documentation', result.data.generated_code);

        // Open the generated documentation
        const doc = await vscode.workspace.openTextDocument(docFilePath);
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(`Documentation generated successfully: ${docFileName}`);
      } else {
        throw new Error(result.error || 'Failed to generate documentation');
      }

      this.statusBarManager.operationCompleted(true);
      this.addToHistory({
        id: Date.now().toString(),
        timestamp: new Date(),
        operation,
        file: path.basename(filePath),
        agent: 'documentation-generator',
        success: true,
        duration,
        result: 'Documentation generated successfully'
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.outputManager.logError(operation, error.message);
      this.statusBarManager.operationCompleted(false);
      vscode.window.showErrorMessage(`Documentation generation failed: ${error.message}`);

      this.addToHistory({
        id: Date.now().toString(),
        timestamp: new Date(),
        operation,
        file: uri ? path.basename(uri.fsPath) : 'unknown',
        agent: 'documentation-generator',
        success: false,
        duration,
        result: error.message
      });
    }
  }

  async analyzeFailure() {
    const errorMessage = await vscode.window.showInputBox({
      prompt: 'Enter the error message or paste from terminal',
      placeHolder: 'TypeError: Cannot read property...',
      ignoreFocusOut: true
    });

    if (!errorMessage) {
      return;
    }

    const startTime = Date.now();
    const operation = 'Analyze Failure';
    
    try {
      this.outputManager.logOperation(operation);
      this.statusBarManager.showOperation('Analyzing Failure');

      const result = await this.agentService.analyzeFailure(errorMessage);
      const duration = Date.now() - startTime;

      if (result.success) {
        this.outputManager.logSuccess(operation, duration);
        
        if (result.data.analysis) {
          this.outputManager.logResult('Failure Analysis', JSON.stringify(result.data.analysis, null, 2));
        }

        if (result.data.suggestions) {
          this.outputManager.logSuggestions(result.data.suggestions);
        }

        if (result.data.generated_code) {
          this.outputManager.logResult('Suggested Fix', result.data.generated_code);
        }

        this.outputManager.show();
        vscode.window.showInformationMessage('Failure analysis completed. Check output for details.');
      } else {
        throw new Error(result.error || 'Failure analysis failed');
      }

      this.statusBarManager.operationCompleted(true);
      this.addToHistory({
        id: Date.now().toString(),
        timestamp: new Date(),
        operation,
        agent: 'failure-analyzer',
        success: true,
        duration,
        result: 'Analysis completed'
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.outputManager.logError(operation, error.message);
      this.statusBarManager.operationCompleted(false);
      vscode.window.showErrorMessage(`Failure analysis failed: ${error.message}`);

      this.addToHistory({
        id: Date.now().toString(),
        timestamp: new Date(),
        operation,
        agent: 'failure-analyzer',
        success: false,
        duration,
        result: error.message
      });
    }
  }

  async listAgents() {
    try {
      const agents = await this.agentService.listAgents();
      
      if (agents.length === 0) {
        vscode.window.showInformationMessage('No agents available. Check your connection configuration.');
        return;
      }

      const items = agents.map(agent => ({
        label: agent.name || agent.id,
        description: agent.description || 'No description',
        detail: `Version: ${agent.version} | Tags: ${agent.tags?.join(', ') || 'None'}`,
        agent
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select an agent to view details',
        ignoreFocusOut: true
      });

      if (selected) {
        this.showAgentInfo(selected.agent);
      }

    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to list agents: ${error.message}`);
    }
  }

  async configure() {
    const config = this.agentService.getConfig();
    
    const apiUrl = await vscode.window.showInputBox({
      prompt: 'Enter AgentHub API URL',
      value: config.apiUrl,
      ignoreFocusOut: true
    });

    if (!apiUrl) return;

    const apiKey = await vscode.window.showInputBox({
      prompt: 'Enter API Key (optional)',
      value: config.apiKey,
      password: true,
      ignoreFocusOut: true
    });

    // Update configuration
    const workspaceConfig = vscode.workspace.getConfiguration('agenthub');
    await workspaceConfig.update('apiUrl', apiUrl, vscode.ConfigurationTarget.Global);
    
    if (apiKey) {
      await workspaceConfig.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
    }

    // Test connection
    const isConnected = await this.agentService.testConnection();
    this.statusBarManager.setConnected(isConnected);

    if (isConnected) {
      vscode.window.showInformationMessage('AgentHub configured successfully!');
      vscode.commands.executeCommand('setContext', 'agenthub.initialized', true);
    } else {
      vscode.window.showWarningMessage('Configuration saved, but connection test failed. Please check your settings.');
    }
  }

  async initProject() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    try {
      const agentHubDir = path.join(workspaceFolder.uri.fsPath, '.agenthub');
      if (!fs.existsSync(agentHubDir)) {
        fs.mkdirSync(agentHubDir, { recursive: true });
      }

      const configPath = path.join(agentHubDir, 'config.json');
      const projectConfig = {
        version: '1.0.0',
        project: {
          name: workspaceFolder.name,
          language: 'auto-detect',
          framework: 'auto-detect'
        },
        agents: {
          preferred: {
            'code-quality': 'code-quality-agent',
            'test-generator': 'test-generator-agent',
            'security-scanner': 'security-scanner-agent'
          }
        },
        hooks: {
          'pre-commit': ['security-scan'],
          'pre-push': ['test-coverage']
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(projectConfig, null, 2));

      vscode.window.showInformationMessage('AgentHub initialized in project successfully!');
      this.outputManager.log('Project initialized with AgentHub configuration');

    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to initialize project: ${error.message}`);
    }
  }

  showOutput() {
    this.outputManager.show();
  }

  showAgentInfo(agent: Agent) {
    const panel = vscode.window.createWebviewPanel(
      'agentInfo',
      `Agent: ${agent.name || agent.id}`,
      vscode.ViewColumn.Two,
      {}
    );

    panel.webview.html = this.getAgentInfoHtml(agent);
  }

  private getAgentInfoHtml(agent: Agent): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Agent Info</title>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          .header { border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; color: var(--vscode-textPreformat-foreground); }
          .value { margin-left: 10px; }
          .tag { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); padding: 2px 6px; border-radius: 3px; margin-right: 5px; }
          pre { background: var(--vscode-textBlockQuote-background); padding: 10px; border-radius: 3px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🤖 ${agent.name || agent.id}</h1>
          <p>${agent.description || 'No description available'}</p>
        </div>
        
        <div class="section">
          <div><span class="label">ID:</span><span class="value">${agent.id}</span></div>
          <div><span class="label">Version:</span><span class="value">${agent.version}</span></div>
          ${agent.tags && agent.tags.length > 0 ? `
            <div><span class="label">Tags:</span><span class="value">
              ${agent.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </span></div>
          ` : ''}
        </div>

        ${agent.components && agent.components.length > 0 ? `
          <div class="section">
            <h3>Components</h3>
            <ul>
              ${agent.components.map(comp => `<li><strong>${comp.type}:</strong> ${comp.name || 'Unnamed'}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${agent.inputSchema ? `
          <div class="section">
            <h3>Input Schema</h3>
            <pre>${JSON.stringify(agent.inputSchema, null, 2)}</pre>
          </div>
        ` : ''}

        ${agent.outputSchema ? `
          <div class="section">
            <h3>Output Schema</h3>
            <pre>${JSON.stringify(agent.outputSchema, null, 2)}</pre>
          </div>
        ` : ''}
      </body>
      </html>
    `;
  }

  private showSecurityDiagnostics(filePath: string, issues: any[]) {
    const diagnostics: vscode.Diagnostic[] = issues.map(issue => {
      const line = Math.max(0, (issue.line || 1) - 1);
      const range = new vscode.Range(line, 0, line, Number.MAX_VALUE);
      
      const severity = issue.severity === 'critical' || issue.severity === 'high' 
        ? vscode.DiagnosticSeverity.Error
        : issue.severity === 'medium'
        ? vscode.DiagnosticSeverity.Warning
        : vscode.DiagnosticSeverity.Information;

      const diagnostic = new vscode.Diagnostic(
        range,
        `[AgentHub Security] ${issue.title}: ${issue.description}`,
        severity
      );

      diagnostic.source = 'AgentHub Security Scanner';
      return diagnostic;
    });

    const collection = vscode.languages.createDiagnosticCollection('agenthub-security');
    collection.set(vscode.Uri.file(filePath), diagnostics);
  }

  private addToHistory(operation: OperationHistory) {
    this.historyProvider.addOperation(operation);
  }
}