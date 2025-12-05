import chalk from 'chalk';
import { table } from 'table';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { apiClient } from '../api/client';

export async function listTests(options: any) {
  try {
    console.log(chalk.blue('Fetching tests...'));
    
    const params: any = {};
    if (options.category) params.category = options.category;
    if (options.tags) params.tags = options.tags;
    if (options.agentType) params.agentType = options.agentType;

    const data = await apiClient.listTests(params);
    
    if (!data.tests || data.tests.length === 0) {
      console.log(chalk.yellow('\nNo tests found.'));
      return;
    }

    console.log(chalk.green(`\nFound ${data.total} test(s):\n`));

    const tableData = [
      [
        chalk.bold('ID'),
        chalk.bold('Name'),
        chalk.bold('Category'),
        chalk.bold('Input Format'),
        chalk.bold('Output Type')
      ],
      ...data.tests.map((test: any) => [
        test.id,
        test.name,
        test.category,
        test.input_format,
        test.expected_output_type
      ])
    ];

    console.log(table(tableData));
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

export async function createTest(options: any) {
  try {
    let testData: any;

    if (options.file) {
      // Load from file
      const fileContent = fs.readFileSync(options.file, 'utf-8');
      const ext = options.file.split('.').pop();
      
      if (ext === 'yaml' || ext === 'yml') {
        testData = yaml.parse(fileContent);
      } else {
        testData = JSON.parse(fileContent);
      }
    } else {
      // Build from options
      testData = {
        name: options.name,
        category: options.category,
        description: options.description || '',
        input_format: options.inputFormat || 'plain_text',
        expected_output_type: options.outputType || 'text',
        scoring_criteria: {
          accuracy: 0.5,
          completeness: 0.5
        }
      };
    }

    console.log(chalk.blue('Creating test...'));
    const result = await apiClient.createTest(testData);

    console.log(chalk.green('\n✓ Test created successfully!'));
    console.log(chalk.gray('Test ID:'), result.test.id);
    console.log(chalk.gray('Name:'), result.test.name);
    console.log(chalk.gray('Created:'), result.test.created_at);
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

export async function showTest(testId: string) {
  try {
    console.log(chalk.blue('Fetching test details...'));
    const test = await apiClient.getTest(testId);

    console.log(chalk.green('\nTest Details:\n'));
    console.log(chalk.bold('ID:'), test.id);
    console.log(chalk.bold('Name:'), test.name);
    console.log(chalk.bold('Category:'), test.category);
    console.log(chalk.bold('Description:'), test.description || 'N/A');
    console.log(chalk.bold('Input Format:'), test.input_format);
    console.log(chalk.bold('Output Type:'), test.expected_output_type);
    
    console.log(chalk.bold('\nScoring Criteria:'));
    Object.entries(test.scoring_criteria).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    if (test.sample_prompts && test.sample_prompts.length > 0) {
      console.log(chalk.bold('\nSample Prompts:'));
      test.sample_prompts.forEach((prompt: string, index: number) => {
        console.log(`  ${index + 1}. ${prompt}`);
      });
    }
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

export async function deleteTest(testId: string, options: any) {
  try {
    if (!options.yes) {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to delete test '${testId}'?`,
          default: false
        }
      ]);

      if (!answers.confirm) {
        console.log(chalk.yellow('Cancelled.'));
        return;
      }
    }

    console.log(chalk.blue('Deleting test...'));
    await apiClient.deleteTest(testId);

    console.log(chalk.green('\n✓ Test deleted successfully!'));
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}
