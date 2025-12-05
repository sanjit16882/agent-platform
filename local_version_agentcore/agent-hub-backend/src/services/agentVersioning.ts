import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { AgentTemplate } from '../agent-templates';

export interface AgentVersion {
  id: string;
  agentId: string;
  version: string;
  commitHash?: string;
  timestamp: Date;
  author: string;
  message: string;
  changes: AgentChange[];
  template: AgentTemplate;
  status: 'draft' | 'testing' | 'deployed' | 'deprecated';
  testResults?: any;
}

export interface AgentChange {
  type: 'prompt' | 'config' | 'metadata' | 'component';
  field: string;
  oldValue: any;
  newValue: any;
  description: string;
}

export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  autoRollback: boolean;
  testingRequired: boolean;
  approvalRequired: boolean;
  rollbackTriggers: string[];
}

export class AgentVersioningService {
  private versionsDir: string;
  private gitEnabled: boolean;

  constructor(baseDir: string = './agent-versions') {
    this.versionsDir = baseDir;
    this.gitEnabled = this.checkGitAvailability();
    this.ensureDirectoryExists();
  }

  private checkGitAvailability(): boolean {
    try {
      execSync('git --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.versionsDir)) {
      fs.mkdirSync(this.versionsDir, { recursive: true });
    }

    // Initialize git repo if not exists and git is available
    if (this.gitEnabled && !fs.existsSync(path.join(this.versionsDir, '.git'))) {
      try {
        execSync('git init', { cwd: this.versionsDir, stdio: 'pipe' });
        execSync('git config user.name "AgentHub System"', { cwd: this.versionsDir, stdio: 'pipe' });
        execSync('git config user.email "system@agenthub.local"', { cwd: this.versionsDir, stdio: 'pipe' });
        
        // Create .gitignore
        const gitignore = `
node_modules/
*.log
.env
.DS_Store
*.tmp
`;
        fs.writeFileSync(path.join(this.versionsDir, '.gitignore'), gitignore.trim());
        
        execSync('git add .gitignore', { cwd: this.versionsDir, stdio: 'pipe' });
        execSync('git commit -m "Initial AgentHub versioning setup"', { cwd: this.versionsDir, stdio: 'pipe' });
      } catch (error) {
        console.warn('Failed to initialize git repository:', error);
        this.gitEnabled = false;
      }
    }
  }

  async createVersion(
    agentId: string,
    template: AgentTemplate,
    author: string,
    message: string,
    previousVersion?: AgentVersion
  ): Promise<AgentVersion> {
    const version = this.generateVersionNumber(agentId);
    const changes = previousVersion ? this.detectChanges(previousVersion.template, template) : [];
    
    const agentVersion: AgentVersion = {
      id: `${agentId}-${version}`,
      agentId,
      version,
      timestamp: new Date(),
      author,
      message,
      changes,
      template: JSON.parse(JSON.stringify(template)), // Deep clone
      status: 'draft'
    };

    // Save to filesystem
    await this.saveVersion(agentVersion);

    // Git commit if enabled
    if (this.gitEnabled) {
      try {
        const commitHash = await this.gitCommit(agentVersion);
        agentVersion.commitHash = commitHash;
      } catch (error) {
        console.warn('Git commit failed:', error);
      }
    }

    return agentVersion;
  }

  private generateVersionNumber(agentId: string): string {
    const versions = this.getVersionHistory(agentId);
    if (versions.length === 0) {
      return '1.0.0';
    }

    const latestVersion = versions[0].version;
    const [major, minor, patch] = latestVersion.split('.').map(Number);
    
    // Auto-increment patch version
    return `${major}.${minor}.${patch + 1}`;
  }

  private detectChanges(oldTemplate: AgentTemplate, newTemplate: AgentTemplate): AgentChange[] {
    const changes: AgentChange[] = [];

    // Check basic field changes
    if (oldTemplate.name !== newTemplate.name) {
      changes.push({
        type: 'metadata',
        field: 'name',
        oldValue: oldTemplate.name,
        newValue: newTemplate.name,
        description: 'Agent name updated'
      });
    }

    if (oldTemplate.description !== newTemplate.description) {
      changes.push({
        type: 'metadata',
        field: 'description',
        oldValue: oldTemplate.description,
        newValue: newTemplate.description,
        description: 'Agent description updated'
      });
    }

    if (oldTemplate.purpose !== newTemplate.purpose) {
      changes.push({
        type: 'config',
        field: 'purpose',
        oldValue: oldTemplate.purpose,
        newValue: newTemplate.purpose,
        description: 'Agent purpose updated'
      });
    }

    if (oldTemplate.processingLogic !== newTemplate.processingLogic) {
      changes.push({
        type: 'prompt',
        field: 'processingLogic',
        oldValue: oldTemplate.processingLogic,
        newValue: newTemplate.processingLogic,
        description: 'Agent processing logic updated'
      });
    }

    // Check input schema changes
    const oldInputSchema = JSON.stringify(oldTemplate.inputSchema || []);
    const newInputSchema = JSON.stringify(newTemplate.inputSchema || []);
    if (oldInputSchema !== newInputSchema) {
      changes.push({
        type: 'config',
        field: 'inputSchema',
        oldValue: oldTemplate.inputSchema,
        newValue: newTemplate.inputSchema,
        description: 'Agent input schema updated'
      });
    }

    // Check output schema changes
    const oldOutputSchema = JSON.stringify(oldTemplate.outputSchema || []);
    const newOutputSchema = JSON.stringify(newTemplate.outputSchema || []);
    if (oldOutputSchema !== newOutputSchema) {
      changes.push({
        type: 'config',
        field: 'outputSchema',
        oldValue: oldTemplate.outputSchema,
        newValue: newTemplate.outputSchema,
        description: 'Agent output schema updated'
      });
    }

    return changes;
  }

  private async saveVersion(version: AgentVersion): Promise<void> {
    const agentDir = path.join(this.versionsDir, version.agentId);
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }

    const versionFile = path.join(agentDir, `${version.version}.json`);
    fs.writeFileSync(versionFile, JSON.stringify(version, null, 2));

    // Also save the template separately for easier access
    const templateFile = path.join(agentDir, `${version.version}-template.json`);
    fs.writeFileSync(templateFile, JSON.stringify(version.template, null, 2));

    // Update latest version pointer
    const latestFile = path.join(agentDir, 'latest.json');
    fs.writeFileSync(latestFile, JSON.stringify({
      version: version.version,
      id: version.id,
      timestamp: version.timestamp
    }, null, 2));
  }

