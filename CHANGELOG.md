# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive test suite with Jest
- ESLint and Prettier configuration
- GitHub Actions CI/CD pipeline
- Contributing guidelines
- Issue and PR templates
- Separate backup/restore functionality for user and project configurations
  - `backupUserConfig()` - Backup only user-level configuration
  - `backupProjectConfig()` - Backup only project-level configuration
  - `restoreUserConfig()` - Restore only user-level configuration
  - `restoreProjectConfig()` - Restore only project-level configuration
  - New backup format (v2.1) with type field to distinguish backup types
  - Enhanced UI with submenu for backup/restore operations
- Project-only MCP server support
  - `forceProjectScope` field to enforce project-level installation
  - `preferredScope` field to recommend installation scope
  - Visual indicators in UI (🔒 for project-only, 📁 for project-preferred)
  - `--force` flag to override scope recommendations
  - Serena and Memory Bank marked as project-only servers
  - PostgreSQL, Supabase, and Jupyter marked as project-preferred

### Changed
- `backupConfig()` and `restoreConfig()` now support both legacy and new backup formats
- Backup file naming convention:
  - User backups: `mcp-user-backup-{timestamp}.json`
  - Project backups: `mcp-project-backup-{timestamp}.json`
  - Full backups: `mcp-backup-{timestamp}.json`
- Server installation now validates scope requirements
- Interactive UI displays scope preferences for each server
- README documentation expanded with project vs user-level MCP guidance

## [1.0.0] - 2024-01-15

### Added
- Initial release of gomcp
- Interactive CLI for installing MCP servers
- Support for 25+ MCP servers across different categories
- Preset installations (recommended, dev, data, web, productivity)
- User (global) and project-level installation scopes
- Server configuration management with validation
- Backup and restore functionality
- Update checking and server updates
- Verification of installed servers
- Custom preset support
- Comprehensive server categorization:
  - Essential: GitHub, File System, Context7
  - Development: Sequential Thinking, PostgreSQL, Docker, Puppeteer, etc.
  - Productivity: Slack, Notion, Memory Bank
  - Data & Analytics: Jupyter, Excel
  - Automation: Zapier, Stripe
  - Social: Discord, Email

### Features
- 📦 Interactive server selection with categories
- 🎯 Smart server recommendations
- ⚡ Quick preset installations
- 🔧 Guided configuration for servers requiring API keys
- ✅ Installation verification
- 💾 Configuration backup/restore
- 🌍 Multi-scope support (user/project)
- 🔄 Server update management

### Technical Details
- Built with TypeScript for type safety
- Uses Commander.js for CLI parsing
- Inquirer.js for interactive prompts
- Chalk for colorful output
- Ora for spinner animations
- Execa for subprocess management

## [0.9.0] - 2024-01-10 (Beta)

### Added
- Beta release for testing
- Core installation functionality
- Basic server definitions
- Interactive mode

### Changed
- Refined server categorization
- Improved error handling

### Fixed
- Installation issues with certain servers
- Config file permissions

## [0.1.0] - 2024-01-01 (Alpha)

### Added
- Initial proof of concept
- Basic CLI structure
- Support for essential servers only

[Unreleased]: https://github.com/yourusername/gomcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/gomcp/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/yourusername/gomcp/compare/v0.1.0...v0.9.0
[0.1.0]: https://github.com/yourusername/gomcp/releases/tag/v0.1.0