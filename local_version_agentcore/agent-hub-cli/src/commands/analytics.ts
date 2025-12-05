import chalk from 'chalk';
import { table } from 'table';
import * as fs from 'fs';
import { apiClient } from '../api/client';

export async function showAnalytics(options: any) {
  try {
    console.log(chalk.blue('Fetching analytics...'));
    
    const params: any = {
      days: options.days
    };
    if (options.agent) params.agentId = options.agent;

    const analytics = await apiClient.getAnalytics(params);

    console.log(chalk.green('\nAnalytics Summary:\n'));
    console.log(chalk.bold('Time Period:'), `Last ${options.days} days`);
    if (options.agent) {
      console.log(chalk.bold('Agent:'), options.agent);
    }

    console.log(chalk.bold('\nOverall Metrics:'));
    console.log(chalk.gray('Total Tests:'), analytics.totalTests);
    console.log(chalk.gray('Total Runs:'), analytics.totalRuns);
    console.log(chalk.gray('Average Pass Rate:'), `${analytics.averagePassRate.toFixed(1)}%`);
    console.log(chalk.gray('Average Score:'), analytics.averageScore.toFixed(1));
    console.log(chalk.gray('Total Cost:'), `$${analytics.totalCost.toFixed(2)}`);

    // Category Performance
    if (analytics.categoryPerformance && analytics.categoryPerformance.length > 0) {
      console.log(chalk.bold('\nCategory Performance:\n'));
      
      const tableData = [
        [
          chalk.bold('Category'),
          chalk.bold('Pass Rate'),
          chalk.bold('Tests'),
          chalk.bold('Avg Score')
        ],
        ...analytics.categoryPerformance.map((cat: any) => [
          cat.category,
          `${cat.passRate.toFixed(1)}%`,
          cat.count,
          cat.avgScore.toFixed(1)
        ])
      ];

      console.log(table(tableData));
    }

    // Pass Rate Trend
    if (analytics.passRateTrend && analytics.passRateTrend.length > 0) {
      console.log(chalk.bold('Pass Rate Trend:\n'));
      
      analytics.passRateTrend.slice(-7).forEach((trend: any) => {
        const bar = generateBar(trend.passRate, 50);
        console.log(`${trend.date.padEnd(12)} ${bar} ${trend.passRate.toFixed(1)}% (${trend.runs} run${trend.runs > 1 ? 's' : ''})`);
      });
    }

    // Export if requested
    if (options.export && options.output) {
      const content = options.export === 'json' 
        ? JSON.stringify(analytics, null, 2)
        : generateAnalyticsCSV(analytics);
      
      fs.writeFileSync(options.output, content);
      console.log(chalk.green(`\n✓ Analytics exported to ${options.output}`));
    }
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

function generateBar(percentage: number, maxLength: number): string {
  const filledLength = Math.round((percentage / 100) * maxLength);
  const emptyLength = maxLength - filledLength;
  
  const color = percentage >= 80 ? chalk.green : percentage >= 60 ? chalk.yellow : chalk.red;
  
  return color('█'.repeat(filledLength)) + chalk.gray('░'.repeat(emptyLength));
}

function generateAnalyticsCSV(analytics: any): string {
  const lines: string[] = [];
  
  // Overall metrics
  lines.push('Metric,Value');
  lines.push(`Total Tests,${analytics.totalTests}`);
  lines.push(`Total Runs,${analytics.totalRuns}`);
  lines.push(`Average Pass Rate,${analytics.averagePassRate.toFixed(1)}%`);
  lines.push(`Average Score,${analytics.averageScore.toFixed(1)}`);
  lines.push(`Total Cost,$${analytics.totalCost.toFixed(2)}`);
  lines.push('');
  
  // Category performance
  if (analytics.categoryPerformance && analytics.categoryPerformance.length > 0) {
    lines.push('Category Performance');
    lines.push('Category,Pass Rate,Tests,Avg Score');
    analytics.categoryPerformance.forEach((cat: any) => {
      lines.push(`${cat.category},${cat.passRate.toFixed(1)}%,${cat.count},${cat.avgScore.toFixed(1)}`);
    });
    lines.push('');
  }
  
  // Pass rate trend
  if (analytics.passRateTrend && analytics.passRateTrend.length > 0) {
    lines.push('Pass Rate Trend');
    lines.push('Date,Pass Rate,Runs');
    analytics.passRateTrend.forEach((trend: any) => {
      lines.push(`${trend.date},${trend.passRate.toFixed(1)}%,${trend.runs}`);
    });
  }
  
  return lines.join('\n');
}
