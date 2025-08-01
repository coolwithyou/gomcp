# Contributing to gomcp

First off, thank you for considering contributing to gomcp! It's people like you that make gomcp such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
  - [Git Commit Messages](#git-commit-messages)
  - [TypeScript Style Guide](#typescript-style-guide)
  - [Documentation Style Guide](#documentation-style-guide)
- [Testing](#testing)
- [Adding New MCP Servers](#adding-new-mcp-servers)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

## Getting Started

- Make sure you have a [GitHub account](https://github.com/signup/free)
- Fork the repository on GitHub
- Read the [README](README.md) for project overview
- Check the [Issues](https://github.com/coolwithyou/gomcp/issues) page

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Run command '...'
2. Select option '....'
3. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. macOS 14.0]
 - Node.js version: [e.g. 20.10.0]
 - gomcp version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description** of the suggested enhancement
- **Provide specific examples** to demonstrate the steps
- **Describe the current behavior** and **explain which behavior you expected to see instead**
- **Explain why this enhancement would be useful**

### Your First Code Contribution

Unsure where to begin contributing? You can start by looking through these `beginner` and `help-wanted` issues:

- [Beginner issues](https://github.com/coolwithyou/gomcp/issues?q=is%3Aissue+is%3Aopen+label%3Abeginner)
- [Help wanted issues](https://github.com/coolwithyou/gomcp/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the style guidelines
6. Issue that pull request!

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/coolwithyou/gomcp.git
   cd gomcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Run in development mode**
   ```bash
   npm run dev
   ```

## Style Guidelines

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
  - 🎨 `:art:` when improving the format/structure of the code
  - 🐛 `:bug:` when fixing a bug
  - 🔥 `:fire:` when removing code or files
  - 📝 `:memo:` when writing docs
  - 🚀 `:rocket:` when improving performance
  - ✅ `:white_check_mark:` when adding tests
  - 🔧 `:wrench:` when updating configuration
  - ♻️ `:recycle:` when refactoring code

### TypeScript Style Guide

We use TypeScript for type safety. Please follow these guidelines:

- Use meaningful variable names
- Add type annotations for function parameters and return types
- Use interfaces over type aliases where possible
- Avoid `any` type - use `unknown` if type is truly unknown
- Use const assertions where applicable
- Follow the existing code style in the project

Example:
```typescript
// Good
interface ServerConfig {
  id: string;
  name: string;
  enabled: boolean;
}

function getServerConfig(id: string): ServerConfig | undefined {
  // implementation
}

// Bad
function getServerConfig(id: any): any {
  // implementation
}
```

### Documentation Style Guide

- Use [Markdown](https://daringfireball.net/projects/markdown/) for documentation
- Reference functions and classes in backticks: `functionName()`
- Include code examples for complex features
- Keep line length to 80 characters where possible
- Use present tense

## Testing

- Write tests for any new functionality
- Ensure all tests pass before submitting PR
- Aim for high test coverage (80%+)
- Include both positive and negative test cases

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Tests are located in `src/__tests__/` and `tests/`. Follow the existing test structure:

```typescript
describe('Module Name', () => {
  describe('functionName', () => {
    it('should do something when condition is met', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionName(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## Adding New MCP Servers

To add a new MCP server to gomcp:

1. **Add server definition to `src/servers.ts`:**
   ```typescript
   {
     id: 'your-server',
     name: 'Your Server',
     description: 'Brief description of what it does',
     category: 'appropriate-category',
     package: '@organization/package-name',
     requiresConfig: true,
     configOptions: [
       {
         key: 'API_KEY',
         type: 'password',
         label: 'API Key',
         required: true
       }
     ]
   }
   ```

2. **Choose the appropriate category:**
   - `essential`: Core functionality servers
   - `development`: Programming and development tools
   - `productivity`: Team collaboration and productivity
   - `data`: Data analysis and processing
   - `automation`: Workflow automation
   - `social`: Social media and communication

3. **If adding to a preset, update the presets object:**
   ```typescript
   export const presets: Record<string, string[]> = {
     recommended: ['github', 'filesystem', 'your-server'],
     // ...
   };
   ```

4. **Add tests for your server configuration**

5. **Update documentation if needed**

## Questions?

Feel free to open an issue with your question or reach out to the maintainers directly.

Thank you for contributing! 🎉