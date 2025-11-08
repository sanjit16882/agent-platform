# GitHub MCP Server

A Model Context Protocol (MCP) server that provides GitHub integration for the Agent Hub platform.

## Features

- **Repository Management**: List, search, and get detailed repository information
- **Issue Tracking**: List issues, create new issues, manage labels and assignees
- **Pull Requests**: List and monitor pull requests
- **User Information**: Get GitHub user profiles and statistics
- **Search**: Advanced repository and code search capabilities

## Available Tools

| Tool | Description |
|------|-------------|
| `list_repositories` | List repositories for a user or organization |
| `get_repository` | Get detailed information about a specific repository |
| `list_issues` | List issues for a repository with filtering |
| `create_issue` | Create a new issue in a repository |
| `list_pull_requests` | List pull requests for a repository |
| `search_repositories` | Search GitHub repositories with advanced queries |
| `get_user` | Get information about a GitHub user |

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and configure your GitHub token:

```bash
cp .env.example .env
```

Edit `.env` and set your GitHub Personal Access Token:

```env
GITHUB_TOKEN=your_github_personal_access_token_here
```

### 3. Create GitHub Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `public_repo` - for public repository access
   - `repo` - for private repository access (if needed)
   - `user` - for user information access
4. Copy the generated token to your `.env` file

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Testing

Run the built-in test suite:

```bash
npm test
```

### Docker

Build and run with Docker:

```bash
npm run build
npm run docker:run
```

## API Endpoints

When running in production mode, the server also provides HTTP endpoints:

- `GET /health` - Health check endpoint
- `GET /tools` - List available MCP tools

## Example Usage

### List Repositories

```javascript
{
  "name": "list_repositories",
  "arguments": {
    "owner": "microsoft",
    "type": "public",
    "sort": "stars",
    "per_page": 10
  }
}
```

### Search Repositories

```javascript
{
  "name": "search_repositories",
  "arguments": {
    "q": "language:javascript stars:>1000 topic:react",
    "sort": "stars",
    "per_page": 5
  }
}
```

### Create Issue

```javascript
{
  "name": "create_issue",
  "arguments": {
    "owner": "your-username",
    "repo": "your-repo",
    "title": "Bug: Application crashes on startup",
    "body": "Detailed description of the issue...",
    "labels": ["bug", "high-priority"],
    "assignees": ["developer1"]
  }
}
```

## Integration with Agent Hub

This MCP server is designed to work with the Agent Hub platform:

1. **ECS Deployment**: Runs as a containerized service in AWS ECS
2. **Load Balancer**: Accessible through the MCP Application Load Balancer
3. **Health Checks**: Provides health endpoints for AWS ALB monitoring
4. **Logging**: Structured logging for CloudWatch integration
5. **Security**: Follows security best practices for production deployment

## Rate Limiting

GitHub API has rate limits:
- **Authenticated requests**: 5,000 requests per hour
- **Unauthenticated requests**: 60 requests per hour

The server automatically handles rate limiting and provides appropriate error messages.

## Error Handling

The server provides detailed error messages for common issues:
- Invalid GitHub tokens
- Repository not found
- Insufficient permissions
- Rate limit exceeded
- Network connectivity issues

## Security Considerations

- Store GitHub tokens securely (use AWS Secrets Manager in production)
- Use least-privilege access tokens
- Enable audit logging for sensitive operations
- Regularly rotate access tokens
- Monitor for unusual API usage patterns

## Troubleshooting

### Common Issues

1. **"Bad credentials" error**
   - Check that GITHUB_TOKEN is set correctly
   - Verify token has required permissions
   - Ensure token hasn't expired

2. **"Not Found" errors**
   - Verify repository/user names are correct
   - Check if you have access to private repositories
   - Ensure the resource exists

3. **Rate limit errors**
   - Wait for rate limit to reset
   - Use authenticated requests for higher limits
   - Implement request caching if needed

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.