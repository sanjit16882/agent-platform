// GitHub Integration Service
const https = require('https');

// Simple fetch wrapper using https
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: async () => JSON.parse(data),
          text: async () => data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

class GitHubService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.token = process.env.GITHUB_TOKEN || '';
  }

  /**
   * Set GitHub token (can be called dynamically)
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Create a GitHub issue
   */
  async createIssue(owner, repo, issueData) {
    try {
      const url = `${this.baseUrl}/repos/${owner}/${repo}/issues`;
      
      console.log(`📝 Creating GitHub issue in ${owner}/${repo}...`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'AgentHub-Integration'
        },
        body: JSON.stringify({
          title: issueData.title,
          body: issueData.body,
          labels: issueData.labels || [],
          assignees: issueData.assignees || []
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub API error (${response.status}): ${error}`);
      }

      const issue = await response.json();
      console.log(`✅ Created issue #${issue.number}: ${issue.title}`);
      
      return {
        success: true,
        issue: {
          number: issue.number,
          title: issue.title,
          url: issue.html_url,
          state: issue.state,
          created_at: issue.created_at
        }
      };
    } catch (error) {
      console.error('❌ Failed to create GitHub issue:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create multiple issues from agent results
   */
  async createIssuesFromAgentResults(owner, repo, agentResults) {
    const createdIssues = [];
    
    for (const result of agentResults) {
      const issue = await this.createIssue(owner, repo, {
        title: result.title,
        body: result.description,
        labels: result.labels || ['agent-generated']
      });
      
      if (issue.success) {
        createdIssues.push(issue.issue);
      }
      
      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return {
      success: true,
      created: createdIssues.length,
      issues: createdIssues
    };
  }

  /**
   * Test GitHub connection
   */
  async testConnection(owner, repo) {
    try {
      // First, test if the token is valid by checking user authentication
      const userUrl = `${this.baseUrl}/user`;
      console.log(`🔍 Testing token authentication...`);
      
      const userResponse = await fetch(userUrl, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AgentHub-Integration'
        }
      });
      
      if (!userResponse.ok) {
        const errorBody = await userResponse.text();
        console.log(`❌ Token authentication failed:`, errorBody);
        throw new Error(`Invalid GitHub token (Status: ${userResponse.status})`);
      }
      
      const userData = await userResponse.json();
      console.log(`✅ Token is valid for user: ${userData.login}`);
      
      // Now test repository access
      const url = `${this.baseUrl}/repos/${owner}/${repo}`;
      
      console.log(`🔍 Testing repository access: ${url}`);
      console.log(`🔑 Token: ${this.token.substring(0, 20)}...`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AgentHub-Integration'
        }
      });

      console.log(`📡 GitHub API Response Status: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.text();
        console.log(`❌ GitHub API Error Body:`, errorBody);
        
        let errorMessage = `Repository not found or no access`;
        try {
          const errorJson = JSON.parse(errorBody);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch (e) {
          // Not JSON, use status code
        }
        
        // Provide helpful error message
        if (response.status === 404) {
          errorMessage = `Repository '${owner}/${repo}' not found. Please check:\n1. Repository exists\n2. Token has access to this repository\n3. For fine-grained tokens, grant repository access in token settings`;
        }
        
        throw new Error(errorMessage);
      }

      const repoData = await response.json();
      console.log(`✅ Repository found: ${repoData.full_name}`);
      
      return {
        success: true,
        repository: {
          name: repoData.full_name,
          private: repoData.private,
          hasIssues: repoData.has_issues,
          url: repoData.html_url
        }
      };
    } catch (error) {
      console.error(`❌ GitHub connection test failed:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get repository issues
   */
  async getIssues(owner, repo, options = {}) {
    try {
      const params = new URLSearchParams({
        state: options.state || 'open',
        per_page: options.limit || 10,
        sort: 'created',
        direction: 'desc'
      });

      const url = `${this.baseUrl}/repos/${owner}/${repo}/issues?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AgentHub-Integration'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const issues = await response.json();
      
      return {
        success: true,
        issues: issues.map(issue => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          url: issue.html_url,
          created_at: issue.created_at,
          labels: issue.labels.map(l => l.name)
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new GitHubService();