  private async gitCommit(version: AgentVersion): Promise<string> {
    const agentDir = path.join(this.versionsDir, version.agentId);
    
    // Add files to git
    execSync(`git add ${version.agentId}/`, { cwd: this.versionsDir, stdio: 'pipe' });
    
    // Create commit message
    const commitMessage = `${version.agentId} v${version.version}: ${version.message}

Changes:
${version.changes.map(c => `- ${c.description}`).join('\n')}

Author: ${version.author}
Timestamp: ${version.timestamp.toISOString()}`;

    // Commit
    execSync(`git commit -m "${commitMessage}"`, { cwd: this.versionsDir, stdio: 'pipe' });
    
    // Get commit hash
    const commitHash = execSync('git rev-parse HEAD', { cwd: this.versionsDir, encoding: 'utf8' }).trim();
    
    return commitHash;
  }

  getVersionHistory(agentId: string): AgentVersion[] {
    const agentDir = path.join(this.versionsDir, agentId);
    if (!fs.existsSync(agentDir)) {
      return [];
    }

    const versionFiles = fs.readdirSync(agentDir)
      .filter(file => file.endsWith('.json') && !file.includes('template') && file !== 'latest.json')
      .sort((a, b) => {
        const versionA = a.replace('.json', '');
        const versionB = b.replace('.json', '');
        return this.compareVersions(versionB, versionA); // Descending order
      });

    return versionFiles.map(file => {
      const content = fs.readFileSync(path.join(agentDir, file), 'utf8');
      return JSON.parse(content) as AgentVersion;
    });
  }

  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }
    
    return 0;
  }

  async rollbackToVersion(agentId: string, targetVersion: string): Promise<AgentVersion> {
    const versions = this.getVersionHistory(agentId);
    const targetVersionData = versions.find(v => v.version === targetVersion);
    
    if (!targetVersionData) {
      throw new Error(`Version ${targetVersion} not found for agent ${agentId}`);
    }

    // Create a new version based on the target version
    const rollbackVersion = await this.createVersion(
      agentId,
      targetVersionData.template,
      'system',
      `Rollback to version ${targetVersion}`
    );

    rollbackVersion.status = 'deployed';
    await this.saveVersion(rollbackVersion);

    return rollbackVersion;
  }

  async deployVersion(
    agentId: string, 
    version: string, 
    environment: string,
    config: DeploymentConfig
  ): Promise<{ success: boolean; message: string }> {
    const versions = this.getVersionHistory(agentId);
    const versionData = versions.find(v => v.version === version);
    
    if (!versionData) {
      return { success: false, message: `Version ${version} not found` };
    }

    // Check if testing is required and passed
    if (config.testingRequired && !versionData.testResults) {
      return { success: false, message: 'Testing required but no test results found' };
    }

    if (config.testingRequired && versionData.testResults && !versionData.testResults.passed) {
      return { success: false, message: 'Cannot deploy version that failed testing' };
    }

    // Update version status
    versionData.status = 'deployed';
    await this.saveVersion(versionData);

    // Git tag for deployment
    if (this.gitEnabled) {
      try {
        const tag = `${agentId}-${version}-${environment}`;
        execSync(`git tag -a ${tag} -m "Deploy ${agentId} v${version} to ${environment}"`, 
          { cwd: this.versionsDir, stdio: 'pipe' });
      } catch (error) {
        console.warn('Failed to create git tag:', error);
      }
    }

    return { success: true, message: `Successfully deployed ${agentId} v${version} to ${environment}` };
  }

  // Get deployment history
  getDeploymentHistory(agentId: string): Array<{
    version: string;
    environment: string;
    timestamp: Date;
    commitHash?: string;
  }> {
    if (!this.gitEnabled) {
      return [];
    }

    try {
      const tags = execSync(`git tag -l "${agentId}-*"`, { cwd: this.versionsDir, encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(tag => tag.length > 0);

      return tags.map(tag => {
        const [, version, environment] = tag.split('-');
        const tagInfo = execSync(`git show ${tag} --format="%H %ci" --no-patch`, 
          { cwd: this.versionsDir, encoding: 'utf8' }).trim();
        const [commitHash, timestamp] = tagInfo.split(' ', 2);

        return {
          version,
          environment,
          timestamp: new Date(timestamp),
          commitHash
        };
      }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch {
      return [];
    }
  }

  // Generate changelog
  generateChangelog(agentId: string, fromVersion?: string, toVersion?: string): string {
    const versions = this.getVersionHistory(agentId);
    
    let relevantVersions = versions;
    if (fromVersion || toVersion) {
      const fromIndex = fromVersion ? versions.findIndex(v => v.version === fromVersion) : -1;
      const toIndex = toVersion ? versions.findIndex(v => v.version === toVersion) : 0;
      
      relevantVersions = versions.slice(
        Math.max(0, toIndex),
        fromIndex >= 0 ? fromIndex + 1 : versions.length
      );
    }

    let changelog = `# Changelog for ${agentId}\n\n`;
    
    for (const version of relevantVersions) {
      changelog += `## Version ${version.version} - ${version.timestamp.toISOString().split('T')[0]}\n\n`;
      changelog += `**Author:** ${version.author}\n`;
      changelog += `**Message:** ${version.message}\n\n`;
      
      if (version.changes.length > 0) {
        changelog += `**Changes:**\n`;
        for (const change of version.changes) {
          changelog += `- ${change.description}\n`;
        }
        changelog += '\n';
      }
      
      if (version.commitHash) {
        changelog += `**Commit:** ${version.commitHash}\n\n`;
      }
      
      changelog += '---\n\n';
    }

    return changelog;
  }
}