---
title: Keep scoped quota limits out of account status
author: Aw338WoWmUI
date: 2026-10-16
branch: chore/quota-snapshot-620e6b3
touches:
  - dashboard/src/app/dashboard/quota/page.tsx
  - dashboard/src/lib/quota/__tests__/codex.test.ts
  - dashboard/src/lib/quota/codex.ts
  - dashboard/src/app/dashboard/quota/__tests__/quota-filter.test.ts
---

## Decided
Freeze this upgrade at upstream 620e6b3c, including Codex per-model and code-review quota groups. Apply headlineQuotaWindows in the actual account status filter as well as capacity bars, and tolerate malformed additional-limit arrays/names without discarding valid main limits. Keep gateway/provider settings intact.

## Tried and ruled out
Tests reproduced a healthy main quota incorrectly entering Warning, and valid main limits failing on object/string additional data or non-string scope names. Those exact cases now pass through the real page filter and parser entry. Exclude the unrelated upstream Claude cloud SessionStart auto-installer and marketplace configuration; updating this appliance does not require installing a development plugin into user scope.

## Watch out
Quota reset timestamps are not credit redemption and scoped limits are not account-wide depletion. Existing provider/API labels remain metadata, including the stable code-review scope ID. Preserve the OMO validation and Copilot fallback from the earlier merge when updating quota code.
