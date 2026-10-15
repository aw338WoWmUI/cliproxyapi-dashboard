---
title: Separate upstream credential support from gateway compatibility fixes
author: Aw338WoWmUI
date: 2026-10-15
branch: feat/plugin-quota-pacing
touches:
  - infrastructure/__pycache__/lan_maintenance.cpython-314.pyc
  - infrastructure/__pycache__/test_lan_maintenance.cpython-314.pyc
---

## Decided
JSON credential uploads and Copilot provider support are upstream/plugin features. Describe our fork patches as native-export normalization, Copilot quota token lookup, and Dashboard affinity-save compatibility only. Prefer upstream plus plugins and shrink the patch set when equivalent behavior is verified.

## Tried and ruled out
Do not justify keeping a whole fork merely because it imports subscription JSON or supports Copilot. Do not enable codex-auto-reset v0.1.8 accounts merely to display Reset Bank balances: manual checks and automatic redemption share enabled_accounts.

## Watch out
Quota Pacer can display reset-credit metadata but cannot redeem. Codex Auto Reset has a manual reset button but enabling an account can start automatic redemption near expiry. A plugin resource UI is separate from our Dashboard-only Cloudflare route; installation does not prove external UI reachability.
