/**
 * Test Command
 * 
 * CLI command for running agent tests
 * Implements Task 8: CLI Core Commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import { configManager } from '../config';

export function createTestCommand(): Command {
  const testCmd = new Command('test');

  testCmd
    .description('Run tests for AI agents')
    .option('--agent <agentId>', 'Agent ID to test')
    .option('--case <testCaseId>', 'Specific test case ID to run')
    .option('--suite <suiteType>', 'Test suite type (universal, custom, or suite name)')
    .option('--sandbox', 'Run in sandbox mode', false)
    .option('--parallel', 'Run tests in parallel', false)
    .option('--timeout <ms>', 'Test timeout in milliseconds', '30000')
    .option('--format <type>', 'Output format (console, json, junit)', 'console')
    .option('--output <file>', 'Output file for results')
    .option('--list', 'List available agents and test suites')
    .option('--report [runId]', 'Generate detailed report for a test run (optionally specify run ID)')
    .action(async (options) => {
      try {
        // Handle --list flag
        if (options.list) {
          await handleListCommand(options);
          return;
        }

        // Handle --report flag
        if (options.report !== undefined) {
          await handleReportCommand(options);
          return;
        }

        // Validate required options
        if (!options.agent) {
          console.error(chalk.red('Error: --agent is required'));
          console.log(chalk.gray('Usage: agent test --agent <agentId>'));
          console.log(chalk.gray('       agent test --list  # List available agents'));
          console.log(chalk.gray('       agent test --report [runId]  # Generate report'));
          process.exit(1);
        }

        // Run tests
        await runTests(options);

      } catch (error: any) {
        console.error(chalk.red(`Test execution failed: ${error.message}`));
        if (options.verbose) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    });

  return testCmd;
}

/**
 * Run tests for an agent
 */
async function runTests(options: any) {
  const config = configManager.getConfig();
  const apiUrl = config.apiUrl || 'http://localhost:4002';

  console.log(chalk.blue('🧪 Running Agent Tests\n'));
  console.log(chalk.gray(`Agent: ${options.agent}`));
  if (options.suite) {
    console.log(chalk.gray(`Suite: ${options.suite}`));
  }
  if (options.case) {
    console.log(chalk.gray(`Test Case: ${options.case}`));
  }
  console.log(chalk.gray(`Mode: ${options.sandbox ? 'Sandbox' : 'Production'}`));
  console.log();

  const spinner = ora('Initializing test run...').start();

  try {
    // Prepare test configuration
    const testConfig = {
      suiteIds: options.suite ? [options.suite] : null,
      testCaseIds: options.case ? [options.case] : null,
      parallel: options.parallel,
      timeout: parseInt(options.timeout),
      sandbox: options.sandbox,
      mode: 'demo' // Default to demo mode for now
    };

    spinner.text = 'Starting test execution...';

    // Call backend API
    const response = await axios.post(
      `${apiUrl}/api/testing/run`,
      {
        agentId: options.agent,
        config: testConfig
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: parseInt(options.timeout) + 5000 // Add buffer
      }
    );

    spinner.succeed('Test execution completed');

    const result = response.data;

    // Format and display results
    if (options.format === 'json') {
      await outputJSON(result, options.output);
    } else if (options.format === 'junit') {
      await outputJUnit(result, options.output);
    } else {
      displayConsoleResults(result);
    }

    // Exit with appropriate code
    const exitCode = result.summary.failed > 0 || result.summary.errors > 0 ? 1 : 0;
    process.exit(exitCode);

  } catch (error: any) {
    spinner.fail('Test execution failed');

    if (error.response) {
      console.error(chalk.red(`API Error: ${error.response.status} ${error.response.statusText}`));
      if (error.response.data) {
        console.error(chalk.gray(JSON.stringify(error.response.data, null, 2)));
      }
    } else if (error.request) {
      console.error(chalk.red('Network Error: Could not connect to backend'));
      console.error(chalk.gray(`API URL: ${apiUrl}`));
      console.error(chalk.yellow('\nTroubleshooting:'));
      console.error(chalk.gray('  1. Check if backend is running'));
      console.error(chalk.gray('  2. Verify API URL: agent config setup'));
      console.error(chalk.gray('  3. Check network connectivity'));
    } else {
      console.error(chalk.red(`Error: ${error.message}`));
    }

    throw error;
  }
}

