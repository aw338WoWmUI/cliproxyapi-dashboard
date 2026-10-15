---
title: Preserve gateway affinity and OAuth behavior during v0.1.88 merge
author: Aw338WoWmUI
date: 2026-10-15
branch: feat/upgrade-dashboard-v0.1.88
touches:
  - dashboard/src/lib/config-save-plan.ts
  - dashboard/src/app/api/management/oauth-callback/route.ts
---

## Decided
Merge upstream dashboard v0.1.88 while retaining native subscription imports, quota-window classification, Copilot v8 token access, and affinity controls. Use the generic authenticated POST OAuth callback with no-store and a bounded bootstrap wait.

## Tried and ruled out
Taking the upstream config page and save planner unchanged drops edits to session-affinity and session-affinity-ttl even though the controls remain visible. Reapply those fields in planConfigSave and combine them with strategy edits in one YAML write.

## Watch out
The upstream stale-reload fixes supersede the older watcher hash patch. Keep only one configApplyMu and use the SourceHash of the parsed snapshot. Do not overwrite appliance config or plugin/auth volumes with upstream installation templates. Verify plugin login readiness without completing account authorization.
