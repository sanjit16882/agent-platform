import * as vscode from 'vscode';
import { AgentService } from './agentService';
import { CommandManager } from './commands';
import { OutputChannelManager } from './outputChannel';
import { StatusBarManager } from './statusBar';
import { AgentsTreeDataProvider, HistoryTreeDataProvider } from './treeDataProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('AgentHub extension is now active!');

  // Initialize services
  const agentService = new AgentService();
  const outputManager = OutputChannelManager.getInstance();
  const statusBarManager = StatusBarManager.getInstance(agentService);
  
  // Initialize tree data providers
  const agentsProvider = new AgentsTreeDataProvider(agentService);
  const historyProvider = new HistoryTreeDataProvider();
  
  // Initialize command manager
  const commandManager = new CommandManager(agentService, historyProvider);

  // Register tree data providers
  vscode.window.registerTreeDataProvider('agenthub.agents', agentsProvider);
  vscode.window.registerTreeDataProvider('agenthub.history', historyProvider);

  // Register commands
  const commands = [
    // Main commands
    vscode.commands.registerCommand('agenthub.generateTests', () => commandManager.generateTests()),
    vscode.commands.registerCommand('agenthub.generateTestsForFile', (uri) => commandManager.generateTests(uri)),
    vscode.commands.registerCommand('agenthub.analyzeSecurity', () => commandManager.analyzeSecurity()),
    vscode.commands.registerCommand('agenthub.analyzeSecurityForFile', (uri) => commandManager.analyzeSecurity(uri)),
    vscode.commands.registerCommand('agenthub.analyzeFailure', () => commandManager.analyzeFailure()),
    vscode.commands.registerCommand('agenthub.generateDocs', () => commandManager.generateDocumentation()),
    vscode.commands.registerCommand('agenthub.generateDocsForFile', (uri) => commandManager.generateDocumentation(uri)),
    vscode.commands.registerCommand('agenthub.listAgents', () => commandManager.listAgents()),
    vscode.commands.registerCommand('agenthub.configure', () => commandManager.configure()),
    vscode.commands.registerCommand('agenthub.initProject', () => commandManager.initProject()),
    vscode.commands.registerCommand('agenthub.showOutput', () => commandManager.showOutput()),
    
    // Tree view commands
    vscode.commands.registerCommand('agenthub.refreshAgents', () => agentsProvider.refresh()),
    vscode.commands.registerCommand('agenthub.refreshHistory', () => historyProvider.refresh()),
    vscode.commands.registerCommand('agenthub.showAgentInfo', (agent) => commandManager.showAgentInfo(agent)),
  ];

  // Add all commands to context subscriptions
  commands.forEach(command => context.subscriptions.push(command));

  // Add other disposables
  context.subscriptions.push(
    outputManager,
    statusBarManager
  );

  // Set up file watchers for auto-generation
  setupFileWatchers(agentService, commandManager);

  // Check initial connection and set context
  checkInitialConnection(agentService);

  // Show status bar
  statusBarManager.show();

  outputManager.log('AgentHub extension activated successfully');
}

function setupFileWatchers(agentService: AgentService, commandManager: CommandManager) {
  const config = agentService.getConfig();
  
  if (config.autoGenerateTests || config.autoSecurityScan) {
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.{js,ts,jsx,tsx,py,java}');
    
    watcher.onDidChange(async (uri) => {
      const config = agentService.getConfig();
      
      if (config.autoSecurityScan) {
        // Run security scan automatically (but silently)
        try {
          await commandManager.analyzeSecurity(uri);
        } catch (error) {
          // Silent failure for auto-scan
        }
      }
    });

    watcher.onDidCreate(async (uri) => {
      const config = agentService.getConfig();
      
      if (config.autoGenerateTests) {
        // Ask user if they want to generate tests for new files
        const result = await vscode.window.showInformationMessage(
          `Generate tests for ${uri.fsPath}?`,
          'Yes',
          'No',
          'Don\'t ask again'
        );
        
        if (result === 'Yes') {
          await commandManager.generateTests(uri);
        } else if (result === 'Don\'t ask again') {
          const workspaceConfig = vscode.workspace.getConfiguration('agenthub');
          await workspaceConfig.update('autoGenerateTests', false, vscode.ConfigurationTarget.Global);
        }
      }
    });
  }
}

async function checkInitialConnection(agentService: AgentService) {
  try {
    const isConnected = await agentService.testConnection();
    vscode.commands.executeCommand('setContext', 'agenthub.initialized', isConnected);
    
    if (!isConnected) {
      const result = await vscode.window.showInformationMessage(
        'AgentHub is not configured. Would you like to configure it now?',
        'Configure',
        'Later'
      );
      
      if (result === 'Configure') {
        vscode.commands.executeCommand('agenthub.configure');
      }
    }
  } catch (error) {
    vscode.commands.executeCommand('setContext', 'agenthub.initialized', false);
  }
}

export function deactivate() {
  console.log('AgentHub extension is now deactivated');
}