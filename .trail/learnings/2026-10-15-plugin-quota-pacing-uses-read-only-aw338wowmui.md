---
title: Plugin quota pacing uses read-only plans and host field updates
author: Aw338WoWmUI
date: 2026-10-15
branch: feat/plugin-quota-pacing
touches:
  - infrastructure/lan_maintenance.py
  - infrastructure/test_lan_maintenance.py
---

## Decided
Use Quota Pacer v1.0.19 only as a read-only Claude/Codex plan calculator. Keep native weighted-round-robin and session affinity; let lan_maintenance apply priority/weight through the host field-update endpoint. Leave Antigravity routing alone because its model-group quota buckets can diverge.

## Tried and ruled out
Scheduler plugins replace native affinity and do not preserve every body/header/session identity. Quota Pacer native auto_apply directly replaces credential JSON, while its depleted plan does not write weight zero. auto_apply remains false; the bridge writes zero only for fresh confirmed depletion and never edits tokens or disabled switches.

## Watch out
The timer still collects usage and enables Codex WebSockets. It must be the only priority/weight writer. Existing JSON import, quota UI/classification and Copilot v8 opaque-token compatibility fixes still need the fork. Plugin installation alone does not replace those features. If upstream adds a host-mediated field patch, the bridge can be removed.
