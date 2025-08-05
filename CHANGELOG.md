## [v2.0.0] - 2025-08-05

### Features

- add automatic activation prompt after MCP server installation
- Add AWS server support and improve user experience (#9)

### Chores

- remove dist directory from git tracking
- 0.14.2



## [v1.0.0] - 2025-08-05

### 🎉 Major Release - Production Ready

This major release marks gomcp as production-ready with comprehensive AWS support and significant architectural improvements.

### ✨ Features

- **AWS Ecosystem Support**: Added 10 comprehensive AWS MCP servers including:
  - AWS Core (ore) - Central control and AI processing pipeline
  - AWS Documentation - Official AWS docs search and markdown conversion
  - AWS CDK - Infrastructure as code with security compliance
  - AWS Cost Explorer - Cost analysis and optimization tools
  - Amazon ECS - Container orchestration and deployment
  - AWS Lambda Tool - Lambda function execution for private AWS resources
  - Amazon RDS/Aurora - Database interaction and query capabilities
  - S3 Tables - S3-based table management and SQL query support
  - Amazon ElastiCache - Cache cluster management and operations
- **Supabase Integration**: Added Supabase server for backend-as-a-service functionality
- **Enhanced User Experience**: Rotating progress messages during MCP connection for better perceived performance
- **AWS Development Preset**: Quick setup preset for AWS development workflows

### 🔄 Breaking Changes

- **Simplified Server Management**: Removed preferredScope and forceProjectScope from server interface
- **Flexible Installation**: All servers now support both user and project scope installation
- **Streamlined Architecture**: Removed project-only server constraints

### 📚 Documentation

- Updated README with curated server approach emphasizing quality over quantity
- Added gomcp logo to all README translations (English, Spanish, Japanese, Korean, Chinese)
- Improved server descriptions and categorization

### 🧹 Maintenance

- Removed dist directory from git tracking (build artifacts)
- Updated tests to reflect simplified server management
- Enhanced code organization and structure

## [v0.14.2] - 2025-08-04

### Documentation

- Added gomcp terminal UI screenshot to README
- Enhanced visual appeal with project branding

## [v0.14.1] - 2025-08-04

### Bug Fixes

- **hotfix**: restore language selection menu and fix immediate language switching
  - Added missing language selection option back to main menu
  - Fixed language changes not applying immediately by using t() function
  - Updated all hardcoded menu texts to use i18n translations
  - Language changes now reflect immediately without restart

## [v0.14.0] - 2025-08-04

### Features

- Expanded MCP server catalog with detailed metadata
- Enhanced server installation UX with progress bars
- Added --show-descriptions flag for detailed server info

### Bug Fixes

- Fixed i18n implementation in installer module
- Resolved TypeScript and ESLint errors
- Improved CI workflow configuration

## [v0.13.0] - 2025-08-04

### Features

- enhance MCP server verification with detailed status reporting
- add --show-descriptions flag to control server description visibility
- expand MCP server catalog with detailed metadata
- add progress bar utilities for better UX

### Bug Fixes

- restore i18n implementation in installer.ts after merge conflict
- update CI workflow to use typecheck script instead of build with --noEmit
- update tests to match new i18n message keys
- resolve ESLint and TypeScript errors
- address code review feedback
- improve user scope MCP server detection

### Documentation

- update README with expanded server list

### Code Style

- remove trailing whitespace in i18n and update notification modules

### Code Refactoring

- remove unused i18n import from activation module

### Chores

- update package-lock.json
- 0.13.0
- [feat] 다국어 지원 기능 추가 (5개 언어: 영어, 한국어, 중국어, 스페인어, 일본어) (#4)



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