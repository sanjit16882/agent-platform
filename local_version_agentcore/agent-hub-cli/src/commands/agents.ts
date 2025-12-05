import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { agentService } from '../services/agentService';

export function createAgentsCommand(): Command {
  const agentsCmd = new Command('agents');
  agentsCmd.description('Manage and interact with agents');

  // List available agents
  agentsCmd
    .command('list')
    .description('List all available agents')
    .option('--format <type>', 'Output format (table, json)', 'table')
    .action(async (options) => {
      try {
        const agents = await agentService.listAgents();
        
        if (agents.length === 0) {
          console.log(chalk.yellow('No agents found. Make sure agents are deployed on the platform.'));
          return;
        }

        if (options.format === 'json') {
          console.log(JSON.stringify(agents, null, 2));
          return;
        }

        console.log(chalk.blue(`\n📋 Available Agents (${agents.length}):\n`));
        
        agents.forEach(agent => {
          console.log(chalk.green(`🤖 ${agent.id}`));
          console.log(chalk.gray(`   Name: ${agent.name || 'No name'}`));
          console.log(chalk.gray(`   Description: ${agent.description || 'No description'}`));
          console.log(chalk.gray(`   Version: ${agent.version || '1.0.0'}`));
          console.log(chalk.gray(`   Tags: ${agent.tags ? agent.tags.join(', ') : 'None'}`));
          console.log();
        });

      } catch (error) {
        console.error(chalk.red(`Error fetching agents: ${error}`));
        process.exit(1);
      }
    });

  // Get agent details
  agentsCmd
    .command('info <agentId>')
    .description('Get detailed information about a specific agent')
    .action(async (agentId) => {
      try {
        const agent = await agentService.getAgent(agentId);
        
        console.log(chalk.blue(`\n🤖 Agent: ${agent.id}\n`));
        console.log(chalk.gray(`Name: ${agent.name || 'No name'}`));
        console.log(chalk.gray(`Description: ${agent.description || 'No description'}`));
        console.log(chalk.gray(`Version: ${agent.version || '1.0.0'}`));
        console.log(chalk.gray(`Created: ${agent.createdAt || 'Unknown'}`));
        console.log(chalk.gray(`Updated: ${agent.updatedAt || 'Unknown'}`));
        
        if (agent.tags && agent.tags.length > 0) {
          console.log(chalk.gray(`Tags: ${agent.tags.join(', ')}`));
        }
        
        if (agent.components && agent.components.length > 0) {
          console.log(chalk.yellow('\n🔧 Components:'));
          agent.components.forEach((component: any, index: number) => {
            console.log(chalk.gray(`  ${index + 1}. ${component.type}: ${component.name || 'Unnamed'}`));
          });
        }
        
        if (agent.inputSchema) {
          console.log(chalk.yellow('\n📥 Input Schema:'));
          console.log(chalk.gray(JSON.stringify(agent.inputSchema, null, 2)));
        }
        
        if (agent.outputSchema) {
          console.log(chalk.yellow('\n📤 Output Schema:'));
          console.log(chalk.gray(JSON.stringify(agent.outputSchema, null, 2)));
        }

      } catch (error) {
        console.error(chalk.red(`Error fetching agent info: ${error}`));
        process.exit(1);
      }
    });

  // Execute agent interactively
  agentsCmd
    .command('run <agentId>')
    .description('Run an agent interactively')
    .option('--input <json>', 'Input data as JSON string')
    .option('--file <path>', 'Input data from file')
    .action(async (agentId, options) => {
      try {
        let inputData: any = {};
        
        if (options.input) {
          try {
            inputData = JSON.parse(options.input);
          } catch (error) {
            console.error(chalk.red('Invalid JSON input'));
            process.exit(1);
          }
        } else if (options.file) {
          const fs = require('fs-extra');
          const path = require('path');
          const filePath = path.resolve(options.file);
          
          if (!fs.existsSync(filePath)) {
            console.error(chalk.red(`File not found: ${options.file}`));
            process.exit(1);
          }
          
          const fileContent = await fs.readFile(filePath, 'utf-8');
          inputData = { source_code: fileContent, file_path: options.file };
        } else {
          // Interactive input
          const answers = await inquirer.prompt([
            {
              type: 'editor',
              name: 'input',
              message: 'Enter input data (JSON format):',
              default: '{\n  "source_code": "",\n  "context": {}\n}'
            }
          ]);
          
          try {
            inputData = JSON.parse(answers.input);
          } catch (error) {
            console.error(chalk.red('Invalid JSON input'));
            process.exit(1);
          }
        }

        console.log(chalk.blue(`\n🚀 Executing agent: ${agentId}`));
        console.log(chalk.gray('Input:'), JSON.stringify(inputData, null, 2));
        console.log(chalk.blue('\n⏳ Processing...\n'));

        const response = await agentService.executeAgent({
          agentId,
          input: inputData
        });

        if (response.success) {
          console.log(chalk.green('✅ Agent execution completed!\n'));
          
          if (response.data.analysis) {
            console.log(chalk.yellow('📊 Analysis:'));
            console.log(JSON.stringify(response.data.analysis, null, 2));
            console.log();
          }
          
          if (response.data.suggestions && response.data.suggestions.length > 0) {
            console.log(chalk.yellow('💡 Suggestions:'));
            response.data.suggestions.forEach((suggestion: string, index: number) => {
              console.log(`  ${index + 1}. ${suggestion}`);
            });
            console.log();
          }
          
          if (response.data.generated_code) {
            console.log(chalk.blue('🔧 Generated Code:'));
            console.log(chalk.gray(response.data.generated_code));
            console.log();
          }
          
          if (response.data.test_cases) {
            console.log(chalk.green('🧪 Generated Tests:'));
            console.log(chalk.gray(response.data.test_cases));
            console.log();
          }
          
          if (response.data.security_issues && response.data.security_issues.length > 0) {
            console.log(chalk.red('🔒 Security Issues:'));
            response.data.security_issues.forEach((issue: any, index: number) => {
              console.log(`  ${index + 1}. [${issue.severity}] ${issue.title}`);
              console.log(`     ${issue.description}`);
            });
            console.log();
          }

        } else {
          console.log(chalk.red('❌ Agent execution failed!'));
          console.error(chalk.red(`Error: ${response.error}`));
          process.exit(1);
        }

      } catch (error) {
        console.error(chalk.red(`Error executing agent: ${error}`));
        process.exit(1);
      }
    });

  return agentsCmd;
}