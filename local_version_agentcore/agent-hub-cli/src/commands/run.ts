import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { apiClient } from '../api/client';

export async function runTests(options: any) {
  try {
    let executionData: any;

    if (options.suite) {
      // Load from suite file
      const suiteContent = fs.readFileSync(options.suite, 'utf-8');
      const suite = yaml.parse(suiteContent);
      
      executionData = {
        agentId: suite.agent,
        modelIds: suite.models,
        testIds: suite.tests.map((t: any) => t.id),
        inputs: suite.tests.reduce((acc: any, test: any) => {
          acc[test.id] = test.input;
          return acc;
        }, {}),
        knowledgeConfig: suite.knowledgeConfig || {}
      };
    } else {
      // Build from options
      executionData = {
        agentId: options.agent,
        modelIds: options.models.split(','),
        testIds: options.tests ? options.tests.split(',') : undefined,
        category: options.category,
        inputs: {},
        knowledgeConfig: {
          vectorDB: {
            enabled: options.vectorDb || false,
            knowledgeBases: options.knowledgeBases ? options.knowledgeBases.split(',') : [],
            retrievalConfig: {
              topK: 5,
              minSimilarity: 0.7
            }
          },
          mcp: {
            enabled: options.mcp || false,
            selectedServers: options.mcpServers ? options.mcpServers.split(',') : []
          }
        }
      };

      // Load inputs from file if provided
      if (options.inputFile) {
        const inputContent = fs.readFileSync(options.inputFile, 'utf-8');
        const ext = options.inputFile.split('.').pop();
        
        if (ext === 'yaml' || ext === 'yml') {
          executionData.inputs = yaml.parse(inputContent);
        } else {
          executionData.inputs = JSON.parse(inputContent);
        }
      }
    }

    const spinner = ora('Starting test execution...').start();

    const result = await apiClient.executeTests(executionData);
    
    spinner.succeed(chalk.green('Test execution started!'));
    console.log(chalk.gray('Run ID:'), result.runId);
    console.log(chalk.gray('Status:'), result.status);
    console.log(chalk.gray('Estimated time:'), `${result.estimatedTime}s`);

    if (options.watch || options.ciMode) {
      await watchRun(result.runId, options);
    } else {
      console.log(chalk.blue(`\nUse 'agent-test watch ${result.runId}' to monitor progress`));
      console.log(chalk.blue(`Use 'agent-test results ${result.runId}' to view results`));
    }
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

export async function watchRun(runId: string, options: any = {}) {
  const spinner = ora('Waiting for test completion...').start();

  try {
    const results = await apiClient.waitForCompletion(runId, {
      timeout: 300000, // 5 minutes
      pollInterval: 2000 // 2 seconds
    });

    spinner.stop();

    if (results.status === 'completed') {
      console.log(chalk.green('\n✓ Test execution completed!\n'));
      
      // Display summary
      console.log(chalk.bold('Summary:'));
      console.log(chalk.gray('Total Tests:'), results.totalTests);
      console.log(chalk.gray('Passed:'), chalk.green(results.passedTests));
      console.log(chalk.gray('Failed:'), chalk.red(results.totalTests - results.passedTests));
      console.log(chalk.gray('Pass Rate:'), `${results.passRate.toFixed(1)}%`);
      console.log(chalk.gray('Average Score:'), results.averageScore.toFixed(1));
      console.log(chalk.gray('Total Cost:'), `$${(results.results.reduce((sum: number, r: any) => sum + (r.cost || 0), 0)).toFixed(4)}`);

      // Display individual results
      console.log(chalk.bold('\nTest Results:'));
      results.results.forEach((result: any) => {
        const status = result.passed ? chalk.green('✓ PASS') : chalk.red('✗ FAIL');
        console.log(`\n${status} ${result.testName}`);
        console.log(chalk.gray('  Score:'), result.score);
        console.log(chalk.gray('  Latency:'), `${result.latency}ms`);
        console.log(chalk.gray('  Cost:'), `$${result.cost.toFixed(4)}`);
      });

      // Export report if requested
      if (options.report && options.output) {
        await exportReport(results, options.report, options.output);
      }

      // CI mode: exit with appropriate code
      if (options.ciMode) {
        const threshold = parseFloat(options.failThreshold);
        if (results.passRate < threshold) {
          console.log(chalk.red(`\n✗ Pass rate ${results.passRate.toFixed(1)}% is below threshold ${threshold}%`));
          process.exit(1);
        } else {
          console.log(chalk.green(`\n✓ Pass rate ${results.passRate.toFixed(1)}% meets threshold ${threshold}%`));
          process.exit(0);
        }
      }
    } else {
      console.log(chalk.red('\n✗ Test execution failed!'));
      console.log(chalk.gray('Status:'), results.status);
      
      if (options.ciMode) {
        process.exit(1);
      }
    }
  } catch (error: any) {
    spinner.fail(chalk.red('Error during test execution'));
    console.error(chalk.red('Error:'), error.message);
    
    if (options.ciMode) {
      process.exit(1);
    }
  }
}

async function exportReport(results: any, format: string, outputFile: string) {
  try {
    let content: string;

    if (format === 'junit') {
      content = generateJUnitReport(results);
    } else if (format === 'json') {
      content = JSON.stringify(results, null, 2);
    } else if (format === 'csv') {
      content = generateCSVReport(results);
    } else {
      throw new Error(`Unsupported report format: ${format}`);
    }

    fs.writeFileSync(outputFile, content);
    console.log(chalk.green(`\n✓ Report exported to ${outputFile}`));
  } catch (error: any) {
    console.error(chalk.red('Error exporting report:'), error.message);
  }
}

function generateJUnitReport(results: any): string {
  const testCases = results.results.map((result: any) => {
    const failure = result.passed ? '' : `
      <failure message="Test failed with score ${result.score}">
        Output: ${result.output}
      </failure>`;
    
    return `
    <testcase name="${result.testName}" classname="${results.agentId}" time="${result.latency / 1000}">
      ${failure}
    </testcase>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Agent Tests" tests="${results.totalTests}" failures="${results.totalTests - results.passedTests}" time="${results.results.reduce((sum: number, r: any) => sum + r.latency, 0) / 1000}">
    ${testCases}
  </testsuite>
</testsuites>`;
}

function generateCSVReport(results: any): string {
  const headers = ['Test Name', 'Passed', 'Score', 'Latency (ms)', 'Cost ($)'];
  const rows = results.results.map((result: any) => [
    result.testName,
    result.passed ? 'Yes' : 'No',
    result.score,
    result.latency,
    result.cost.toFixed(4)
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
