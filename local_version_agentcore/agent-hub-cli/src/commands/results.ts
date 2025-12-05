import chalk from 'chalk';
import { table } from 'table';
import * as fs from 'fs';
import { apiClient } from '../api/client';

export async function showResults(runId: string, options: any) {
  try {
    console.log(chalk.blue('Fetching results...'));
    const results = await apiClient.getExecutionStatus(runId);

    console.log(chalk.green('\nTest Run Results:\n'));
    console.log(chalk.bold('Run ID:'), results.runId);
    console.log(chalk.bold('Agent:'), results.agentId);
    console.log(chalk.bold('Status:'), results.status);
    console.log(chalk.bold('Start Time:'), new Date(results.startTime).toLocaleString());
    if (results.endTime) {
      console.log(chalk.bold('End Time:'), new Date(results.endTime).toLocaleString());
      const duration = (new Date(results.endTime).getTime() - new Date(results.startTime).getTime()) / 1000;
      console.log(chalk.bold('Duration:'), `${duration.toFixed(1)}s`);
    }

    console.log(chalk.bold('\nSummary:'));
    console.log(chalk.gray('Total Tests:'), results.totalTests);
    console.log(chalk.gray('Passed:'), chalk.green(results.passedTests));
    console.log(chalk.gray('Failed:'), chalk.red(results.totalTests - results.passedTests));
    console.log(chalk.gray('Pass Rate:'), `${results.passRate.toFixed(1)}%`);
    console.log(chalk.gray('Average Score:'), results.averageScore.toFixed(1));

    if (options.detailed) {
      console.log(chalk.bold('\nDetailed Results:\n'));
      
      results.results.forEach((result: any, index: number) => {
        const status = result.passed ? chalk.green('✓ PASS') : chalk.red('✗ FAIL');
        console.log(`${index + 1}. ${status} ${result.testName}`);
        console.log(chalk.gray('   Test ID:'), result.testId);
        console.log(chalk.gray('   Score:'), result.score);
        console.log(chalk.gray('   Latency:'), `${result.latency}ms`);
        console.log(chalk.gray('   Cost:'), `$${result.cost.toFixed(4)}`);
        
        if (result.scoreBreakdown) {
          console.log(chalk.gray('   Score Breakdown:'));
          Object.entries(result.scoreBreakdown).forEach(([key, value]) => {
            console.log(chalk.gray(`     ${key}:`), value);
          });
        }
        
        console.log(chalk.gray('   Output:'), result.output.substring(0, 100) + (result.output.length > 100 ? '...' : ''));
        console.log('');
      });
    } else {
      const tableData = [
        [
          chalk.bold('Test Name'),
          chalk.bold('Status'),
          chalk.bold('Score'),
          chalk.bold('Latency'),
          chalk.bold('Cost')
        ],
        ...results.results.map((result: any) => [
          result.testName,
          result.passed ? chalk.green('✓ PASS') : chalk.red('✗ FAIL'),
          result.score,
          `${result.latency}ms`,
          `$${result.cost.toFixed(4)}`
        ])
      ];

      console.log(table(tableData));
    }

    // Export if requested
    if (options.export && options.output) {
      const content = options.export === 'json' 
        ? JSON.stringify(results, null, 2)
        : generateCSV(results);
      
      fs.writeFileSync(options.output, content);
      console.log(chalk.green(`\n✓ Results exported to ${options.output}`));
    }
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

export async function listRuns(options: any) {
  try {
    console.log(chalk.blue('Fetching test runs...'));
    
    const params: any = {
      limit: options.limit
    };
    if (options.agent) params.agentId = options.agent;
    if (options.status) params.status = options.status;
    if (options.startDate) params.startDate = options.startDate;
    if (options.endDate) params.endDate = options.endDate;

    const data = await apiClient.listRuns(params);
    
    if (!data.runs || data.runs.length === 0) {
      console.log(chalk.yellow('\nNo test runs found.'));
      return;
    }

    console.log(chalk.green(`\nFound ${data.runs.length} test run(s):\n`));

    const tableData = [
      [
        chalk.bold('Run ID'),
        chalk.bold('Agent'),
        chalk.bold('Status'),
        chalk.bold('Tests'),
        chalk.bold('Pass Rate'),
        chalk.bold('Score'),
        chalk.bold('Start Time')
      ],
      ...data.runs.map((run: any) => [
        run.runId.substring(0, 12) + '...',
        run.agentName || run.agentId,
        run.status,
        `${run.passedTests}/${run.totalTests}`,
        `${run.passRate.toFixed(1)}%`,
        run.averageScore.toFixed(1),
        new Date(run.startTime).toLocaleString()
      ])
    ];

    console.log(table(tableData));
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

function generateCSV(results: any): string {
  const headers = ['Test Name', 'Passed', 'Score', 'Latency (ms)', 'Cost ($)', 'Output'];
  const rows = results.results.map((result: any) => [
    result.testName,
    result.passed ? 'Yes' : 'No',
    result.score,
    result.latency,
    result.cost.toFixed(4),
    result.output.replace(/"/g, '""') // Escape quotes
  ]);

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}
