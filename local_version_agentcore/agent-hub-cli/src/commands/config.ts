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

  // Validate test case files (Task 9.2)
  configCmd
    .command('validate [path]')
    .description('Validate test case YAML/JSON files')
    .option('--recursive', 'Validate all files in directory recursively', false)
    .action(async (path, options) => {
      const fs = await import('fs-extra');
      const pathModule = await import('path');
      const yaml = await import('yaml');

      console.log(chalk.blue('🔍 Validating Test Case Files\n'));

      try {
        const targetPath = path || process.cwd();
        const files = await findTestFiles(targetPath, options.recursive);

        if (files.length === 0) {
          console.log(chalk.yellow('No test case files found.'));
          console.log(chalk.gray('\nLooking for files matching:'));
          console.log(chalk.gray('  • *.test.yaml'));
          console.log(chalk.gray('  • *.test.json'));
          console.log(chalk.gray('  • test-*.yaml'));
          console.log(chalk.gray('  • test-*.json'));
          return;
        }

        console.log(chalk.gray(`Found ${files.length} test file(s)\n`));

        let validCount = 0;
        let invalidCount = 0;
        const errors: any[] = [];

        for (const file of files) {
          const relativePath = pathModule.relative(process.cwd(), file);
          process.stdout.write(chalk.gray(`  Validating ${relativePath}... `));

          try {
            const content = await fs.readFile(file, 'utf-8');
            const ext = pathModule.extname(file);

            let testData: any;
            if (ext === '.yaml' || ext === '.yml') {
              testData = yaml.parse(content);
            } else if (ext === '.json') {
              testData = JSON.parse(content);
            } else {
              throw new Error('Unsupported file format');
            }

            // Validate schema
            const validation = validateTestCaseSchema(testData);
            
            if (validation.valid) {
              console.log(chalk.green('✓'));
              validCount++;
            } else {
              console.log(chalk.red('✗'));
              invalidCount++;
              errors.push({
                file: relativePath,
                errors: validation.errors
              });
            }

          } catch (error: any) {
            console.log(chalk.red('✗'));
            invalidCount++;
            errors.push({
              file: relativePath,
              errors: [error.message]
            });
          }
        }

        console.log();
        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.bold('Validation Summary:'));
        console.log(chalk.green(`  ✓ Valid:   ${validCount}`));
        console.log(chalk.red(`  ✗ Invalid: ${invalidCount}`));
        console.log();

        if (errors.length > 0) {
          console.log(chalk.bold.red('Validation Errors:\n'));
          errors.forEach(({ file, errors: fileErrors }) => {
            console.log(chalk.red(`  ${file}:`));
            fileErrors.forEach((err: string) => {
              console.log(chalk.gray(`    • ${err}`));
            });
            console.log();
          });

          process.exit(1);
        } else {
          console.log(chalk.green.bold('✅ All test files are valid!'));
        }

      } catch (error: any) {
        console.error(chalk.red(`Validation failed: ${error.message}`));
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

/**
 * Find test case files in a directory
 */
async function findTestFiles(targetPath: string, recursive: boolean): Promise<string[]> {
  const fs = await import('fs-extra');
  const path = await import('path');
  const files: string[] = [];

  async function scan(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && recursive) {
        await scan(fullPath);
      } else if (entry.isFile()) {
        const name = entry.name;
        if (
          name.endsWith('.test.yaml') ||
          name.endsWith('.test.yml') ||
          name.endsWith('.test.json') ||
          name.startsWith('test-') && (name.endsWith('.yaml') || name.endsWith('.yml') || name.endsWith('.json'))
        ) {
          files.push(fullPath);
        }
      }
    }
  }

  const stats = await fs.stat(targetPath);
  if (stats.isDirectory()) {
    await scan(targetPath);
  } else if (stats.isFile()) {
    files.push(targetPath);
  }

  return files;
}

/**
 * Validate test case schema
 */
function validateTestCaseSchema(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required top-level fields
  if (!data.version) {
    errors.push('Missing required field: version');
  }

  if (!data.suite_type) {
    errors.push('Missing required field: suite_type');
  } else if (!['universal', 'custom'].includes(data.suite_type)) {
    errors.push('suite_type must be "universal" or "custom"');
  }

  if (!data.tests || !Array.isArray(data.tests)) {
    errors.push('Missing or invalid field: tests (must be an array)');
  } else {
    // Validate each test case
    data.tests.forEach((test: any, index: number) => {
      const testPrefix = `Test ${index + 1}`;

      if (!test.name) {
        errors.push(`${testPrefix}: Missing required field: name`);
      }

      if (!test.id) {
        errors.push(`${testPrefix}: Missing required field: id`);
      }

      if (!test.input) {
        errors.push(`${testPrefix}: Missing required field: input`);
      } else {
        if (!test.input.type) {
          errors.push(`${testPrefix}: Missing required field: input.type`);
        }
        if (!test.input.content) {
          errors.push(`${testPrefix}: Missing required field: input.content`);
        }
      }

      // expected_output is optional but if present, validate structure
      if (test.expected_output) {
        const hasValidation = 
          test.expected_output.contains ||
          test.expected_output.not_contains ||
          test.expected_output.exact_match ||
          test.expected_output.pattern ||
          test.expected_output.not_empty !== undefined ||
          test.expected_output.error_expected !== undefined;

        if (!hasValidation) {
          errors.push(`${testPrefix}: expected_output must have at least one validation rule`);
        }
      }

      // Validate metadata if present
      if (test.metadata) {
        if (test.metadata.priority && !['critical', 'high', 'medium', 'low'].includes(test.metadata.priority)) {
          errors.push(`${testPrefix}: metadata.priority must be one of: critical, high, medium, low`);
        }

        if (test.metadata.tags && !Array.isArray(test.metadata.tags)) {
          errors.push(`${testPrefix}: metadata.tags must be an array`);
        }
      }

      // Validate validation rules if present
      if (test.validation) {
        if (test.validation.tolerance !== undefined) {
          if (typeof test.validation.tolerance !== 'number' || test.validation.tolerance < 0 || test.validation.tolerance > 1) {
            errors.push(`${testPrefix}: validation.tolerance must be a number between 0 and 1`);
          }
        }

        if (test.validation.max_duration !== undefined && typeof test.validation.max_duration !== 'number') {
          errors.push(`${testPrefix}: validation.max_duration must be a number`);
        }

        if (test.validation.max_tokens !== undefined && typeof test.validation.max_tokens !== 'number') {
          errors.push(`${testPrefix}: validation.max_tokens must be a number`);
        }
      }
    });
  }

  // Custom suite specific validation
  if (data.suite_type === 'custom' && !data.agent) {
    errors.push('Custom test suites must specify an agent field');
  }

  // Universal suite specific validation
  if (data.suite_type === 'universal' && data.agent) {
    errors.push('Universal test suites should not specify an agent field');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}