import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import { ProjectContext } from '../types';

export class ProjectAnalyzer {
  static async analyzeProject(rootPath: string = process.cwd()): Promise<ProjectContext> {
    const context: ProjectContext = {
      rootPath
    };

    // Check for package.json
    const packageJsonPath = path.join(rootPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        context.packageJson = await fs.readJson(packageJsonPath);
        context.language = 'javascript';
        
        // Detect TypeScript
        if (fs.existsSync(path.join(rootPath, 'tsconfig.json')) || 
            context.packageJson.devDependencies?.typescript ||
            context.packageJson.dependencies?.typescript) {
          context.language = 'typescript';
        }

        // Detect framework
        const deps = { ...context.packageJson.dependencies, ...context.packageJson.devDependencies };
        if (deps.react) context.framework = 'react';
        else if (deps.vue) context.framework = 'vue';
        else if (deps.angular) context.framework = 'angular';
        else if (deps.express) context.framework = 'express';
        else if (deps.next) context.framework = 'nextjs';

        // Detect test framework
        if (deps.jest) context.testFramework = 'jest';
        else if (deps.mocha) context.testFramework = 'mocha';
        else if (deps.vitest) context.testFramework = 'vitest';
        else if (deps.cypress) context.testFramework = 'cypress';

      } catch (error) {
        console.warn('Failed to parse package.json');
      }
    }

    // Check for other language indicators
    if (!context.language) {
      const pythonFiles = await glob('**/*.py', { cwd: rootPath, ignore: 'node_modules/**' });
      if (pythonFiles.length > 0) {
        context.language = 'python';
        
        // Check for Python frameworks
        if (fs.existsSync(path.join(rootPath, 'requirements.txt'))) {
          const requirements = await fs.readFile(path.join(rootPath, 'requirements.txt'), 'utf-8');
          if (requirements.includes('django')) context.framework = 'django';
          else if (requirements.includes('flask')) context.framework = 'flask';
          else if (requirements.includes('fastapi')) context.framework = 'fastapi';
        }
      }

      const javaFiles = await glob('**/*.java', { cwd: rootPath, ignore: 'node_modules/**' });
      if (javaFiles.length > 0) {
        context.language = 'java';
        if (fs.existsSync(path.join(rootPath, 'pom.xml'))) context.framework = 'maven';
        else if (fs.existsSync(path.join(rootPath, 'build.gradle'))) context.framework = 'gradle';
      }
    }

    // Check for Git repository
    if (fs.existsSync(path.join(rootPath, '.git'))) {
      try {
        const gitConfig = await fs.readFile(path.join(rootPath, '.git', 'config'), 'utf-8');
        const remoteMatch = gitConfig.match(/url = (.+)/);
        if (remoteMatch) {
          context.gitRepo = remoteMatch[1];
        }
      } catch (error) {
        // Git config parsing failed, continue without repo info
      }
    }

    return context;
  }

  static async getRelevantFiles(rootPath: string, fileTypes: string[] = []): Promise<string[]> {
    const defaultPatterns = [
      '**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx',
      '**/*.py', '**/*.java', '**/*.cs', '**/*.go',
      '**/*.json', '**/*.yaml', '**/*.yml'
    ];

    const patterns = fileTypes.length > 0 ? fileTypes : defaultPatterns;
    const ignorePatterns = [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.git/**',
      'coverage/**',
      '**/*.min.js',
      '**/*.d.ts'
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, { 
        cwd: rootPath, 
        ignore: ignorePatterns,
        absolute: true 
      });
      files.push(...matches);
    }

    return [...new Set(files)]; // Remove duplicates
  }
}