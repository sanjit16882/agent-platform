import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { configManager } from '../config';
import { agentService } from '../services/agentService';

export function createConfigCommand(): Command {
  const configCmd = new Command('config');
  configCmd.description('Manage AgentHub CLI configuration');

  // Set configuration
  configCmd
    .command('set')
    .description('Set configuration values')
    .option('--api-url <url>', 'Set AgentHub API URL')
    .option('--api-key <key>', 'Set API key for authentication')
    .option('--default-agent <id>', 'Set default agent ID')
    .action(async (options) => {
      try {
        if (options.apiUrl) {
          configManager.setApiUrl(options.apiUrl);
          console.log(chalk.green(`✅ API URL set to: ${options.apiUrl}`));
        }

        if (options.apiKey) {
          configManager.setApiKey(options.apiKey);
          console.log(chalk.green('✅ API key configured'));
        }

        if (options.defaultAgent) {
          configManager.setDefaultAgent(options.defaultAgent);
          console.log(chalk.green(`✅ Default agent set to: ${options.defaultAgent}`));
        }

        if (!options.apiUrl && !options.apiKey && !options.defaultAgent) {
          console.log(chalk.yellow('No configuration options provided. Use --help for available options.'));
        }

      } catch (error) {
        console.error(chalk.red(`Error: ${error}`));
        process.exit(1);
      }
    });

  // Get configuration
  configCmd
    .command('get')
    .description('Display current configuration')
    .action(() => {
      const config = configManager.getConfig();
      
      console.log(chalk.blue('\n🔧 Current Configuration:'));
      console.log(chalk.gray(`  API URL: ${config.apiUrl}`));
      console.log(chalk.gray(`  API Key: ${config.apiKey ? '***configured***' : 'not set'}`));
      console.log(chalk.gray(`  Default Agent: ${config.defaultAgent || 'not set'}`));
      console.log(chalk.gray(`  Timeout: ${config.timeout}ms`));
    });

  // Interactive setup
  configCmd
    .command('setup')
    .description('Interactive configuration setup')
    .action(async () => {
      console.log(chalk.blue('🚀 AgentHub CLI Setup\n'));
      
      const currentConfig = configManager.getConfig();
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'apiUrl',
          message: 'AgentHub API URL:',
          default: currentConfig.apiUrl,
          validate: (input) => {
            if (!input.trim()) return 'API URL is required';
            try {
              new URL(input);
              return true;
            } catch {
              return 'Please enter a valid URL';
            }
          }
        },
        {
          type: 'password',
          name: 'apiKey',
          message: 'API Key (optional):',
          mask: '*'
        },
        {
          type: 'input',
          name: 'defaultAgent',
          message: 'Default Agent ID (optional):',
          default: currentConfig.defaultAgent
        }
      ]);

      try {
        configManager.saveConfig({
          apiUrl: answers.apiUrl,
          ...(answers.apiKey && { apiKey: answers.apiKey }),
          ...(answers.defaultAgent && { defaultAgent: answers.defaultAgent })
        });

        console.log(chalk.green('\n✅ Configuration saved successfully!'));
        
        // Test connection
        console.log(chalk.blue('\n🔍 Testing connection...'));
        const isConnected = await agentService.testConnection();
        
        if (isConnected) {
          console.log(chalk.green('✅ Connection successful!'));
        } else {
          console.log(chalk.yellow('⚠️  Could not connect to AgentHub API. Please check your configuration.'));
        }

      } catch (error) {
        console.error(chalk.red(`Error saving configuration: ${error}`));
        process.exit(1);
      }
    });

  // Test connection
  configCmd
    .command('test')
    .description('Test connection to AgentHub API')
    .action(async () => {
      console.log(chalk.blue('🔍 Testing connection to AgentHub API...'));
      
      try {
        const isConnected = await agentService.testConnection();
        
        if (isConnected) {
          console.log(chalk.green('✅ Connection successful!'));
          
          // Try to fetch available agents
          const agents = await agentService.listAgents();
          if (agents.length > 0) {
            console.log(chalk.blue(`\n📋 Available agents (${agents.length}):`));
            agents.forEach(agent => {
              console.log(chalk.gray(`  • ${agent.id}: ${agent.name || 'No description'}`));
            });
          } else {
            console.log(chalk.yellow('\n⚠️  No agents found. Make sure agents are deployed on the platform.'));
          }
          
        } else {
          console.log(chalk.red('❌ Connection failed!'));
          console.log(chalk.yellow('\nTroubleshooting:'));
          console.log(chalk.gray('  1. Check if the API URL is correct'));
          console.log(chalk.gray('  2. Verify the API key (if required)'));
          console.log(chalk.gray('  3. Ensure the AgentHub server is running'));
          console.log(chalk.gray('  4. Check network connectivity'));
          process.exit(1);
        }

      } catch (error) {
        console.error(chalk.red(`Connection test failed: ${error}`));
        process.exit(1);
      }
    });

  return configCmd;
}