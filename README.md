# gomcp

![gomcp](gomcp.png)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh.md) | [Español](README.es.md)

[![npm version](https://badge.fury.io/js/gomcp.svg)](https://badge.fury.io/js/gomcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A simple way to set up MCP servers for Claude Code. Pick the tools you need, and we'll handle the installation and configuration.


## Quick Start

```bash
# Just run this:
npx gomcp

# Or if you prefer to install it globally:
npm install -g gomcp
gomcp
```

That's it! The interactive menu will guide you through everything.

## What is this?

If you're using Claude Code, you probably want to connect it to various tools (called MCP servers) - things like GitHub, file system access, databases, etc. Setting these up manually is kind of a pain. This tool makes it easy.

## Features

- Interactive menu to pick which servers you want
- Handles all the installation and configuration
- Supports both global and project-specific installations
- Backup and restore your configurations
- Works with npm, yarn, or pnpm

## Installation

You don't really need to install it. Just use:
```bash
npx gomcp
```

But if you want it globally:
```bash
npm install -g gomcp
# or yarn global add gomcp
# or pnpm add -g gomcp
```

Requirements: Node.js 16+ and Claude Code installed.

## How to Use

### Interactive Mode (Recommended)

Just run:
```bash
gomcp
```

You'll get a menu where you can:
- Install new servers
- Update existing ones
- Verify what's installed
- Backup/restore configurations
- Change language (supports English, Korean, Japanese, Chinese, Spanish)

### Command Line Options

If you know what you want:
```bash
# Install a preset
gomcp --preset recommended  # Gets you started with the basics
gomcp --preset dev         # For development work
gomcp --preset data        # For data analysis

# Other useful commands
gomcp --list               # See all available servers
gomcp --verify             # Check what's installed
gomcp --scope project      # Install for current project only
```

### Installation Scopes

**User (Global)** - The default. Servers work in all your projects.

**Project** - Only for the current project. Good for team collaboration because it creates a `.mcp.json` file that you can commit. When teammates clone the repo, Claude Code will ask them to approve the servers.



## Available Servers

We've got a bunch of MCP servers organized by category. Here are some popular ones:

**Essential Tools**
- GitHub - Work with repos, issues, PRs
- File System - Read/write files locally
- Context7 - Get docs for any library
- Sequential Thinking - Break down complex tasks
- Serena - Smart code editing assistant

**Development**
- PostgreSQL, Docker, Puppeteer, Supabase

**Productivity**
- Slack, Notion, Memory (knowledge graph)

**AWS Tools**
- Everything from CDK to Lambda to RDS

...and many more. Run `gomcp --list` to see them all.

## Presets

Don't want to pick servers one by one? We have presets:

- `recommended` - The basics to get started
- `dev` - Full development setup
- `data` - For data analysis
- `web` - Web development tools
- `productivity` - Team collaboration
- `aws` - AWS development

## Configuration

When a server needs API keys or settings, we'll ask you during installation. For example, GitHub will ask for your personal access token.

For the File System server, you'll pick which directories Claude can access. Pretty straightforward.

Config files live in:
- `~/.claude/config.json` (user settings)
- `./.mcp.json` (project settings)

## Team Collaboration

Working on a team? Use project scope:

1. Install servers: `gomcp --scope project`
2. Commit the `.mcp.json` file
3. When teammates clone the repo and run `claude`, they'll be prompted to approve the servers

That's it. Everyone gets the same setup.

## Development

Want to contribute?

```bash
git clone https://github.com/coolwithyou/gomcp.git
cd gomcp
npm install
npm run build
npm test
```

The code is pretty straightforward - TypeScript, uses Inquirer for the UI, and follows standard npm practices.

## Contributing

Feel free to contribute! Just fork, make your changes, and send a PR. We're pretty chill about contributions - just make sure the tests pass.

## FAQ

**What's MCP?**  
It's the protocol that lets Claude Code connect to external tools.

**How do I update gomcp?**  
`npm update -g gomcp`

**Can I use this without Claude Code?**  
Nope, it's specifically for Claude Code.

**How do I remove a server?**  
Run gomcp, go to "Update existing servers", and uncheck what you don't want.

## License

MIT - do whatever you want with it.

---

Thanks to the Claude Code team for MCP and everyone who's contributed to the various MCP servers. You're all awesome.

[Report bugs](https://github.com/coolwithyou/gomcp/issues) | [Request features](https://github.com/coolwithyou/gomcp/issues) | [Discussions](https://github.com/coolwithyou/gomcp/discussions)