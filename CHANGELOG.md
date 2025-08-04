## [v0.12.5] - 2025-08-03

### Features

- Enhance MCP server management with expanded catalog and improved UX (#3)

### Bug Fixes

- remove trailing space in changelog.ts
- handle undefined subject parameter in changelog generation

### Documentation

- update README server lists with detailed descriptions and categories

### Chores

- origin/main



# Changelog

## [0.13.0] - 2025-08-03

### Added
- **Multi-language Support**: Complete internationalization (i18n) support for 5 languages
  - English (en), Korean (ko), Chinese (zh), Spanish (es), Japanese (ja)
  - All UI elements, menus, messages, prompts, and errors are now localized
  - Language preference is saved and persisted between sessions
  - New \"Change Language\" menu option for easy language switching
  - Automatic fallback to English for missing translations

- **Expanded MCP Server Catalog**: Added 30+ new MCP servers with detailed metadata
  - New servers include: Serena, Browser Tools, Chrome, Figma, Supabase, Google Suite, Everything Search, EVM, Redis, DuckDuckGo, Brave Search, Screenshot, Zapier, Stripe, YouTube, Discord, Replicate, Hyperbolic, Databricks, Kubernetes, HAProxy, Netbird, OPNSense, Domain Tools, Splunk, Solana Agent Kit, Reed Jobs, Time, MCP Compass, MCP Server Creator, MCP Installer, MCP Proxy
  - Servers now have detailed descriptions and categorization
  - Added `preferredScope` and `forceProjectScope` properties for better installation guidance

- **UI/UX Improvements**:
  - New `--show-descriptions` (-d) flag to control server description visibility
  - Custom progress bar utilities replacing ora spinner for better feedback
  - Indeterminate progress bars for unknown duration tasks
  - Time-based progress bars for tasks with estimated time
  - Single-line title display (version now appears on the same line as the title)

### Enhanced
- **Better Scope Detection**: Improved detection of user-level vs project-level MCP servers
- **Release Command**: Enhanced error handling and TypeScript type safety
- **Build Process**: Updated to include translation files in the distribution

### Documentation
- Added Spanish README (README.es.md)
- Updated all README files with expanded server lists and detailed descriptions
- Added language selection links to all README files

### Fixed
- User scope MCP server detection now correctly parses `claude mcp list` output
- Fixed TypeScript type errors in release command
- Fixed lint errors and trailing spaces

## [0.12.5] - 2025-08-02


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