/**
 * Display test results in console format
 */
function displayConsoleResults(result: any) {
  const { summary, results } = result;

  console.log();
  console.log(chalk.bold('📊 Test Results Summary'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log();

  // Summary statistics
  console.log(chalk.bold('Overall:'));
  console.log(`  Total Tests:    ${summary.totalTests}`);
  console.log(chalk.green(`  ✓ Passed:       ${summary.passed}`));
  console.log(chalk.red(`  ✗ Failed:       ${summary.failed}`));
  if (summary.errors > 0) {
    console.log(chalk.red(`  ⚠ Errors:        ${summary.errors}`));
  }
  if (summary.skipped > 0) {
    console.log(chalk.yellow(`  ○ Skipped:      ${summary.skipped}`));
  }
  console.log(`  Pass Rate:      ${summary.passRate.toFixed(1)}%`);
  console.log(`  Duration:       ${summary.totalDuration}ms (avg: ${summary.avgDuration.toFixed(0)}ms)`);
  console.log();

  // Universal vs Custom breakdown
  if (summary.universalTests && summary.universalTests.total > 0) {
    console.log(chalk.bold('Universal Tests:'));
    console.log(`  Total:          ${summary.universalTests.total}`);
    console.log(chalk.green(`  ✓ Passed:       ${summary.universalTests.passed}`));
    console.log(chalk.red(`  ✗ Failed:       ${summary.universalTests.failed}`));
    console.log(`  Pass Rate:      ${summary.universalTests.passRate.toFixed(1)}%`);
    console.log();
  }

  if (summary.customTests && summary.customTests.total > 0) {
    console.log(chalk.bold('Custom Tests:'));
    console.log(`  Total:          ${summary.customTests.total}`);
    console.log(chalk.green(`  ✓ Passed:       ${summary.customTests.passed}`));
    console.log(chalk.red(`  ✗ Failed:       ${summary.customTests.failed}`));
    console.log(`  Pass Rate:      ${summary.customTests.passRate.toFixed(1)}%`);
    console.log();
  }

  // Detailed results
  if (results && results.length > 0) {
    console.log(chalk.bold('Detailed Results:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();

    results.forEach((test: any, index: number) => {
      const statusIcon = test.status === 'passed' ? chalk.green('✓') :
                        test.status === 'failed' ? chalk.red('✗') :
                        test.status === 'error' ? chalk.red('⚠') :
                        chalk.yellow('○');

      const statusColor = test.status === 'passed' ? chalk.green :
                         test.status === 'failed' ? chalk.red :
                         test.status === 'error' ? chalk.red :
                         chalk.yellow;

      console.log(`${statusIcon} ${test.test_case_name}`);
      console.log(chalk.gray(`  Suite: ${test.suite_name || 'Unknown'} (${test.suite_type || 'unknown'})`));
      console.log(chalk.gray(`  Duration: ${test.duration}ms`));

      if (test.status === 'failed' && test.evaluation) {
        console.log(statusColor(`  Reason: ${test.evaluation.details}`));
        if (test.evaluation.score !== undefined) {
          console.log(chalk.gray(`  Score: ${test.evaluation.score.toFixed(1)}/100`));
        }
      }

      if (test.status === 'error' && test.error) {
        console.log(chalk.red(`  Error: ${test.error.message}`));
      }

      console.log();
    });
  }

  // Final status
  console.log(chalk.gray('─'.repeat(50)));
  if (summary.failed === 0 && summary.errors === 0) {
    console.log(chalk.green.bold('✅ All tests passed!'));
  } else {
    console.log(chalk.red.bold(`❌ ${summary.failed + summary.errors} test(s) failed`));
  }
  console.log();
}

/**
 * Output results in JSON format
 */
async function outputJSON(result: any, outputFile?: string) {
  const json = JSON.stringify(result, null, 2);

  if (outputFile) {
    const fs = await import('fs-extra');
    await fs.writeFile(outputFile, json);
    console.log(chalk.green(`✓ Results saved to ${outputFile}`));
  } else {
    console.log(json);
  }
}

/**
 * Output results in JUnit XML format
 */
async function outputJUnit(result: any, outputFile?: string) {
  const { summary, results, agentId, startTime, endTime } = result;

  // Build JUnit XML
  const testSuites = groupResultsBySuite(results);
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<testsuites name="Agent Tests" tests="${summary.totalTests}" failures="${summary.failed}" errors="${summary.errors}" time="${(summary.totalDuration / 1000).toFixed(3)}">\n`;

  Object.entries(testSuites).forEach(([suiteName, tests]: [string, any]) => {
    const suiteTests = tests as any[];
    const suiteFailed = suiteTests.filter((t: any) => t.status === 'failed').length;
    const suiteErrors = suiteTests.filter((t: any) => t.status === 'error').length;
    const suiteDuration = suiteTests.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);

    xml += `  <testsuite name="${escapeXml(suiteName)}" tests="${suiteTests.length}" failures="${suiteFailed}" errors="${suiteErrors}" time="${(suiteDuration / 1000).toFixed(3)}">\n`;

    suiteTests.forEach((test: any) => {
      xml += `    <testcase name="${escapeXml(test.test_case_name)}" classname="${escapeXml(suiteName)}" time="${(test.duration / 1000).toFixed(3)}">\n`;

      if (test.status === 'failed') {
        xml += `      <failure message="${escapeXml(test.evaluation?.details || 'Test failed')}">\n`;
        xml += `        ${escapeXml(JSON.stringify(test.evaluation, null, 2))}\n`;
        xml += `      </failure>\n`;
      } else if (test.status === 'error') {
        xml += `      <error message="${escapeXml(test.error?.message || 'Test error')}">\n`;
        xml += `        ${escapeXml(test.error?.stack || '')}\n`;
        xml += `      </error>\n`;
      } else if (test.status === 'skipped') {
        xml += `      <skipped/>\n`;
      }

      xml += `    </testcase>\n`;
    });

    xml += `  </testsuite>\n`;
  });

  xml += `</testsuites>\n`;

  if (outputFile) {
    const fs = await import('fs-extra');
    await fs.writeFile(outputFile, xml);
    console.log(chalk.green(`✓ JUnit XML saved to ${outputFile}`));
  } else {
    console.log(xml);
  }
}

/**
 * Group test results by suite
 */
function groupResultsBySuite(results: any[]): Record<string, any[]> {
  const suites: Record<string, any[]> = {};

  results.forEach(result => {
    const suiteName = result.suite_name || 'Unknown Suite';
    if (!suites[suiteName]) {
      suites[suiteName] = [];
    }
    suites[suiteName].push(result);
  });

  return suites;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Handle --list command
 */
async function handleListCommand(options: any) {
  const config = configManager.getConfig();
  const apiUrl = config.apiUrl || 'http://localhost:4002';

  console.log(chalk.blue('📋 Available Agents and Test Suites\n'));

  const spinner = ora('Fetching data...').start();

  try {
    // Fetch agents
    const agentsResponse = await axios.get(`${apiUrl}/api/testing/agents`);
    const agents = agentsResponse.data;

    // Fetch test suites
    const suitesResponse = await axios.get(`${apiUrl}/api/testing/suites`);
    const suites = suitesResponse.data;

    spinner.succeed('Data fetched');
    console.log();

    // Display agents
    console.log(chalk.bold('Agents:'));
    console.log(chalk.gray('─'.repeat(50)));
    if (agents && agents.length > 0) {
      agents.forEach((agent: any) => {
        console.log(`  ${chalk.cyan(agent.agent_id)}`);
        if (agent.name) {
          console.log(chalk.gray(`    Name: ${agent.name}`));
        }
        if (agent.testingStatus) {
          console.log(chalk.gray(`    Last Test: ${agent.testingStatus.lastTestRun || 'Never'}`));
          console.log(chalk.gray(`    Pass Rate: ${agent.testingStatus.passRate || 0}%`));
        }
        console.log();
      });
    } else {
      console.log(chalk.gray('  No agents found'));
    }
    console.log();

    // Display test suites
    console.log(chalk.bold('Test Suites:'));
    console.log(chalk.gray('─'.repeat(50)));

    // Group by type
    const universalSuites = suites.filter((s: any) => s.suite_type === 'universal');
    const customSuites = suites.filter((s: any) => s.suite_type === 'custom');

    if (universalSuites.length > 0) {
      console.log(chalk.bold('  Universal Suites:'));
      universalSuites.forEach((suite: any) => {
        console.log(`    ${chalk.green(suite.name)} (${suite.tests?.length || 0} tests)`);
        if (suite.description) {
          console.log(chalk.gray(`      ${suite.description}`));
        }
      });
      console.log();
    }

    if (customSuites.length > 0) {
      console.log(chalk.bold('  Custom Suites:'));
      customSuites.forEach((suite: any) => {
        console.log(`    ${chalk.yellow(suite.name)} (${suite.tests?.length || 0} tests)`);
        if (suite.agent_id) {
          console.log(chalk.gray(`      Agent: ${suite.agent_id}`));
        }
        if (suite.description) {
          console.log(chalk.gray(`      ${suite.description}`));
        }
      });
      console.log();
    }

    if (suites.length === 0) {
      console.log(chalk.gray('  No test suites found'));
      console.log();
    }

    // Usage examples
    console.log(chalk.yellow('Examples:'));
    console.log(chalk.gray('  agent test --agent my-agent'));
    console.log(chalk.gray('  agent test --agent my-agent --suite universal'));
    console.log(chalk.gray('  agent test --agent my-agent --suite custom'));
    console.log(chalk.gray('  agent test --agent my-agent --sandbox'));
    console.log();

  } catch (error: any) {
    spinner.fail('Failed to fetch data');

    if (error.response) {
      console.error(chalk.red(`API Error: ${error.response.status}`));
    } else if (error.request) {
      console.error(chalk.red('Network Error: Could not connect to backend'));
      console.error(chalk.gray(`API URL: ${apiUrl}`));
    } else {
      console.error(chalk.red(`Error: ${error.message}`));
    }

    process.exit(1);
  }
}

/**
 * Handle --report command (Task 9.1)
 */
async function handleReportCommand(options: any) {
  const config = configManager.getConfig();
  const apiUrl = config.apiUrl || 'http://localhost:4002';

  console.log(chalk.blue('📊 Generating Test Report\n'));

  const spinner = ora('Fetching test data...').start();

  try {
    let runId = options.report;
    let testRun: any;
    let testResults: any[];

    // If no run ID provided, get the most recent run
    if (runId === true || !runId) {
      spinner.text = 'Fetching recent test runs...';
      
      const runsResponse = await axios.get(`${apiUrl}/api/testing/runs`, {
        params: { limit: 1, orderBy: 'start_time', order: 'DESC' }
      });

      if (!runsResponse.data || runsResponse.data.length === 0) {
        spinner.fail('No test runs found');
        console.log(chalk.yellow('\nRun some tests first:'));
        console.log(chalk.gray('  agent test --agent <agentId>'));
        process.exit(1);
      }

      testRun = runsResponse.data[0];
      runId = testRun.id;
    } else {
      // Fetch specific run
      spinner.text = `Fetching test run ${runId}...`;
      const runResponse = await axios.get(`${apiUrl}/api/testing/runs/${runId}`);
      testRun = runResponse.data;
    }

    // Fetch test results
    spinner.text = 'Fetching test results...';
    const resultsResponse = await axios.get(`${apiUrl}/api/testing/results/${runId}`);
    testResults = resultsResponse.data;

    spinner.succeed('Data fetched successfully');
    console.log();

    // Generate comprehensive report
    generateDetailedReport(testRun, testResults);

  } catch (error: any) {
    spinner.fail('Failed to generate report');

    if (error.response) {
      console.error(chalk.red(`API Error: ${error.response.status}`));
      if (error.response.status === 404) {
        console.error(chalk.yellow('Test run not found. Check the run ID.'));
      }
    } else if (error.request) {
      console.error(chalk.red('Network Error: Could not connect to backend'));
      console.error(chalk.gray(`API URL: ${apiUrl}`));
    } else {
      console.error(chalk.red(`Error: ${error.message}`));
    }

    process.exit(1);
  }
}

/**
 * Generate detailed test report
 */
function generateDetailedReport(testRun: any, testResults: any[]) {
  const summary = testRun.summary || {};

  // Report Header
  console.log(chalk.bold.blue('═'.repeat(70)));
  console.log(chalk.bold.blue('                    TEST EXECUTION REPORT'));
  console.log(chalk.bold.blue('═'.repeat(70)));
  console.log();

  // Run Information
  console.log(chalk.bold('📋 Run Information'));
  console.log(chalk.gray('─'.repeat(70)));
  console.log(`  Run ID:         ${testRun.id}`);
  console.log(`  Agent ID:       ${testRun.agent_id}`);
  console.log(`  Status:         ${getStatusBadge(testRun.status)}`);
  console.log(`  Start Time:     ${new Date(testRun.start_time).toLocaleString()}`);
  if (testRun.end_time) {
    console.log(`  End Time:       ${new Date(testRun.end_time).toLocaleString()}`);
    const duration = new Date(testRun.end_time).getTime() - new Date(testRun.start_time).getTime();
    console.log(`  Total Duration: ${duration}ms`);
  }
  console.log();

  // Executive Summary
  console.log(chalk.bold('📊 Executive Summary'));
  console.log(chalk.gray('─'.repeat(70)));
  console.log(`  Total Tests:    ${summary.totalTests || 0}`);
  console.log(chalk.green(`  ✓ Passed:       ${summary.passed || 0} (${((summary.passed || 0) / (summary.totalTests || 1) * 100).toFixed(1)}%)`));
  console.log(chalk.red(`  ✗ Failed:       ${summary.failed || 0} (${((summary.failed || 0) / (summary.totalTests || 1) * 100).toFixed(1)}%)`));
  if (summary.errors > 0) {
    console.log(chalk.red(`  ⚠ Errors:        ${summary.errors} (${((summary.errors || 0) / (summary.totalTests || 1) * 100).toFixed(1)}%)`));
  }
  if (summary.skipped > 0) {
    console.log(chalk.yellow(`  ○ Skipped:      ${summary.skipped}`));
  }
  console.log(`  Pass Rate:      ${chalk.bold(summary.passRate?.toFixed(1) || '0.0')}%`);
  console.log(`  Avg Duration:   ${summary.avgDuration?.toFixed(0) || 0}ms per test`);
  console.log();

  // Test Suite Breakdown
  if (summary.universalTests || summary.customTests) {
    console.log(chalk.bold('🔍 Test Suite Breakdown'));
    console.log(chalk.gray('─'.repeat(70)));

    if (summary.universalTests && summary.universalTests.total > 0) {
      console.log(chalk.bold('  Universal Tests:'));
      console.log(`    Total:      ${summary.universalTests.total}`);
      console.log(chalk.green(`    Passed:     ${summary.universalTests.passed}`));
      console.log(chalk.red(`    Failed:     ${summary.universalTests.failed}`));
      console.log(`    Pass Rate:  ${summary.universalTests.passRate?.toFixed(1)}%`);
      console.log();
    }

    if (summary.customTests && summary.customTests.total > 0) {
      console.log(chalk.bold('  Custom Tests:'));
      console.log(`    Total:      ${summary.customTests.total}`);
      console.log(chalk.green(`    Passed:     ${summary.customTests.passed}`));
      console.log(chalk.red(`    Failed:     ${summary.customTests.failed}`));
      console.log(`    Pass Rate:  ${summary.customTests.passRate?.toFixed(1)}%`);
      console.log();
    }
  }

  // Detailed Test Results
  if (testResults && testResults.length > 0) {
    console.log(chalk.bold('📝 Detailed Test Results'));
    console.log(chalk.gray('─'.repeat(70)));
    console.log();

    // Group by suite
    const suiteGroups = groupResultsBySuite(testResults);

    Object.entries(suiteGroups).forEach(([suiteName, tests]: [string, any]) => {
      const suiteTests = tests as any[];
      const suitePassed = suiteTests.filter((t: any) => t.status === 'passed').length;
      const suiteTotal = suiteTests.length;
      const suitePassRate = (suitePassed / suiteTotal * 100).toFixed(1);

      console.log(chalk.bold(`  ${suiteName}`));
      console.log(chalk.gray(`  Pass Rate: ${suitePassRate}% (${suitePassed}/${suiteTotal})`));
      console.log();

      suiteTests.forEach((test: any) => {
        const statusIcon = test.status === 'passed' ? chalk.green('✓') :
                          test.status === 'failed' ? chalk.red('✗') :
                          test.status === 'error' ? chalk.red('⚠') :
                          chalk.yellow('○');

        console.log(`    ${statusIcon} ${test.test_case_name}`);
        console.log(chalk.gray(`      Duration: ${test.duration}ms`));

        if (test.status === 'failed' && test.evaluation) {
          console.log(chalk.red(`      Reason: ${test.evaluation.details}`));
          if (test.evaluation.score !== undefined) {
            console.log(chalk.gray(`      Score: ${test.evaluation.score.toFixed(1)}/100`));
          }

          // Show evaluation metrics if available
          if (test.evaluation.metrics) {
            const metrics = test.evaluation.metrics;
            if (metrics.accuracy) {
              console.log(chalk.gray(`      Accuracy: ${JSON.stringify(metrics.accuracy)}`));
            }
          }
        }

        if (test.status === 'error' && test.error) {
          console.log(chalk.red(`      Error: ${test.error.message}`));
        }

        console.log();
      });
    });
  }

  // Recommendations (if available)
  console.log(chalk.bold('💡 Recommendations'));
  console.log(chalk.gray('─'.repeat(70)));
  
  if (summary.failed > 0 || summary.errors > 0) {
    console.log(chalk.yellow('  • Review failed tests and adjust agent configuration'));
    console.log(chalk.yellow('  • Consider running pattern analysis: agent analyze failures'));
    console.log(chalk.yellow('  • Check agent logs for detailed error information'));
  } else {
    console.log(chalk.green('  • All tests passed! Agent is performing well.'));
    console.log(chalk.gray('  • Consider adding more custom tests for edge cases'));
  }
  console.log();

  // Footer
  console.log(chalk.bold.blue('═'.repeat(70)));
  console.log(chalk.gray(`Report generated: ${new Date().toLocaleString()}`));
  console.log(chalk.bold.blue('═'.repeat(70)));
  console.log();
}

/**
 * Get status badge with color
 */
function getStatusBadge(status: string): string {
  switch (status) {
    case 'completed':
      return chalk.green('✓ Completed');
    case 'failed':
      return chalk.red('✗ Failed');
    case 'running':
      return chalk.yellow('⟳ Running');
    case 'queued':
      return chalk.gray('○ Queued');
    default:
      return chalk.gray(status);
  }
}
