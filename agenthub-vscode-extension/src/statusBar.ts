import * as vscode from 'vscode';
import { AgentService } from './agentService';

export class StatusBarManager {
  private static instance: StatusBarManager;
  private statusBarItem: vscode.StatusBarItem;
  private agentService: AgentService;
  private isConnected: boolean = false;
  private operationCount: number = 0;

  private constructor(agentService: AgentService) {
    this.agentService = agentService;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    
    this.statusBarItem.command = 'agenthub.showOutput';
    this.statusBarItem.tooltip = 'Click to show AgentHub output';
    
    this.updateStatus();
    this.checkConnection();
    
    // Check connection periodically
    setInterval(() => this.checkConnection(), 30000);
  }

  static getInstance(agentService: AgentService): StatusBarManager {
    if (!StatusBarManager.instance) {
      StatusBarManager.instance = new StatusBarManager(agentService);
    }
    return StatusBarManager.instance;
  }

  private async checkConnection() {
    const config = this.agentService.getConfig();
    if (!config.showStatusBar) {
      this.statusBarItem.hide();
      return;
    }

    try {
      this.isConnected = await this.agentService.testConnection();
      this.updateStatus();
      this.statusBarItem.show();
    } catch (error) {
      this.isConnected = false;
      this.updateStatus();
      this.statusBarItem.show();
    }
  }

  private updateStatus() {
    const config = this.agentService.getConfig();
    
    if (!config.showStatusBar) {
      this.statusBarItem.hide();
      return;
    }

    if (this.isConnected) {
      this.statusBarItem.text = `$(robot) AgentHub (${this.operationCount})`;
      this.statusBarItem.backgroundColor = undefined;
      this.statusBarItem.tooltip = `AgentHub: Connected to ${config.apiUrl}\nOperations completed: ${this.operationCount}\nClick to show output`;
    } else {
      this.statusBarItem.text = '$(robot) AgentHub (Disconnected)';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      this.statusBarItem.tooltip = `AgentHub: Disconnected from ${config.apiUrl}\nClick to configure connection`;
    }
  }

  showOperation(operation: string) {
    this.statusBarItem.text = `$(loading~spin) AgentHub: ${operation}`;
    this.statusBarItem.tooltip = `AgentHub: Running ${operation}...`;
  }

  operationCompleted(success: boolean) {
    if (success) {
      this.operationCount++;
    }
    
    setTimeout(() => {
      this.updateStatus();
    }, 2000);
  }

  setConnected(connected: boolean) {
    this.isConnected = connected;
    this.updateStatus();
  }

  show() {
    const config = this.agentService.getConfig();
    if (config.showStatusBar) {
      this.statusBarItem.show();
    }
  }

  hide() {
    this.statusBarItem.hide();
  }

  dispose() {
    this.statusBarItem.dispose();
  }
}