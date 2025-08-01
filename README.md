# gomcp - Interactive MCP Setup for Claude Code

<div align="center">

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh.md)

</div>

[![npm version](https://badge.fury.io/js/gomcp.svg)](https://badge.fury.io/js/gomcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/gomcp.svg)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com)

> 🚀 **Go MCP!** - From zero to AI superpowers in 30 seconds. Pick your tools, we'll handle the rest.


## Table of Contents

- [gomcp - Interactive MCP Setup for Claude Code](#gomcp---interactive-mcp-setup-for-claude-code)
	- [Table of Contents](#table-of-contents)
	- [Features](#features)
	- [Quick Start](#quick-start)
	- [Installation](#installation)
		- [Using npm](#using-npm)
		- [Using yarn](#using-yarn)
		- [Using pnpm](#using-pnpm)
		- [Requirements](#requirements)
	- [Usage](#usage)
		- [Interactive Mode](#interactive-mode)
		- [Command Line Options](#command-line-options)
		- [Installation Scopes](#installation-scopes)
			- [User (Global)](#user-global)
			- [Project](#project)
	- [Available MCP Servers](#available-mcp-servers)
		- [Essential](#essential)
		- [Development](#development)
		- [Productivity](#productivity)
		- [Data \& Analytics](#data--analytics)
		- [And many more...](#and-many-more)
	- [Presets](#presets)
	- [Configuration](#configuration)
		- [Server Configuration](#server-configuration)
		- [File System Access](#file-system-access)
		- [Configuration Files](#configuration-files)
	- [Project Structure](#project-structure)
	- [Development](#development-1)
		- [Setup](#setup)
		- [Architecture](#architecture)
	- [Testing](#testing)
		- [Test Structure](#test-structure)
	- [Contributing](#contributing)
		- [Quick Start for Contributors](#quick-start-for-contributors)
		- [Development Guidelines](#development-guidelines)
	- [Roadmap](#roadmap)
	- [FAQ](#faq)
	- [License](#license)
	- [Acknowledgments](#acknowledgments)

## Features

- 📦 **Interactive Installation**: Select MCP servers with a user-friendly checkbox interface
- 🎯 **Smart Categorization**: Servers organized by category (Essential, Development, Productivity, etc.)
- ⚡ **Quick Presets**: Install common server combinations with one command
- 🔧 **Auto Configuration**: Guided setup for servers requiring API keys or settings
- ✅ **Verification**: Check the status of installed MCP servers
- 💾 **Backup/Restore**: Save and restore your MCP configurations
- 🌍 **Multi-scope Support**: Install globally or per-project
- 🔄 **Update Management**: Keep your MCP servers up to date

## Quick Start

```bash
# Run directly with npx (recommended)
npx gomcp

# Or install globally
npm install -g gomcp
gomcp
```

## Installation

### Using npm

```bash
npm install -g gomcp
```

### Using yarn

```bash
yarn global add gomcp
```

### Using pnpm

```bash
pnpm add -g gomcp
```

### Requirements

- Node.js >= 16.0.0
- Claude Code installed and accessible in PATH
- Git (for some MCP servers)

## Usage

### Interactive Mode

Simply run `gomcp` to start the interactive menu:

```bash
gomcp
```

You'll see an interactive menu with options to:
- 🆕 Install new servers (with scope selection)
- 🔄 Update existing servers
- ✅ Verify installations
- 💾 Backup/restore configurations
- 📋 List available servers

### Backup and Restore

gomcp provides flexible backup and restore options:

**Backup Options:**
- 👤 **User configuration only** - Backs up global MCP settings (~/.claude/config.json)
- 📁 **Project configuration only** - Backs up project-specific settings (.mcp.json)
- 💾 **All configurations** - Backs up both user and project settings

**Restore Options:**
- Automatically detects backup type and restores accordingly
- Option to restore specific configuration types
- Creates backups of existing configurations before restoring

**Backup File Naming:**
- User backups: `mcp-user-backup-{timestamp}.json`
- Project backups: `mcp-project-backup-{timestamp}.json`
- Full backups: `mcp-backup-{timestamp}.json`

### Command Line Options

```bash
# Install with different scopes
gomcp                       # Interactive mode (prompts for scope)
gomcp --scope user          # Install globally (default)
gomcp --scope project       # Install for current project only

# Install a preset collection
gomcp --preset recommended  # GitHub, File System, Sequential Thinking
gomcp --preset dev          # Development tools preset
gomcp --preset data         # Data analysis preset

# Install preset with specific scope
gomcp --preset dev --scope project  # Install dev preset for project only

# List all available servers
gomcp --list

# Verify installed servers
gomcp --verify

# Show version
gomcp --version

# Show help
gomcp --help
```

### Installation Scopes

#### User (Global)
- Servers are available in all your projects
- Use `--scope user` or select "User" in interactive mode
- This is the default scope
- Config location: `~/.claude/mcp.json`
- Best for: General-purpose tools (GitHub, File System, Context7)

#### Project
- Servers are only available in the current project
- Use `--scope project` or select "Project" in interactive mode
- Creates both `.mcp.json` (for team sharing) and activates in Claude Code
- Config location: `./.mcp.json` (project root)
- Best for: Project-specific tools (Serena, Memory Bank, database connections)

**How Project Scope Works:**
1. Creates/updates `.mcp.json` in your project root
2. Also runs `claude mcp add -s project` for immediate activation
3. Team members who clone the project will see the `.mcp.json` and can approve the servers
4. Use `claude mcp reset-project-choices` to reset approval decisions

### Project-only vs User-level MCP Servers

Some MCP servers are designed to work best (or exclusively) at the project level:

#### 🔒 Project-only Servers
These servers **must** be installed at the project level:
- **Serena**: Maintains project-specific code memory and context
- **Memory Bank**: Stores persistent memory per project

#### 📁 Project-preferred Servers
These servers work best at the project level but can be installed globally with `--force`:
- **PostgreSQL**: Database connections should be project-specific
- **Supabase**: Each project typically uses its own Supabase instance
- **Jupyter**: Virtual environments and dependencies are project-specific

#### 👤 User-preferred Servers
These servers work best at the user level for convenience:
- **GitHub**: Use the same GitHub token across all projects
- **File System**: Access common directories from any project
- **Context7**: Documentation lookup works the same everywhere

When installing a server at a non-recommended scope, gomcp will warn you about potential issues. Use the `--force` flag to override these warnings if you understand the implications.

## Available MCP Servers

### Essential
- 🐙 **GitHub** - Connect to GitHub API for issues, PRs, and CI/CD
- 📁 **File System** - Read and write files on your machine
- 📚 **Context7** - Access documentation for any library

### Development
- 🧠 **Sequential Thinking** - Break down complex tasks step by step
- 🐘 **PostgreSQL** - Query databases with natural language
- 🌐 **Puppeteer** - Automate web browser interactions
- 🐳 **Docker** - Manage containers and images
- 🔍 **Sourcegraph** - Code search across repositories

### Productivity
- 💬 **Slack** - Team communication integration
- 📝 **Notion** - Access and manage workspaces
- 💾 **Memory Bank** - Persistent memory across sessions
- 📧 **Email** - Send and manage emails

### Data & Analytics
- 📊 **Jupyter** - Interactive computing and data science
- 📈 **Excel** - Read and manipulate spreadsheets
- 🔬 **SciPy** - Scientific computing tools

### And many more...

Run `gomcp --list` to see all available servers with descriptions.

## Presets

Quick installation of common server combinations:

| Preset         | Included Servers                                   | Use Case                             |
| -------------- | -------------------------------------------------- | ------------------------------------ |
| `recommended`  | GitHub, File System, Sequential Thinking, Context7 | Getting started with essential tools |
| `dev`          | All recommended + PostgreSQL, Docker, Puppeteer    | Full development environment         |
| `data`         | Jupyter, Excel, SciPy, PostgreSQL                  | Data analysis and visualization      |
| `web`          | Puppeteer, File System, GitHub                     | Web development and automation       |
| `productivity` | Slack, Notion, Memory Bank, Email                  | Team collaboration                   |

## Configuration

### Server Configuration

When installing servers that require configuration (API keys, tokens, etc.), gomcp will guide you through the setup process:

```
📝 Configure GitHub:
? GitHub Personal Access Token: **********************
? Default repository (optional): owner/repo
```

### File System Access

For the File System server, you can select which directories Claude can access:

```
? Select directories to allow access: 
❯◉ ~/Documents
 ◉ ~/Projects
 ◯ ~/Desktop
 ◯ ~/Downloads
 ◯ Custom path...
```

### Configuration Files

- **User config**: `~/.claude/config.json` - Claude Code configuration
- **Project config**: `./.mcp.json` - Project-specific MCP servers
- **Backups**: Created in current directory with timestamp

## Project Structure

```
gomcp/
├── src/
│   ├── index.ts        # CLI entry point
│   ├── types.ts        # TypeScript type definitions
│   ├── servers.ts      # MCP server definitions
│   ├── installer.ts    # Installation logic
│   ├── ui.ts          # Interactive UI components
│   └── config.ts      # Configuration management
├── tests/             # Test files
├── dist/              # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/coolwithyou/gomcp.git
cd gomcp

# Install dependencies
npm install

# Build
npm run build

# Run in development
npm run dev
```

### Architecture

gomcp follows a modular architecture:

- **UI Layer** (`ui.ts`): Handles all user interactions using Inquirer.js
- **Business Logic** (`installer.ts`): Core functionality for installing/managing servers
- **Data Layer** (`servers.ts`, `config.ts`): Server definitions and configuration
- **Type Safety** (`types.ts`): TypeScript interfaces for type checking

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test interactions between modules
- **E2E Tests**: Test complete user workflows

## Team Collaboration

When working in a team, project-scoped MCP servers enable seamless collaboration:

### Setting Up Project Servers

1. **Install servers at project scope:**
   ```bash
   gomcp --scope project
   # Or select "Project" in interactive mode
   ```

2. **Commit the `.mcp.json` file:**
   ```bash
   git add .mcp.json
   git commit -m "Add project MCP servers configuration"
   ```

### For Team Members

When cloning a project with `.mcp.json`:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Start Claude Code:**
   ```bash
   claude
   ```

3. **Approve project servers:**
   - Claude Code will prompt you to approve the project's MCP servers
   - Review the servers and approve if they're expected
   - Use `/mcp` to verify servers are connected

4. **Reset approvals if needed:**
   ```bash
   claude mcp reset-project-choices
   ```

### Best Practices

- Only commit `.mcp.json`, not `.claude/` directory
- Document required environment variables in your README
- Use project scope for:
  - Development databases
  - Project-specific AI memory (Serena, Memory Bank)
  - API connections specific to the project
- Use user scope for:
  - Personal tools (GitHub with your token)
  - General utilities (File System, Context7)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow the existing code style
- Update documentation as needed
- Add yourself to the contributors list

## Roadmap

- [ ] Plugin system for custom MCP servers
- [ ] Web-based configuration UI
- [ ] Server health monitoring
- [ ] Automated server updates
- [ ] Configuration templates
- [ ] Multi-language support
- [ ] Performance profiling tools
- [ ] Server dependency management

See the [open issues](https://github.com/coolwithyou/gomcp/issues) for a full list of proposed features and known issues.

## FAQ

**Q: What is MCP (Model Context Protocol)?**
A: MCP is a protocol that allows Claude to interact with external tools and services, extending its capabilities beyond text generation.

**Q: How do I update gomcp?**
A: Run `npm update -g gomcp` or use your package manager's update command.

**Q: Can I use gomcp without Claude Code?**
A: No, gomcp is specifically designed to work with Claude Code's MCP implementation.

**Q: How do I uninstall an MCP server?**
A: Use the interactive mode and select "Update existing servers", then uncheck the servers you want to remove.

**Q: Where are my API keys stored?**
A: API keys are stored in the MCP configuration file (`~/.claude/mcp.json`) with appropriate file permissions.

**Q: Can I create custom presets?**
A: Yes! You can save your current configuration as a custom preset through the interactive menu.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- The Claude Code team at Anthropic for creating MCP
- All MCP server authors and contributors
- The open-source community for feedback and contributions

---

<p align="center">
  Made with ❤️ for the Claude Code community
</p>

<p align="center">
  <a href="https://github.com/coolwithyou/gomcp/issues/new?assignees=&labels=bug&template=bug_report.md&title=">Report Bug</a>
  ·
  <a href="https://github.com/coolwithyou/gomcp/issues/new?assignees=&labels=enhancement&template=feature_request.md&title=">Request Feature</a>
  ·
  <a href="https://github.com/coolwithyou/gomcp/discussions">Join Discussion</a>
</p>