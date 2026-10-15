---
title: Handle both Copilot management and embedded API failures
author: Aw338WoWmUI
date: 2026-10-15
branch: feat/subscription-tools-migration
touches:
  - dashboard/src/app/api/management/oauth-callback/route.ts
  - dashboard/src/app/api/quota/route.test.ts
  - dashboard/src/app/api/quota/route.ts
  - dashboard/src/components/quick-start-config-section.tsx
---

## Decided
The Dashboard Copilot quota adapter falls back to the native quota provider for both a non-success management response and a non-success embedded status_code. They are separate transport and provider result layers.

## Tried and ruled out
Checking response.ok alone misses HTTP 200 wrappers containing provider 401/403 results. Targeted mutation tests fail both cases while the management HTTP failure case still passes.

## Watch out
Preserve bounded OAuth management requests during upstream synchronization. Use the shared SLIM_PLUGIN version for the displayed installer so it matches generated configuration. These are Dashboard consumers, not edits to third-party plugin implementations.
