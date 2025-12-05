import * as vscode from 'vscode';

export class OutputChannelManager {
  private static instance: OutputChannelManager;
  private outputChannel: vscode.OutputChannel;

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel('AgentHub');
  }

  static getInstance(): OutputChannelManager {
    if (!OutputChannelManager.instance) {
      OutputChannelManager.instance = new OutputChannelManager();
    }
    return OutputChannelManager.instance;
  }

  show() {
    this.outputChannel.show();
  }

  hide() {
    this.outputChannel.hide();
  }

  clear() {
    this.outputChannel.clear();
  }

  log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    this.outputChannel.appendLine(`[${timestamp}] ${prefix} ${message}`);
  }

  logOperation(operation: string, file?: string) {
    const fileInfo = file ? ` for ${file}` : '';
    this.log(`Starting ${operation}${fileInfo}...`);
  }

  logSuccess(operation: string, duration: number, details?: string) {
    this.log(`✅ ${operation} completed in ${duration}ms${details ? `: ${details}` : ''}`);
  }

  logError(operation: string, error: string) {
    this.log(`❌ ${operation} failed: ${error}`, 'error');
  }

  logResult(title: string, content: string) {
    this.outputChannel.appendLine(`\n📋 ${title}:`);
    this.outputChannel.appendLine(content);
    this.outputChannel.appendLine('─'.repeat(50));
  }

  logSecurityIssues(issues: any[]) {
    if (issues.length === 0) {
      this.log('✅ No security issues found!');
      return;
    }

    this.outputChannel.appendLine(`\n🔒 Found ${issues.length} security issues:`);
    issues.forEach((issue, index) => {
      const severity = issue.severity.toUpperCase();
      this.outputChannel.appendLine(`\n${index + 1}. [${severity}] ${issue.title}`);
      this.outputChannel.appendLine(`   File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
      this.outputChannel.appendLine(`   ${issue.description}`);
      if (issue.suggestion) {
        this.outputChannel.appendLine(`   💡 Fix: ${issue.suggestion}`);
      }
    });
    this.outputChannel.appendLine('─'.repeat(50));
  }

  logSuggestions(suggestions: string[]) {
    if (suggestions.length === 0) return;

    this.outputChannel.appendLine('\n💡 Suggestions:');
    suggestions.forEach((suggestion, index) => {
      this.outputChannel.appendLine(`  ${index + 1}. ${suggestion}`);
    });
    this.outputChannel.appendLine('─'.repeat(50));
  }

  dispose() {
    this.outputChannel.dispose();
  }
}