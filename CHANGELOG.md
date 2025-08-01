# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.12.4] - 2025-08-01

### Added
- Initial release of gomcp - Interactive MCP Setup for Claude Code
- Interactive CLI for installing and managing MCP servers
- Support for 30+ MCP servers across multiple categories
- Preset collections for quick setup (recommended, dev, data, web, productivity)
- User (global) and project-level installation scopes
- Configuration backup and restore functionality
- Automatic server updates detection
- Comprehensive test suite with 31 tests
- TypeScript support with full type definitions
- Beautiful terminal UI with Inquirer.js and Chalk

### Features
- 📦 Smart categorization of MCP servers (Essential, Development, Productivity, Data, etc.)
- 🎯 Interactive checkbox selection for choosing servers
- ⚡ Quick installation with preset collections
- 🔧 Guided configuration for servers requiring API keys
- ✅ Installation verification with `/mcp` command
- 💾 Flexible backup/restore (user-only, project-only, or all)
- 🌍 Multi-scope support for user and project installations
- 🔄 Update management for installed servers
- 🔒 Project-only servers (Serena, Memory Bank) with scope enforcement
- 📁 Project-preferred servers with recommendations

### Supported MCP Servers
- **Essential**: GitHub, File System, Context7, Sequential Thinking
- **Development**: PostgreSQL, Docker, Puppeteer, Playwright, Sourcegraph, Serena
- **Productivity**: Slack, Notion, Memory Bank, Email, Discord
- **Data & Analytics**: Jupyter, Excel, SciPy
- **Automation**: Zapier, Stripe
- **Search**: DuckDuckGo, Brave Search
- **Media**: YouTube, Figma

### Technical Implementation
- Built with TypeScript for type safety
- ESM modules for modern JavaScript
- Commander.js for CLI argument parsing
- Inquirer.js for interactive prompts
- Chalk for beautiful terminal colors
- Ora for elegant loading spinners
- Execa for subprocess management
- Jest for testing with focused test suite
- Proper error handling and validation

### Project Structure
- Clean separation of concerns (UI, business logic, data)
- Modular architecture for easy maintenance
- Comprehensive type definitions
- Well-documented codebase

This is the first public release of gomcp. We're excited to help developers set up MCP servers for Claude Code quickly and easily!

[0.12.4]: https://github.com/coolwithyou/gomcp/releases/tag/v0.12.4