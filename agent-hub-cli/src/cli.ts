#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createGenerateCommand } from './commands/generate';
import { createAnalyzeCommand } from './commands/analyze';
import { createConfigCommand } from './commands/config';
import { createAgentsCommand } from './commands/agents';
import { createTestCommand } from './commands/test';

const program = new Command();

// CLI metadata
program
  .name('agent')
  .description('AgentHub CLI - Developer tools for agent-powered development')
  .version('1.0.0');

// Global options
program
  .option('-v, --verbose', 'Enable verbose output')
  .option('--no-color', 'Disable colored output');

// Add commands
program.addCommand(createGenerateCommand());
program.addCommand(createAnalyzeCommand());
program.addCommand(createConfigCommand());
program.addCommand(createAgentsCommand());
program.addCommand(createTestCommand());

// Quick commands (shortcuts)
program
  .command('init')
  .description('Initialize AgentHub CLI in current project')
  .action(async () => {
    console.log(chalk.blue('🚀 Initializing AgentHub CLI...\n'));
    
    const { configManager } = await import('./config');
    const { ProjectAnalyzer } = await import('./utils/projectAnalyzer');
    const fs = await import('fs-extra');
    const path = await import('path');
    
    try {
      // Analyze current project
      const context = await ProjectAnalyzer.analyzeProject();
      
      console.log(chalk.green('✅ Project Analysis:'));
      console.log(chalk.gray(`  Language: ${context.language || 'Unknown'}`));
      console.log(chalk.gray(`  Framework: ${context.framework || 'None detected'}`));
      console.log(chalk.gray(`  Test Framework: ${context.testFramework || 'None detected'}`));
      console.log();
      
      // Create .agenthub directory
      const agentHubDir = path.join(context.rootPath, '.agenthub');
      await fs.ensureDir(agentHubDir);
      
      // Create project config
      const projectConfig = {
        version: '1.0.0',
        project: {
          name: context.packageJson?.name || path.basename(context.rootPath),
          language: context.language,
          framework: context.framework,
          testFramework: context.testFramework
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
      
      const configPath = path.join(agentHubDir, 'config.json');
      await fs.writeJson(configPath, projectConfig, { spaces: 2 });
      
      console.log(chalk.green('✅ Created project configuration'));
      console.log(chalk.gray(`  Config: ${path.relative(context.rootPath, configPath)}`));
      
      // Check global config
      const globalConfig = configManager.getConfig();
      if (!globalConfig.apiUrl || globalConfig.apiUrl.includes('localhost')) {
        console.log(chalk.yellow('\n⚠️  Global configuration needed:'));
        console.log(chalk.gray('  Run: agent config setup'));
      }
      
      console.log(chalk.blue('\n🎉 AgentHub CLI initialized successfully!'));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('  1. Configure global settings: agent config setup'));
      console.log(chalk.gray('  2. List available agents: agent agents list'));
      console.log(chalk.gray('  3. Generate tests: agent generate tests'));
      console.log(chalk.gray('  4. Analyze code: agent analyze security'));
      
    } catch (error) {
      console.error(chalk.red(`Initialization failed: ${error}`));
      process.exit(1);
    }
  });

// Quick test generation
program
  .command('test [file]')
  .description('Quick test generation for file or project')
  .action(async (file) => {
    const generateCmd = createGenerateCommand();
    const testCmd = generateCmd.commands.find(cmd => cmd.name() === 'tests');
    
    if (testCmd && testCmd.action) {
      const options = file ? { file } : {};
      await (testCmd.action as any)(options);
    }
  });

// Quick security scan
program
  .command('scan [directory]')
  .description('Quick security scan')
  .action(async (directory) => {
    const analyzeCmd = createAnalyzeCommand();
    const securityCmd = analyzeCmd.commands.find(cmd => cmd.name() === 'security');
    
    if (securityCmd && securityCmd.action) {
      const options = directory ? { directory } : {};
      await (securityCmd.action as any)(options);
    }
  });

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error: any) {
  if (error.code === 'commander.help') {
    process.exit(0);
  } else if (error.code === 'commander.version') {
    process.exit(0);
  } else {
    console.error(chalk.red(`CLI Error: ${error.message}`));
    process.exit(1);
  }
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.blue('🤖 AgentHub CLI - Developer Tools for Agent-Powered Development\n'));
  program.outputHelp();
  
  console.log(chalk.yellow('\nQuick Start:'));
  console.log(chalk.gray('  agent init              # Initialize in current project'));
  console.log(chalk.gray('  agent config setup      # Configure API connection'));
  console.log(chalk.gray('  agent test              # Generate tests for project'));
  console.log(chalk.gray('  agent scan              # Run security scan'));
  console.log(chalk.gray('  agent agents list       # List available agents'));
  
  console.log(chalk.yellow('\nExamples:'));
  console.log(chalk.gray('  agent generate tests --file src/utils.ts'));
  console.log(chalk.gray('  agent analyze failure --log test-results.log'));
  console.log(chalk.gray('  agent analyze security --severity high'));
  console.log(chalk.gray('  agent agents run code-quality --file src/app.ts'));
}