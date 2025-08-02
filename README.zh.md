# gomcp - Claude Code 的交互式 MCP 设置工具

<div align="center">

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh.md)

</div>

[![npm version](https://badge.fury.io/js/gomcp.svg)](https://badge.fury.io/js/gomcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/gomcp.svg)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com)

> 🚀 **Go MCP!** - 30秒内从零到AI超能力。选择你的工具，剩下的交给我们。

## 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [安装](#安装)
- [使用方法](#使用方法)
- [可用的 MCP 服务器](#可用的-mcp-服务器)
- [预设](#预设)
- [配置](#配置)
- [团队协作](#团队协作)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 功能特性

- 📦 **交互式安装**: 使用友好的复选框界面选择 MCP 服务器
- 🎯 **智能分类**: 按类别组织的服务器（必备、开发、生产力等）
- ⚡ **快速预设**: 一条命令安装常用服务器组合
- 🔧 **自动配置**: 为需要 API 密钥或设置的服务器提供引导设置
- ✅ **验证**: 检查已安装 MCP 服务器的状态
- 💾 **备份/恢复**: 保存和恢复你的 MCP 配置
- 🌍 **多作用域支持**: 全局或按项目安装
- 🔄 **更新管理**: 保持你的 MCP 服务器最新

## 快速开始

```bash
# 使用 npx 直接运行（推荐）
npx gomcp

# 或全局安装
npm install -g gomcp
gomcp
```

## 安装

### 使用 npm

```bash
npm install -g gomcp
```

### 使用 yarn

```bash
yarn global add gomcp
```

### 使用 pnpm

```bash
pnpm add -g gomcp
```

### 系统要求

- Node.js >= 16.0.0
- Claude Code 已安装并可在 PATH 中访问
- Git（某些 MCP 服务器需要）

## 使用方法

### 交互模式

只需运行 `gomcp` 即可启动交互式菜单：

```bash
gomcp
```

你将看到一个包含以下选项的菜单：
- 🆕 安装新服务器（含作用域选择）
- 🔄 更新现有服务器
- ✅ 验证安装
- 💾 备份/恢复配置
- 📋 列出可用服务器

### 备份和恢复

gomcp 提供灵活的备份和恢复选项：

**备份选项：**
- 👤 **仅用户配置** - 备份全局 MCP 设置（~/.claude/config.json）
- 📁 **仅项目配置** - 备份项目特定设置（.mcp.json）
- 💾 **所有配置** - 备份用户和项目设置

### 命令行选项

```bash
# 使用不同作用域安装
gomcp                       # 交互模式（询问作用域）
gomcp --scope user          # 全局安装（默认）
gomcp --scope project       # 仅为当前项目安装

# 安装预设集合
gomcp --preset recommended  # GitHub、File System、Sequential Thinking
gomcp --preset dev          # 开发工具预设
gomcp --preset data         # 数据分析预设

# 列出所有可用服务器
gomcp --list

# 验证已安装的服务器
gomcp --verify

# 显示版本
gomcp --version

# 显示帮助
gomcp --help
```

### 安装作用域

#### 用户（全局）
- 服务器在所有项目中可用
- 使用 `--scope user` 或在交互模式中选择 "User"
- 默认作用域
- 配置位置：`~/.claude/config.json`
- 推荐用于：通用工具（GitHub、File System、Context7）

#### 项目
- 服务器仅在当前项目中可用
- 使用 `--scope project` 或在交互模式中选择 "Project"
- 创建 `.mcp.json`（用于团队共享）并在 Claude Code 中激活
- 配置位置：`./.mcp.json`（项目根目录）
- 推荐用于：项目特定工具（Serena、Memory Bank、数据库连接）

## 可用的 MCP 服务器

### 必备
- 🐙 **GitHub** - 连接到 GitHub API 处理议题、PR 和 CI/CD
- 📁 **File System** - 读写机器上的文件
- 📚 **Context7** - 访问库的最新文档和代码示例
- 🧠 **Sequential Thinking** - 将复杂任务分解为逻辑步骤

### 开发
- 🐘 **PostgreSQL** - 使用自然语言查询 PostgreSQL 数据库
- 🌐 **Puppeteer** - Web 浏览器自动化和测试
- 🎭 **Playwright** - 使用可访问性树的跨浏览器自动化
- 🐳 **Docker** - 管理容器、镜像和 Docker 工作流
- 🛠️ **Serena** - 具有语义检索和编辑功能的强大编码代理工具包
- 🔧 **Browser Tools** - 监控浏览器日志和自动化浏览器任务
- 🌐 **Chrome** - 使用20多个工具控制 Chrome 浏览器
- 🎨 **Figma** - 设计到代码的工作流集成
- 🍃 **Supabase** - 管理 Supabase 数据库和身份验证

### 生产力
- 💬 **Slack** - 团队通信的 Slack 集成
- 📝 **Notion** - 访问和管理 Notion 工作区
- 💾 **Memory Bank** - Claude 会话间的持久内存
- 📧 **Email** - 发送邮件和管理附件
- 📊 **Google Suite** - 访问 Google Docs、Sheets 和 Drive
- 📈 **Excel** - 创建和修改 Excel 文件

### 数据与分析
- 📊 **Jupyter** - 在 Jupyter 笔记本中执行代码
- 🔬 **Everything Search** - 跨操作系统的快速文件搜索
- 🌍 **EVM** - 面向30多个EVM网络的综合区块链服务
- 🔑 **Redis** - 数据库操作和缓存微服务

### 搜索与Web
- 🦆 **DuckDuckGo** - 无需 API 密钥的隐私优先 Web 搜索
- 🦁 **Brave Search** - 使用 API 的隐私优先 Web 搜索
- 📸 **Screenshot** - 使用高级功能捕获网站截图

### 自动化与集成
- ⚡ **Zapier** - 跨5000多个应用自动化工作流
- 💳 **Stripe** - 集成 Stripe 支付 API
- 🎥 **YouTube** - 提取 YouTube 视频元数据和字幕
- 🔌 **Discord** - Discord 服务器的机器人自动化

### AI与机器学习
- 🤖 **Replicate** - 搜索、运行和管理机器学习模型
- 🧠 **Hyperbolic** - 与 Hyperbolic GPU 云服务交互
- 📈 **Databricks** - Databricks 的 SQL 查询和作业管理

### DevOps与基础设施
- ☸️ **Kubernetes (mcp-k8s-go)** - 浏览 Kubernetes pods、日志、事件和命名空间
- 📊 **HAProxy** - 管理和监控 HAProxy 配置
- 🌐 **Netbird** - 分析 Netbird 网络对等体、组和策略
- 🔥 **OPNSense** - OPNSense 防火墙管理和 API 访问

### 域名与安全
- 🔍 **Domain Tools** - 使用 WHOIS 和 DNS 进行综合域名分析
- 📡 **Splunk** - 访问 Splunk 保存的搜索、警报和索引

### 区块链与加密货币
- 🟣 **Solana Agent Kit** - 与 Solana 区块链交互（40多个协议操作）
- ⚡ **EVM** - 多链 EVM 区块链集成

### 求职与职业
- 💼 **Reed Jobs** - 从 Reed.co.uk 搜索和检索职位列表

### 时间与实用工具
- ⏰ **Time** - 获取当前时间并在时区间转换
- 🔧 **Everything** - 具有综合功能的快速文件搜索

### 元工具
- 🛠️ **MCP Compass** - 为特定需求建议合适的 MCP 服务器
- 🏗️ **MCP Server Creator** - 动态生成其他 MCP 服务器
- 📦 **MCP Installer** - 安装其他 MCP 服务器
- 🔄 **MCP Proxy** - 聚合多个 MCP 资源服务器

### 还有更多服务器...

运行 `gomcp --list` 查看所有可用服务器及说明。

## 预设

快速安装常用服务器组合：

| 预设           | 包含的服务器                                       | 使用场景               |
| -------------- | -------------------------------------------------- | ---------------------- |
| `recommended`  | GitHub、File System、Sequential Thinking、Context7 | 必备工具入门           |
| `dev`          | 所有推荐 + PostgreSQL、Docker、Puppeteer           | 完整开发环境           |
| `data`         | Jupyter、Excel、SciPy、PostgreSQL                  | 数据分析和可视化       |
| `web`          | Puppeteer、File System、GitHub                     | Web 开发和自动化       |
| `productivity` | Slack、Notion、Memory Bank、Email                  | 团队协作               |

## 配置

### 服务器配置

安装需要配置的服务器（API 密钥、令牌等）时，gomcp 将引导你完成设置过程：

```
📝 配置 GitHub：
? GitHub Personal Access Token: **********************
? 默认仓库（可选）: owner/repo
```

### 文件系统访问

对于 File System 服务器，你可以选择 Claude 可以访问的目录：

```
? 选择允许访问的目录: 
❯◉ ~/Documents
 ◉ ~/Projects
 ◯ ~/Desktop
 ◯ ~/Downloads
 ◯ 自定义路径...
```

## 团队协作

在团队中工作时，项目作用域的 MCP 服务器能够实现无缝协作：

### 设置项目服务器

1. **在项目作用域安装服务器：**
   ```bash
   gomcp --scope project
   # 或在交互模式中选择 "Project"
   ```

2. **提交 `.mcp.json` 文件：**
   ```bash
   git add .mcp.json
   git commit -m "Add project MCP servers configuration"
   ```

### 团队成员指南

克隆包含 `.mcp.json` 的项目时：

1. **克隆仓库：**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **启动 Claude Code：**
   ```bash
   claude
   ```

3. **批准项目服务器：**
   - Claude Code 将提示你批准项目的 MCP 服务器
   - 审查服务器并在符合预期时批准
   - 使用 `/mcp` 验证服务器已连接

## 贡献指南

我们欢迎贡献！详情请参阅[贡献指南](CONTRIBUTING.md)。

### 快速开始

1. Fork 仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'Add some amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

---

<p align="center">
  为 Claude Code 社区用 ❤️ 制作
</p>

<p align="center">
  <a href="https://github.com/coolwithyou/gomcp/issues/new?assignees=&labels=bug&template=bug_report.md&title=">报告错误</a>
  ·
  <a href="https://github.com/coolwithyou/gomcp/issues/new?assignees=&labels=enhancement&template=feature_request.md&title=">功能请求</a>
  ·
  <a href="https://github.com/coolwithyou/gomcp/discussions">参与讨论</a>
</p>