---
title: Upgrade to dashboard 0.1.89 without replacing appliance configuration
author: Aw338WoWmUI
date: 2026-10-16
branch: chore/upgrade-v0.1.89
touches:
  - ".release-please-manifest.json"
  - dashboard/CHANGELOG.md
  - dashboard/messages/de.json
  - dashboard/messages/en.json
  - dashboard/src/app/api/agent-config-slim/route.test.ts
  - dashboard/src/app/api/quota/route.test.ts
  - dashboard/src/app/api/quota/route.ts
  - dashboard/src/components/oh-my-opencode-slim-config-generator.tsx
  - dashboard/src/components/oh-my-opencode-slim/tier-assignments.tsx
  - dashboard/src/lib/__tests__/helpers/slim-schema-guard.ts
---

## Decided
Merge the exact dashboard-v0.1.89 tag. Preserve native Copilot quota fallback, scoped Codex limit guards, headline quota classification, strict OMO validation, bounded OAuth callback requests and translated OMO notices. Take upstream Antigravity client identity and Argon quota separation, and slim inheritance/preset improvements. No Prisma migration is introduced.

## Tried and ruled out
Do not replace the fork tree with the release tree: that drops the retained adapters and restores an unrelated development plugin installer. Trail keyword matches are not semantic conflicts: no account-reset plugin, scheduler, client catalog changes or runtime Ajv compilation is added; slim validation uses Zod.

## Watch out
Build with the appliance's existing database, secrets and external DASHBOARD_URL intact. Deploy only the new dashboard image, preserving the live compose services and credential mounts.
