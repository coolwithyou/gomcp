# gomcp

![gomcp](gomcp.png)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh.md) | [Español](README.es.md)

[![npm version](https://badge.fury.io/js/gomcp.svg)](https://badge.fury.io/js/gomcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Claude Code用のMCPサーバーを簡単にセットアップできるツールです。必要なツールを選ぶだけで、インストールと設定は全部お任せ。

## クイックスタート

```bash
# これだけ実行すれば大丈夫：
npx gomcp

# グローバルにインストールしたい場合：
npm install -g gomcp
gomcp
```

これで完了！対話型メニューが全てガイドしてくれます。

## これは何？

Claude Codeを使っているなら、きっと色々なツール（MCPサーバーと呼ばれるもの）を接続したいと思うでしょう。GitHub、ファイルシステム、データベースなどです。手動でセットアップするのはちょっと面倒。このツールがそれを簡単にします。

## 機能

- 欲しいサーバーを選べる対話型メニュー
- インストールと設定を全て自動処理
- グローバルとプロジェクト単位の両方のインストールに対応
- 設定のバックアップと復元
- npm、yarn、pnpmに対応

## インストール

インストールは必要ありません。ただこれを実行：
```bash
npx gomcp
```

グローバルにインストールしたいなら：
```bash
npm install -g gomcp
# または yarn global add gomcp
# または pnpm add -g gomcp
```

必要なもの：Node.js 16以上、Claude Codeがインストール済み。

## 使い方

### 対話型モード（おすすめ）

ただ実行するだけ：
```bash
gomcp
```

メニューでこんなことができます：
- 新しいサーバーをインストール
- 既存サーバーを更新
- インストール済みを確認
- 設定をバックアップ/復元
- 言語を変更（日本語、英語、韓国語、中国語、スペイン語に対応）

### コマンドラインオプション

何が欲しいか分かっているなら：
```bash
# プリセットをインストール
gomcp --preset recommended  # 基本セットでスタート
gomcp --preset dev         # 開発環境一式
gomcp --preset data        # データ分析用

# その他便利なコマンド
gomcp --list               # 全サーバーを表示
gomcp --verify             # 何がインストール済みか確認
gomcp --scope project      # 現在のプロジェクトのみにインストール
```

### インストール範囲

**ユーザー（グローバル）** - デフォルト。全プロジェクトでサーバーが動作します。

**プロジェクト** - 現在のプロジェクトのみ。チームコラボに便利で、`.mcp.json`ファイルが作成されてコミットできます。チームメンバーがリポジトリをクローンすると、Claude Codeがサーバーの承認を求めます。

## 利用可能なサーバー

カテゴリー別に整理されたMCPサーバーがあります。人気のものをいくつか紹介：

**必須ツール**
- GitHub - リポジトリ、イシュー、PR作業
- File System - ローカルファイルの読み書き
- Context7 - あらゆるライブラリのドキュメント取得
- Sequential Thinking - 複雑なタスクを分解
- Serena - スマートなコード編集アシスタント

**開発**
- PostgreSQL、Docker、Puppeteer、Supabase

**生産性**
- Slack、Notion、Memory（知識グラフ）

**AWSツール**
- CDKからLambda、RDSまで多様なツール

...他にもたくさんあります。`gomcp --list`で全リストを確認してください。

## プリセット

サーバーを一つ一つ選ぶのが面倒？プリセットがあります：

- `recommended` - 基本セットで始める
- `dev` - 完全な開発設定
- `data` - データ分析用
- `web` - Web開発ツール
- `productivity` - チームコラボ
- `aws` - AWS開発

## 設定

サーバーにAPIキーや設定が必要な場合、インストール中に聞いてきます。例えばGitHubはパーソナルアクセストークンを要求します。

File Systemサーバーの場合、Claudeがアクセスできるディレクトリを選びます。簡単です。

設定ファイルの場所：
- `~/.claude/config.json`（ユーザー設定）
- `./.mcp.json`（プロジェクト設定）

## チームコラボ

チームで作業していますか？プロジェクトスコープを使いましょう：

1. サーバーをインストール：`gomcp --scope project`
2. `.mcp.json`ファイルをコミット
3. チームメンバーがリポジトリをクローンして`claude`を実行すると、サーバー承認のリクエストが来る

これで完了！みんな同じ設定を使えます。

## 開発

コントリビュートしたいですか？

```bash
git clone https://github.com/coolwithyou/gomcp.git
cd gomcp
npm install
npm run build
npm test
```

コードはかなり簡潔です - TypeScriptで書かれていて、UIはInquirerを使っていて、標準的なnpmの慣習に従っています。

## コントリビューション

自由にコントリビュートしてください！フォークして、変更を加えて、PRを送ってください。コントリビューションについてはそんなに厳しくありません - テストが通ればOKです。

## FAQ

**MCPって何？**  
Claude Codeが外部ツールと接続できるようにするプロトコルです。

**gomcpをアップデートするには？**  
`npm update -g gomcp`

**Claude Codeなしで使える？**  
いいえ、Claude Code専用です。

**サーバーを削除するには？**  
gomcpを実行、「既存サーバーを更新」へ行って、不要なもののチェックを外す。

## ライセンス

MIT - 好きに使ってください。

---

MCPを作ってくれたClaude Codeチームと、様々なMCPサーバーにコントリビュートしたみなさんに感謝します。みんなすごいです。

[バグ報告](https://github.com/coolwithyou/gomcp/issues) | [機能リクエスト](https://github.com/coolwithyou/gomcp/issues) | [ディスカッション](https://github.com/coolwithyou/gomcp/discussions)