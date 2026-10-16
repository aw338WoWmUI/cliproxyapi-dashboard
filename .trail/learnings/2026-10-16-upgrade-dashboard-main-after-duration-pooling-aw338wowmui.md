---
title: Upgrade Dashboard main after duration pooling fixes
author: Aw338WoWmUI
date: 2026-10-16
branch: chore/upgrade-20261016
touches:
  - ".github/workflows/all-contributors.yml"
  - ".github/workflows/ci.yml"
  - ".github/workflows/release.yml"
  - ".out-of-scope/sqlite-database.md"
  - README.md
  - dashboard/messages/de.json
  - dashboard/messages/en.json
  - dashboard/messages/es.json
  - dashboard/messages/zh-CN.json
  - dashboard/src/app/api/quota/route.test.ts
---

## Decided
Track upstream 5d111b1b after v0.1.88, including numeric Codex window pooling and OMO/slim compatibility updates. The only application differences retained are normalized native Copilot quota fallback, bounded OAuth requests, and the shared pinned slim installer version.

## Tried and ruled out
Do not resolve the merge by keeping old quota or generator files: fork history included earlier squashed upstream changes and duplicates of the now-merged weekly-duration fix. Start from the current upstream application tree and reapply only the five intentional adapter files.

## Watch out
Keep appliance compose/config/auth/plugin mounts and PostgreSQL history. The installer templates are not live deployment configuration. Existing account tokens may rotate during verification; never restore archived credential JSON on rollback.
