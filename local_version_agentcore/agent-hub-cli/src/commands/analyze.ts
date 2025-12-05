import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { agentService } from '../services/agentService';
import { ProjectAnalyzer } from '../utils/projectAnalyzer';

export function createAnalyzeCommand(): Command {
  const analyzeCmd = new Command('analyze');
  analyzeCmd.description('Analyze code, failures, or performance issues');

  // Analyze failure command
  analyzeCmd
    .command('failure')
    .description('Analyze test failures, build errors, or runtime issues')
    .option('-l, --log <path>', 'Path to log file containing errors')
    .option('-c, --context <path>', 'Path to relevant source code directory')
    .option('--error <message>', 'Direct error message to analyze')
    .option('--format <type>', 'Output format (json, text, markdown)', 'text')
    .action(async (options) => {
      const spinner = ora('Analyzing failure...').start();
      
      try {
        let errorData = '';
        let contextFiles: string[] = [];
        
        // Get error data
        if (options.log) {
          const logPath = path.resolve(options.log);
          if (!fs.existsSync(logPath)) {
            throw new Error(`Log file not found: ${options.log}`);
          }
          errorData = await fs.readFile(logPath, 'utf-8');
        } else if (options.error) {
          errorData = options.error;
        } else {
          throw new Error('Either --log or --error option is required');
        }

        // Get context files
        if (options.context) {
          const contextPath = path.resolve(options.context);
          contextFiles = await ProjectAnalyzer.getRelevantFiles(contextPath);
        } else {
          const projectContext = await ProjectAnalyzer.analyzeProject();
          contextFiles = await ProjectAnalyzer.getRelevantFiles(projectContext.rootPath);
        }

        spinner.text = 'Running failure analysis...';

        const response = await agentService.executeAgent({
          agentId: 'failure-analyzer',
          input: {
            error_data: errorData,
            context_files: contextFiles.slice(0, 10), // Limit context to avoid payload size issues
            options: {
              format: options.format,
              include_suggestions: true,
              include_root_cause: true
            }
          }
        });

        if (response.success) {
          spinner.succeed('Failure analysis completed!');
          
          const analysis = response.data.analysis;
          
          console.log(chalk.red('\n🔍 Failure Analysis Results:\n'));
          
          if (analysis.root_cause) {
            console.log(chalk.yellow('Root Cause:'));
            console.log(`  ${analysis.root_cause}\n`);
          }
          
          if (analysis.affected_files && analysis.affected_files.length > 0) {
            console.log(chalk.yellow('Affected Files:'));
            analysis.affected_files.forEach((file: string) => {
              console.log(chalk.gray(`  • ${file}`));
            });
            console.log();
          }
          
          if (analysis.suggestions && analysis.suggestions.length > 0) {
            console.log(chalk.green('💡 Suggested Fixes:'));
            analysis.suggestions.forEach((suggestion: string, index: number) => {
              console.log(`  ${index + 1}. ${suggestion}`);
            });
            console.log();
          }
          
          if (response.data.generated_code) {
            console.log(chalk.blue('🔧 Generated Fix:'));
            console.log(chalk.gray(response.data.generated_code));
          }

        } else {
          throw new Error(response.error);
        }

      } catch (error) {
        spinner.fail('Failure analysis failed');
        console.error(chalk.red(`Error: ${error}`));
        process.exit(1);
      }
    });

  // Analyze security command
  analyzeCmd
    .command('security')
    .description('Perform security analysis on code')
    .option('-f, --file <path>', 'Analyze specific file')
    .option('-d, --directory <path>', 'Analyze directory')
    .option('--severity <level>', 'Minimum severity level (low, medium, high, critical)', 'medium')
    .option('--format <type>', 'Output format (json, sarif, text)', 'text')
    .option('--output <path>', 'Save results to file')
    .action(async (options) => {
      const spinner = ora('Running security analysis...').start();
      
      try {
        const context = await ProjectAnalyzer.analyzeProject();
        
        let filesToAnalyze: string[] = [];
        
        if (options.file) {
          filesToAnalyze = [path.resolve(options.file)];
        } else if (options.directory) {
          filesToAnalyze = await ProjectAnalyzer.getRelevantFiles(path.resolve(options.directory));
        } else {
          filesToAnalyze = await ProjectAnalyzer.getRelevantFiles(context.rootPath);
        }

        const response = await agentService.executeAgent({
          agentId: 'security-scanner',
          input: {
            files: filesToAnalyze,
            context: {
              language: context.language,
              framework: context.framework,
              severity: options.severity,
              format: options.format
            }
          }
        });

        if (response.success) {
          spinner.succeed('Security analysis completed!');
          
          const issues = response.data.security_issues || [];
          
          if (issues.length === 0) {
            console.log(chalk.green('\n✅ No security issues found!'));
            return;
          }

          console.log(chalk.red(`\n🔒 Found ${issues.length} security issues:\n`));
          
          issues.forEach((issue: any, index: number) => {
            const severityColor = issue.severity === 'critical' ? 'red' : 
                                 issue.severity === 'high' ? 'yellow' : 'gray';
            
            console.log(chalk[severityColor](`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`));
            console.log(chalk.gray(`   File: ${issue.file}:${issue.line || '?'}`));
            console.log(chalk.gray(`   ${issue.description}`));
            
            if (issue.suggestion) {
              console.log(chalk.blue(`   💡 Fix: ${issue.suggestion}`));
            }
            console.log();
          });

          // Save to file if requested
          if (options.output) {
            const outputPath = path.resolve(options.output);
            await fs.writeFile(outputPath, JSON.stringify(response.data, null, 2));
            console.log(chalk.blue(`📄 Results saved to: ${outputPath}`));
          }

        } else {
          throw new Error(response.error);
        }

      } catch (error) {
        spinner.fail('Security analysis failed');
        console.error(chalk.red(`Error: ${error}`));
        process.exit(1);
      }
    });

  // Analyze performance command
  analyzeCmd
    .command('performance')
    .description('Analyze code performance and suggest optimizations')
    .option('-f, --file <path>', 'Analyze specific file')
    .option('-d, --directory <path>', 'Analyze directory')
    .option('--profile <path>', 'Path to performance profile data')
    .option('--metrics', 'Include detailed performance metrics')
    .action(async (options) => {
      const spinner = ora('Analyzing performance...').start();
      
      try {
        const context = await ProjectAnalyzer.analyzeProject();
        
        let filesToAnalyze: string[] = [];
        let profileData: string | undefined = undefined;
        
        if (options.file) {
          filesToAnalyze = [path.resolve(options.file)];
        } else if (options.directory) {
          filesToAnalyze = await ProjectAnalyzer.getRelevantFiles(path.resolve(options.directory));
        } else {
          filesToAnalyze = await ProjectAnalyzer.getRelevantFiles(context.rootPath);
        }

        if (options.profile && fs.existsSync(options.profile)) {
          profileData = await fs.readFile(options.profile, 'utf-8');
        }

        const response = await agentService.executeAgent({
          agentId: 'performance-analyzer',
          input: {
            files: filesToAnalyze,
            profile_data: profileData,
            context: {
              language: context.language,
              framework: context.framework,
              include_metrics: options.metrics
            }
          }
        });

        if (response.success) {
          spinner.succeed('Performance analysis completed!');
          
          const metrics = response.data.performance_metrics;
          const suggestions = response.data.suggestions || [];
          
          if (metrics) {
            console.log(chalk.blue('\n📊 Performance Metrics:'));
            Object.entries(metrics).forEach(([key, value]) => {
              console.log(chalk.gray(`  ${key}: ${value}`));
            });
            console.log();
          }
          
          if (suggestions.length > 0) {
            console.log(chalk.yellow('⚡ Performance Optimization Suggestions:'));
            suggestions.forEach((suggestion: string, index: number) => {
              console.log(`  ${index + 1}. ${suggestion}`);
            });
          } else {
            console.log(chalk.green('✅ No performance issues detected!'));
          }

        } else {
          throw new Error(response.error);
        }

      } catch (error) {
        spinner.fail('Performance analysis failed');
        console.error(chalk.red(`Error: ${error}`));
        process.exit(1);
      }
    });

  return analyzeCmd;
}