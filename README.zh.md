# gomcp

![gomcp](gomcp.png)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh.md) | [Español](README.es.md)

[![npm version](https://badge.fury.io/js/gomcp.svg)](https://badge.fury.io/js/gomcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

为 Claude Code 轻松设置 MCP 服务器的工具。选择你需要的工具，安装和配置都交给我们。

## 快速开始

```bash
# 直接运行这个：
npx gomcp

# 或者全局安装：
npm install -g gomcp
gomcp
```

就这样！交互式菜单会引导你完成所有操作。

## 这是什么？

如果你在用 Claude Code，你可能想要连接各种工具（叫做 MCP 服务器）——比如 GitHub、文件系统、数据库等等。手动设置这些东西有点麻烦。这个工具让一切变得简单。

## 功能

- 交互式菜单，选择你想要的服务器
- 自动处理所有安装和配置
- 支持全局和项目级安装
- 备份和恢复配置
- 支持 npm、yarn、pnpm

## 安装

不需要安装。直接运行：
```bash
npx gomcp
```

如果想全局安装：
```bash
npm install -g gomcp
# 或 yarn global add gomcp
# 或 pnpm add -g gomcp
```

需要的东西：Node.js 16 以上，Claude Code 已安装。

## 使用方法

### 交互模式（推荐）

直接运行：
```bash
gomcp
```

你会看到一个菜单，可以：
- 安装新服务器
- 更新现有服务器
- 验证安装了什么
- 备份/恢复配置
- 更改语言（支持中文、英语、韩语、日语、西班牙语）

### 命令行选项

如果你知道自己想要什么：
```bash
# 安装预设
gomcp --preset recommended  # 基础套装开始
gomcp --preset dev         # 完整开发环境
gomcp --preset data        # 数据分析工具

# 其他有用的命令
gomcp --list               # 查看所有可用服务器
gomcp --verify             # 检查安装了什么
gomcp --scope project      # 只为当前项目安装
```

### 安装范围

**用户（全局）** - 默认选项。服务器在所有项目中都可以用。

**项目** - 只在当前项目中。适合团队协作，因为会创建 `.mcp.json` 文件可以提交。团队成员克隆仓库后，Claude Code 会要求他们批准这些服务器。

## 可用的服务器

我们按类别整理了 MCP 服务器。这里介绍一些受欢迎的：

**必备工具**
- GitHub - 处理仓库、议题、PR
- File System - 读写本地文件
- Context7 - 获取任何库的文档
- Sequential Thinking - 分解复杂任务
- Serena - 智能代码编辑助手

**开发**
- PostgreSQL、Docker、Puppeteer、Supabase

**生产力**
- Slack、Notion、Memory（知识图谱）

**AWS 工具**
- 从 CDK 到 Lambda、RDS 各种工具

...还有很多。运行 `gomcp --list` 查看完整列表。

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