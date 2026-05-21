# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"智慧笔记" (Wisdom Notes) — a WeChat Mini Program for personal reflection and thinking. Users write questions/observations, select analysis methods (personas of 22 thinkers across 4 domains), and receive AI-powered analysis via DeepSeek API. Key differentiator: 18-hour delay before viewing results to encourage independent thinking.

**Tech stack**: WeChat Mini Program native framework (WXML + WXSS + JS) + WeChat CloudBase (cloud functions + cloud database). No TypeScript, no external state management, no npm for the miniprogram frontend.

## Development Commands

```bash
# Pre-commit checks (sensitive info, deprecated APIs, file size, code style)
cd scripts && node checks/project-rules-check.js
# or via shell:
cd scripts && bash pre-commit-check.sh

# MCP server (development assistant)
cd mcp-server && npm start

# Tests
cd scripts && npm test                          # unit + integration
cd scripts && npm run test:unit                 # unit only
cd scripts && npm run test:integration          # integration only
cd mcp-server && npm test                       # MCP server tests
```

**Build/preview**: Open the project root in WeChat Developer Tools (微信开发者工具). No CLI build — compilation, preview, and upload happen inside the IDE.

**CI**: GitHub Actions runs on push/PR to `main` and `develop` — project rules check, security audit (sensitive info scan), and code quality stats. See `.github/workflows/project-rules-check.yml`.

## Setup

1. Open project root in WeChat Developer Tools
2. Create a cloud environment in the CloudBase console, note the environment ID
3. Create database collections: `users`, `letters`, `roundtable_discussions`, `incubator_reports`, `structure_analysis_reports`
4. Deploy all cloud functions from `cloudfunctions/`
5. Set `DEEPSEEK_API_KEY` env var on the `replyToLetter` cloud function
6. Edit `miniprogram/envList.js` to add your cloud environment ID

## Architecture

```
miniprogram/           → Frontend (WeChat Mini Program)
  pages/               → 14 pages (login, index, write, roundtable, incubator, etc.)
  components/          → 3 components (sideMenu, cloudTipModal, heatmapCalendar)
  utils/               → cloudbaseUtil.js, sensitiveWordUtil.js, cacheUtil.js
  envList.js           → Cloud environment IDs (must configure per environment)
  app.js               → Global state: themeMode, sessionStartTime; cloud init

cloudfunctions/        → Backend (WeChat Cloud Functions, Node.js)
  replyToLetter/       → Core AI engine
    index.js             Main entry: routing by type (single/roundtable/incubator/structure)
    mentorRules.json     Mentor persona configs (22 thinkers, 4 domains)
    sensitiveWordDetector.js  Shared sensitive word detection logic
  getMentorRules/      → Fetches mentor/analysis method rule configs
  getMentors/          → Returns mentor list
  login/               → User login/registration, quota initialization
  hasSensitiveWord/    → Content safety check
  detectSensitiveWords/→ Enhanced content safety detection
  filterSensitiveWords/→ Content filtering

mcp-server/            → MCP dev assistant server (calls Claude Code CLI)
scripts/               → Project rule checks, pre-commit hooks, test suites
```

### Key Data Flow

- **Single analysis**: write page → `replyToLetter` cloud function → DeepSeek API → `letters` collection
- **Multi-dimensional analysis**: roundtable page → `replyToLetter` (type: 'roundtable') → parallel DeepSeek calls per method → `roundtable_discussions` collection
- **Incubator**: incubator page → `replyToLetter` (type: 'incubator') → structured report → `incubator_reports` collection
- **Quota**: new users get 2 free; single analysis costs 1, roundtable costs 3; daily limit 6

### Cloud Database Collections

`users`, `letters`, `roundtable_discussions`, `incubator_reports`, `structure_analysis_reports`

### Environment Variables

- `DEEPSEEK_API_KEY` — configured on the `replyToLetter` cloud function for AI analysis

## Mandatory Project Rules (from .trae/rules/project_rules.md)

**These are hard constraints — violations are blocking:**

- **No large-scale refactoring**: max 5 files changed, 200 lines, 1 module per commit
- **No TypeScript migration**: project stays plain JavaScript
- **Protect existing prototype**: incremental changes only
- **Git workflow**: `main` → `develop` → `feature/xxx` / `fix/xxx` / `docs/xxx`
- **Commit format**: `type(scope): subject` where type = feat/fix/docs/style/refactor/test/chore
- **Code style**: 2-space indent, single quotes, semicolons required
- **Comments in Chinese**: explain "why", not "what"
- **Security**: encrypted sensitive data, user-ID-filtered queries, input validation, XSS prevention

### Rollback Procedures

- **Code**: `git revert HEAD` or `git checkout backup/xxx` (create backup branches before refactoring: `git checkout -b backup/feature-name-date`)
- **Cloud functions**: CloudBase console → cloud functions → version history → select stable version
- **Database**: Export current data, import backup, verify integrity

## Key Patterns

- **Analysis method selection**: Pages use `METHOD_FIELDS` constant (4 domains, 22 methods) with `selectedMethodMap` for toggle state. Single-select in write page, multi-select (3-5) in roundtable, multi-select (1-3) in incubator.
- **Quality evaluation**: `evaluateReplyQuality()` scores on methodology fidelity (40%), relevance (30%), uniqueness (20%), depth (10%). Auto-retry up to 2 times if score < 0.7.
- **Word count adaptation**: `estimateComplexity()` maps input length to simple/medium/complex, controlling DeepSeek response length via `maxTokens`.
- **Sensitive word handling**: Frontend pre-check (`sensitiveWordUtil.js`) + cloud function second pass (`sensitiveWordDetector.js`). High-sensitivity blocks, financial terms trigger disclaimer.
- **Theme system**: `app.js` globalData stores theme (system/light/dark), pages call `getApp().getThemeClass()` to apply CSS class.
- **18-hour delay**: `replyExpectTime` field set on submission; results hidden until elapsed.
- **Usage timer**: `app.js` tracks continuous usage via `sessionStartTime` in storage, shows a reminder modal after 2 hours.

## File References

- Detailed code wiki: `CODE_WIKI.md`
- Test cases: `TEST_CASES.md`
- Full project rules: `.trae/rules/project_rules.md`
- Development process spec: `.trae/rules/AGENTS.md`
- Mentor rules config: `cloudfunctions/replyToLetter/mentorRules.json` (or `mentorRules_expanded.json`)
