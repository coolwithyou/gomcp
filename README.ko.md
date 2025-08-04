# gomcp - Claude Code를 위한 인터랙티브 MCP 설정 도구

<div align="center">

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh.md)

</div>

[![npm version](https://badge.fury.io/js/gomcp.svg)](https://badge.fury.io/js/gomcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/gomcp.svg)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com)

> 🚀 **고 MCP!** - 30초 만에 제로에서 AI 슈퍼파워로. 도구를 선택하세요, 나머지는 저희가 처리합니다.
> 
> 🌐 **다국어 지원** - 전체 MCP 설정 과정을 한국어, 영어, 일본어, 중국어, 스페인어로 지원합니다. 언제든지 언어를 변경할 수 있습니다!

## 목차

- [기능](#기능)
- [빠른 시작](#빠른-시작)
- [설치](#설치)
- [사용법](#사용법)
- [사용 가능한 MCP 서버](#사용-가능한-mcp-서버)
- [프리셋](#프리셋)
- [설정](#설정)
- [팀 협업](#팀-협업)
- [기여하기](#기여하기)
- [라이선스](#라이선스)

## 기능

- 📦 **인터랙티브 설치**: 사용자 친화적인 체크박스 인터페이스로 MCP 서버 선택
- 🎯 **스마트 분류**: 카테고리별로 정리된 서버 (필수, 개발, 생산성 등)
- ⚡ **빠른 프리셋**: 하나의 명령으로 일반적인 서버 조합 설치
- 🔧 **자동 설정**: API 키나 설정이 필요한 서버를 위한 가이드 제공
- ✅ **설치 확인**: 설치된 MCP 서버의 상태 확인
- 💾 **백업/복원**: MCP 설정 저장 및 복원
- 🌍 **다중 스코프 지원**: 전역 또는 프로젝트별 설치
- 🔄 **업데이트 관리**: MCP 서버를 최신 상태로 유지

## 빠른 시작

```bash
# npx로 바로 실행 (권장)
npx gomcp

# 또는 전역 설치
npm install -g gomcp
gomcp
```

## 설치

### npm 사용

```bash
npm install -g gomcp
```

### yarn 사용

```bash
yarn global add gomcp
```

### pnpm 사용

```bash
pnpm add -g gomcp
```

### 요구사항

- Node.js >= 16.0.0
- Claude Code가 설치되어 있고 PATH에서 접근 가능해야 함
- Git (일부 MCP 서버에 필요)

## 사용법

### 인터랙티브 모드

`gomcp`를 실행하면 인터랙티브 메뉴가 시작됩니다:

```bash
gomcp
```

다음과 같은 옵션이 있는 메뉴가 표시됩니다:
- 🆕 새 서버 설치 (스코프 선택 포함)
- 🔄 기존 서버 업데이트
- ✅ 설치 확인
- 💾 설정 백업/복원
- 📋 사용 가능한 서버 목록
- 🌐 언어 변경

### 백업 및 복원

gomcp는 유연한 백업 및 복원 옵션을 제공합니다:

**백업 옵션:**
- 👤 **사용자 설정만** - 전역 MCP 설정 백업 (~/.claude/config.json)
- 📁 **프로젝트 설정만** - 프로젝트별 설정 백업 (.mcp.json)
- 💾 **모든 설정** - 사용자 및 프로젝트 설정 모두 백업

### 명령줄 옵션

```bash
# 다른 스코프로 설치
gomcp                       # 인터랙티브 모드 (스코프 묻기)
gomcp --scope user          # 전역 설치 (기본값)
gomcp --scope project       # 현재 프로젝트에만 설치

# 프리셋 컬렉션 설치
gomcp --preset recommended  # GitHub, File System, Sequential Thinking
gomcp --preset dev          # 개발 도구 프리셋
gomcp --preset data         # 데이터 분석 프리셋

# 모든 사용 가능한 서버 목록
gomcp --list

# 설치된 서버 확인
gomcp --verify

# 버전 표시
gomcp --version

# 도움말 표시
gomcp --help
```

### 설치 스코프

#### 사용자 (전역)
- 모든 프로젝트에서 서버 사용 가능
- `--scope user` 사용 또는 인터랙티브 모드에서 "User" 선택
- 기본 스코프
- 설정 위치: `~/.claude/config.json`
- 추천: 범용 도구 (GitHub, File System, Context7)

#### 프로젝트
- 현재 프로젝트에서만 서버 사용 가능
- `--scope project` 사용 또는 인터랙티브 모드에서 "Project" 선택
- `.mcp.json` 생성 (팀 공유용) 및 Claude Code에서 활성화
- 설정 위치: `./.mcp.json` (프로젝트 루트)
- 추천: 프로젝트별 도구 (Serena, Memory Bank, 데이터베이스 연결)

## 사용 가능한 MCP 서버

### 필수
- 🐙 **GitHub** - 이슈, PR, CI/CD를 위한 GitHub API 연결
- 📁 **File System** - 머신의 파일 읽기 및 쓰기
- 📚 **Context7** - 라이브러리의 최신 문서 및 코드 예제 접근
- 🧠 **Sequential Thinking** - 복잡한 작업을 논리적 단계로 분해

### 개발
- 🐘 **PostgreSQL** - 자연어로 PostgreSQL 데이터베이스 쿼리
- 🌐 **Puppeteer** - 웹 브라우저 자동화 및 테스팅
- 🎭 **Playwright** - 접근성 트리를 이용한 크로스브라우저 자동화
- 🐳 **Docker** - 컨테이너, 이미지, Docker 워크플로 관리
- 🛠️ **Serena** - 시맨틱 검색 및 편집 기능이 있는 강력한 코딩 에이전트 툴킷
- 🔧 **Browser Tools** - 브라우저 로그 모니터링 및 브라우저 작업 자동화
- 🌐 **Chrome** - 20개 이상의 자동화 도구로 Chrome 브라우저 제어
- 🎨 **Figma** - 디자인-투-코드 워크플로 통합
- 🍃 **Supabase** - Supabase 데이터베이스 및 인증 관리

### 생산성
- 💬 **Slack** - 팀 커뮤니케이션을 위한 Slack 통합
- 📝 **Notion** - Notion 워크스페이스 접근 및 관리
- 💾 **Memory Bank** - Claude 세션 간 지속적인 메모리
- 📧 **Email** - 이메일 전송 및 첨부파일 관리
- 📊 **Google Suite** - Google Docs, Sheets, Drive 접근
- 📈 **Excel** - Excel 파일 생성 및 수정

### 데이터 & 분석
- 📊 **Jupyter** - Jupyter 노트북에서 코드 실행
- 🔬 **Everything Search** - 운영체제 전반의 빠른 파일 검색
- 🌍 **EVM** - 30개 이상 EVM 네트워크를 위한 포괄적인 블록체인 서비스
- 🔑 **Redis** - 데이터베이스 작업 및 캐싱 마이크로서비스

### 검색 & 웹
- 🦆 **DuckDuckGo** - API 키 없이 사용하는 프라이버시 중심 웹 검색
- 🦁 **Brave Search** - API를 이용한 프라이버시 중심 웹 검색
- 📸 **Screenshot** - 고급 기능으로 웹사이트 스크린샷 캡처

### 자동화 & 통합
- ⚡ **Zapier** - 5,000개 이상 앱에서 워크플로 자동화
- 💳 **Stripe** - Stripe 결제 API 통합
- 🎥 **YouTube** - YouTube 비디오 메타데이터 및 대본 추출
- 🔌 **Discord** - Discord 서버용 봇 자동화

### AI & ML
- 🤖 **Replicate** - 머신러닝 모델 검색, 실행, 관리
- 🧠 **Hyperbolic** - Hyperbolic GPU 클라우드 서비스와 상호작용
- 📈 **Databricks** - Databricks용 SQL 쿼리 및 작업 관리

### DevOps & 인프라
- ☸️ **Kubernetes (mcp-k8s-go)** - Kubernetes 파드, 로그, 이벤트, 네임스페이스 탐색
- 📊 **HAProxy** - HAProxy 구성 관리 및 모니터링
- 🌐 **Netbird** - Netbird 네트워크 피어, 그룹, 정책 분석
- 🔥 **OPNSense** - OPNSense 방화벽 관리 및 API 접근

### 도메인 & 보안
- 🔍 **Domain Tools** - WHOIS 및 DNS를 이용한 포괄적인 도메인 분석
- 📡 **Splunk** - Splunk 저장된 검색, 알림, 인덱스 접근

### 블록체인 & 암호화폐
- 🟣 **Solana Agent Kit** - Solana 블록체인과 상호작용 (40개 이상 프로토콜 액션)
- ⚡ **EVM** - 멀티체인 EVM 블록체인 통합

### 구직 & 커리어
- 💼 **Reed Jobs** - Reed.co.uk에서 구인 목록 검색 및 조회

### 시간 & 유틸리티
- ⏰ **Time** - 현재 시간 조회 및 시간대 간 변환
- 🔧 **Everything** - 포괄적인 기능으로 빠른 파일 검색

### 메타 도구
- 🛠️ **MCP Compass** - 특정 요구사항에 적합한 MCP 서버 제안
- 🏗️ **MCP Server Creator** - 다른 MCP 서버를 동적으로 생성
- 📦 **MCP Installer** - 다른 MCP 서버 설치
- 🔄 **MCP Proxy** - 여러 MCP 리소스 서버 집계

### 그리고 더 많은 서버들...
- 💾 **Memory Bank** - 세션 간 지속적인 메모리
- 📧 **Email** - 이메일 전송 및 관리

### 데이터 & 분석
- 📊 **Jupyter** - 대화형 컴퓨팅 및 데이터 과학
- 📈 **Excel** - 스프레드시트 읽기 및 조작
- 🔬 **SciPy** - 과학 컴퓨팅 도구

모든 서버 목록과 설명을 보려면 `gomcp --list`를 실행하세요.

## 프리셋

일반적인 서버 조합의 빠른 설치:

| 프리셋         | 포함된 서버                                        | 사용 사례                  |
| -------------- | -------------------------------------------------- | -------------------------- |
| `recommended`  | GitHub, File System, Sequential Thinking, Context7 | 필수 도구로 시작하기       |
| `dev`          | 모든 권장 + PostgreSQL, Docker, Puppeteer          | 전체 개발 환경             |
| `data`         | Jupyter, Excel, SciPy, PostgreSQL                  | 데이터 분석 및 시각화      |
| `web`          | Puppeteer, File System, GitHub                     | 웹 개발 및 자동화          |
| `productivity` | Slack, Notion, Memory Bank, Email                  | 팀 협업                    |

## 설정

### 서버 설정

설정이 필요한 서버(API 키, 토큰 등)를 설치할 때, gomcp가 설정 과정을 안내합니다:

```
📝 GitHub 설정:
? GitHub Personal Access Token: **********************
? 기본 저장소 (선택사항): owner/repo
```

### 파일 시스템 접근

File System 서버의 경우 Claude가 접근할 수 있는 디렉토리를 선택할 수 있습니다:

```
? 접근을 허용할 디렉토리 선택: 
❯◉ ~/Documents
 ◉ ~/Projects
 ◯ ~/Desktop
 ◯ ~/Downloads
 ◯ 사용자 정의 경로...
```

## 팀 협업

팀에서 작업할 때 프로젝트 스코프의 MCP 서버를 통해 원활한 협업이 가능합니다:

### 프로젝트 서버 설정

1. **프로젝트 스코프로 서버 설치:**
   ```bash
   gomcp --scope project
   # 또는 인터랙티브 모드에서 "Project" 선택
   ```

2. **`.mcp.json` 파일 커밋:**
   ```bash
   git add .mcp.json
   git commit -m "Add project MCP servers configuration"
   ```

### 팀 멤버를 위한 가이드

`.mcp.json`이 있는 프로젝트를 클론할 때:

1. **저장소 클론:**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Claude Code 시작:**
   ```bash
   claude
   ```

3. **프로젝트 서버 승인:**
   - Claude Code가 프로젝트의 MCP 서버 승인을 요청합니다
   - 서버를 검토하고 예상되는 경우 승인
   - `/mcp`를 사용하여 서버 연결 확인

## 기여하기

기여를 환영합니다! 자세한 내용은 [기여 가이드](CONTRIBUTING.md)를 참조하세요.

### 빠른 시작

1. 저장소 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다 - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

<p align="center">
  Claude Code 커뮤니티를 위해 ❤️로 만들었습니다
</p>

<p align="center">
  <a href="https://github.com/coolwithyou/gomcp/issues/new?assignees=&labels=bug&template=bug_report.md&title=">버그 보고</a>
  ·
  <a href="https://github.com/coolwithyou/gomcp/issues/new?assignees=&labels=enhancement&template=feature_request.md&title=">기능 요청</a>
  ·
  <a href="https://github.com/coolwithyou/gomcp/discussions">토론 참여</a>
</p>