import * as vscode from 'vscode';
import { Agent, OperationHistory } from './types';
import { AgentService } from './agentService';

export class AgentsTreeDataProvider implements vscode.TreeDataProvider<AgentTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<AgentTreeItem | undefined | null | void> = new vscode.EventEmitter<AgentTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<AgentTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private agents: Agent[] = [];

  constructor(private agentService: AgentService) {
    this.refresh();
  }

  refresh(): void {
    this.loadAgents();
    this._onDidChangeTreeData.fire();
  }

  private async loadAgents() {
    try {
      this.agents = await this.agentService.listAgents();
    } catch (error) {
      this.agents = [];
    }
  }

  getTreeItem(element: AgentTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AgentTreeItem): Thenable<AgentTreeItem[]> {
    if (!element) {
      // Root level - show agents
      return Promise.resolve(
        this.agents.map(agent => new AgentTreeItem(
          agent.name || agent.id,
          agent.description || 'No description',
          vscode.TreeItemCollapsibleState.Collapsed,
          'agent',
          agent
        ))
      );
    } else if (element.contextValue === 'agent' && element.agent) {
      // Agent level - show agent details
      const items: AgentTreeItem[] = [
        new AgentTreeItem(
          `ID: ${element.agent.id}`,
          '',
          vscode.TreeItemCollapsibleState.None,
          'agent-detail'
        ),
        new AgentTreeItem(
          `Version: ${element.agent.version}`,
          '',
          vscode.TreeItemCollapsibleState.None,
          'agent-detail'
        )
      ];

      if (element.agent.tags && element.agent.tags.length > 0) {
        items.push(new AgentTreeItem(
          `Tags: ${element.agent.tags.join(', ')}`,
          '',
          vscode.TreeItemCollapsibleState.None,
          'agent-detail'
        ));
      }

      return Promise.resolve(items);
    }

    return Promise.resolve([]);
  }
}

export class HistoryTreeDataProvider implements vscode.TreeDataProvider<HistoryTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<HistoryTreeItem | undefined | null | void> = new vscode.EventEmitter<HistoryTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<HistoryTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private history: OperationHistory[] = [];

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  addOperation(operation: OperationHistory) {
    this.history.unshift(operation); // Add to beginning
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50); // Keep only last 50
    }
    this.refresh();
  }

  getTreeItem(element: HistoryTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: HistoryTreeItem): Thenable<HistoryTreeItem[]> {
    if (!element) {
      return Promise.resolve(
        this.history.map(op => new HistoryTreeItem(
          `${op.operation}${op.file ? ` (${op.file})` : ''}`,
          `${op.timestamp.toLocaleTimeString()} - ${op.duration}ms - ${op.success ? '✅' : '❌'}`,
          vscode.TreeItemCollapsibleState.None,
          op.success ? 'history-success' : 'history-error',
          op
        ))
      );
    }

    return Promise.resolve([]);
  }
}

export class AgentTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly agent?: Agent
  ) {
    super(label, collapsibleState);
    this.tooltip = description;
    this.description = description;

    if (contextValue === 'agent') {
      this.iconPath = new vscode.ThemeIcon('robot');
      this.command = {
        command: 'agenthub.showAgentInfo',
        title: 'Show Agent Info',
        arguments: [agent]
      };
    }
  }
}

export class HistoryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly operation?: OperationHistory
  ) {
    super(label, collapsibleState);
    this.tooltip = `${label}\n${description}${operation?.result ? `\nResult: ${operation.result}` : ''}`;
    this.description = description;

    this.iconPath = new vscode.ThemeIcon(
      contextValue === 'history-success' ? 'check' : 'error'
    );
  }
}