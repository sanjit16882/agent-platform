import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { agentService } from '../services/agentService';
import { ProjectAnalyzer } from '../utils/projectAnalyzer';

export function createGenerateCommand(): Command {
  const generateCmd = new Command('generate');
  generateCmd.description('Generate code, tests, or documentation using agents');

  // Generate tests command
  generateCmd
    .command('tests')
    .description('Generate tests for specified files or entire project')
    .option('-f, --file <path>', 'Generate tests for specific file')
    .option('-d, --directory <path>', 'Generate tests for all files in directory')
    .option('--framework <name>', 'Test framework to use (jest, mocha, vitest)')
    .option('--coverage', 'Include coverage requirements in generated tests')
    .option('--edge-cases', 'Generate additional edge case tests')
    .option('--output <path>', 'Output directory for generated tests')
    .action(async (options) => {
      const spinner = ora('Analyzing project and generating tests...').start();
      
      try {
        const context = await ProjectAnalyzer.analyzeProject();
        const framework = options.framework || context.testFramework || 'jest';
        
        let filesToTest: string[] = [];
        
        if (options.file) {
          const filePath = path.resolve(options.file);
          if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${options.file}`);
          }
          filesToTest = [filePath];
        } else if (options.directory) {
          const dirPath = path.resolve(options.directory);
          filesToTest = await ProjectAnalyzer.getRelevantFiles(dirPath);
        } else {
          filesToTest = await ProjectAnalyzer.getRelevantFiles(context.rootPath);
        }

        spinner.text = `Generating tests for ${filesToTest.length} files...`;

        const results = [];
        for (const file of filesToTest) {
          const sourceCode = await fs.readFile(file, 'utf-8');
          const relativePath = path.relative(context.rootPath, file);
          
          const response = await agentService.executeAgent({
            agentId: 'test-generator',
            input: {
              source_code: sourceCode,
              file_path: relativePath,
              context: {
                framework,
                language: context.language,
                projectFramework: context.framework,
                includeCoverage: options.coverage,
                includeEdgeCases: options.edgeCases
              }
            }
          });

          if (response.success && response.data.test_cases) {
            const outputDir = options.output || path.join(context.rootPath, 'tests');
            const testFileName = path.basename(file, path.extname(file)) + '.test' + path.extname(file);
            const testFilePath = path.join(outputDir, testFileName);
            
            await fs.ensureDir(outputDir);
            await fs.writeFile(testFilePath, response.data.test_cases);
            
            results.push({
              sourceFile: relativePath,
              testFile: path.relative(context.rootPath, testFilePath),
              success: true
            });
          } else {
            results.push({
              sourceFile: relativePath,
              success: false,
              error: response.error
            });
          }
        }

        spinner.succeed('Test generation completed!');
        
        console.log(chalk.green('\n✅ Generated Tests:'));
        results.filter(r => r.success).forEach(result => {
          console.log(chalk.gray(`  ${result.sourceFile} → ${result.testFile}`));
        });

        if (results.some(r => !r.success)) {
          console.log(chalk.yellow('\n⚠️  Failed to generate tests for:'));
          results.filter(r => !r.success).forEach(result => {
            console.log(chalk.red(`  ${result.sourceFile}: ${result.error}`));
          });
        }

      } catch (error) {
        spinner.fail('Test generation failed');
        console.error(chalk.red(`Error: ${error}`));
        process.exit(1);
      }
    });

  // Generate documentation command
  generateCmd
    .command('docs')
    .description('Generate documentation for code')
    .option('-f, --file <path>', 'Generate docs for specific file')
    .option('-d, --directory <path>', 'Generate docs for directory')
    .option('--format <type>', 'Documentation format (markdown, html, json)', 'markdown')
    .option('--output <path>', 'Output directory for generated documentation')
    .action(async (options) => {
      const spinner = ora('Generating documentation...').start();
      
      try {
        const context = await ProjectAnalyzer.analyzeProject();
        
        let filesToDocument: string[] = [];
        
        if (options.file) {
          filesToDocument = [path.resolve(options.file)];
        } else if (options.directory) {
          filesToDocument = await ProjectAnalyzer.getRelevantFiles(path.resolve(options.directory));
        } else {
          filesToDocument = await ProjectAnalyzer.getRelevantFiles(context.rootPath);
        }

        const response = await agentService.executeAgent({
          agentId: 'documentation-generator',
          input: {
            files: filesToDocument,
            context: {
              format: options.format,
              language: context.language,
              framework: context.framework
            }
          }
        });

        if (response.success) {
          const outputDir = options.output || path.join(context.rootPath, 'docs');
          await fs.ensureDir(outputDir);
          
          const docFile = path.join(outputDir, `README.${options.format === 'html' ? 'html' : 'md'}`);
          await fs.writeFile(docFile, response.data.generated_code || '');
          
          spinner.succeed('Documentation generated successfully!');
          console.log(chalk.green(`📚 Documentation saved to: ${path.relative(context.rootPath, docFile)}`));
        } else {
          throw new Error(response.error);
        }

      } catch (error) {
        spinner.fail('Documentation generation failed');
        console.error(chalk.red(`Error: ${error}`));
        process.exit(1);
      }
    });

  return generateCmd;
}