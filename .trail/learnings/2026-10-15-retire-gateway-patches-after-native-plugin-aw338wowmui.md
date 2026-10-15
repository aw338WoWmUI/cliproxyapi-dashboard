---
title: Retire gateway patches after native plugin acceptance
author: Aw338WoWmUI
date: 2026-10-15
branch: feat/subscription-tools-migration
touches:
  - dashboard/messages/de.json
  - dashboard/messages/en.json
  - dashboard/messages/es.json
  - dashboard/messages/zh-CN.json
  - dashboard/package-lock.json
  - dashboard/package.json
  - dashboard/src/app/api/agent-config-slim/route.test.ts
  - "dashboard/src/app/api/management/[...path]/route.ts"
  - dashboard/src/app/api/management/__tests__/management-proxy.test.ts
  - dashboard/src/app/api/management/oauth-callback/route.test.ts
---

## Decided
Run the unmodified v8.0.30 host with Subscription Tools for native JSON import, Copilot quota, routing controls and manual Reset Bank. Preserve provider plugins, native affinity, model IDs and existing PostgreSQL usage history. Align Dashboard application files with upstream c424760 plus the verified weekly-window fix and a normalized Copilot quota fallback.

## Tried and ruled out
Do not install Account Config Manager for passive reset/import: its release overwrites Codex retries even when management credentials are absent. Affinity form/save and raw import patches may be retired because the replacement plugin owns those flows, not because their old regressions never mattered. Do not submit unproven OAuth timeout/cache changes as upstream bugs.

## Watch out
The maintenance timer collects usage only; the plugin is the sole quota-field writer. External management and plugin resources share the existing tunnel origin, with management-key authentication for data/actions. Pending upstream PR306 is not merged acceptance. The new plugin release and store registration are separate outcomes.
