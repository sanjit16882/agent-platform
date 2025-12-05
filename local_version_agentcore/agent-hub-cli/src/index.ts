#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from './config';
import { listTests, createTest, showTest, deleteTest } from './commands/tests';
import { runTests, watchRun } from './commands/run';
import { showResults, listRuns } from './commands/results';
import { showAnalytics } from './commands/analytics';

const program = new Command();

program
  .name('agent-test')
  .description('CLI tool for Agent Hub testing')
  .version('1.0.0');

// Test management commands
program
  .command('list')
  .description('List all available tests')
  .option('-c, --category <category>', 'Filter by category')
  .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
  .option('--agent-type <type>', 'Filter by agent type')
  .action(listTests);

program
  .command('create')
  .description('Create a custom test')
  .requiredOption('-n, --name <name>', 'Test name')
  .requiredOption('-c, --category <category>', 'Test category')
  .option('-d, --description <description>', 'Test description')
  .option('-f, --file <file>', 'Test definition file (JSON/YAML)')
  .option('--input-format <format>', 'Input format (plain_text, json, multi_turn, parameterized)')
  .option('--output-type <type>', 'Expected output type')
  .action(createTest);

program
  .command('show <testId>')
  .description('Show test details')
  .action(showTest);

program
  .command('delete <testId>')
  .description('Delete a test')
  .option('-y, --yes', 'Skip confirmation')
  .action(deleteTest);

// Test execution commands
program
  .command('run')
  .description('Run tests')
  .requiredOption('-a, --agent <agentId>', 'Agent ID')
  .requiredOption('-m, --models <models>', 'Model IDs (comma-separated)')
  .option('-t, --tests <tests>', 'Test IDs (comma-separated)')
  .option('-c, --category <category>', 'Run all tests in category')
  .option('-i, --input-file <file>', 'Input file (JSON/YAML)')
  .option('-s, --suite <file>', 'Test suite file (YAML)')
  .option('-w, --watch', 'Watch execution progress')
  .option('--vector-db', 'Enable Vector DB')
  .option('--knowledge-bases <kbs>', 'Knowledge base IDs (comma-separated)')
  .option('--mcp', 'Enable MCP')
  .option('--mcp-servers <servers>', 'MCP server IDs (comma-separated)')
  .option('--ci-mode', 'CI/CD mode (exit with status code)')
  .option('--fail-threshold <threshold>', 'Fail threshold percentage', '80')
  .option('--report <format>', 'Report format (junit, json, csv)')
  .option('-o, --output <file>', 'Output file for report')
  .action(runTests);

program
  .command('watch <runId>')
  .description('Watch test execution progress')
  .action(watchRun);

// Results commands
program
  .command('results <runId>')
  .description('Show test run results')
  .option('-d, --detailed', 'Show detailed results')
  .option('-e, --export <format>', 'Export format (json, csv)')
  .option('-o, --output <file>', 'Output file')
  .action(showResults);

program
  .command('runs')
  .description('List test runs')
  .option('-a, --agent <agentId>', 'Filter by agent')
  .option('-s, --status <status>', 'Filter by status')
  .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
  .option('--end-date <date>', 'End date (YYYY-MM-DD)')
  .option('-l, --limit <limit>', 'Number of results', '50')
  .action(listRuns);

// Analytics commands
program
  .command('analytics')
  .description('Show analytics')
  .option('-a, --agent <agentId>', 'Filter by agent')
  .option('-d, --days <days>', 'Number of days', '30')
  .option('-e, --export <format>', 'Export format (json, csv)')
  .option('-o, --output <file>', 'Output file')
  .action(showAnalytics);

// Config command
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    console.log(chalk.bold('\nCurrent Configuration:'));
    console.log(chalk.gray('API URL:'), config.apiUrl);
    console.log(chalk.gray('API Key:'), config.apiKey ? '***' + config.apiKey.slice(-4) : 'Not set');
    console.log(chalk.gray('Default Agent:'), config.defaultAgent || 'Not set');
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
