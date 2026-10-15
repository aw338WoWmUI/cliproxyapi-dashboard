---
title: Move enhancements to existing plugins and fix UI defects upstream
author: Aw338WoWmUI
date: 2026-10-15
branch: docs/plugin-migration-plan
touches:
  - docs/research/2026-10-16-plugin-migration.md
---

## Decided
Use the actual CLIProxyAPI plugin ABI to choose migration boundaries. Reuse existing providers, Quota Pacer/native affinity, and Account Config Manager's independent confirmed manual Reset. Patch its missing Claude claudeAiOauth format before considering another importer. Add quota to the existing Copilot provider and ensure the intended frontend consumes it.

## Tried and ruled out
Do not infer that the entire ecosystem lacks manual-only Reset from Codex Auto Reset's coupled account worker: Account Config Manager v0.3.1469 already has an independent confirmed reset endpoint. Do not wrap all fork code in a new plugin: no global management middleware, core token-resolver hook or independent Dashboard React injection is exposed.

## Watch out
Account Config Manager also declares scheduler/interceptor/executor capabilities and enables quota metadata probes; verify inactive-policy delegation before installing it. Current Dashboard hardcodes Copilot API-call and does not automatically consume a new QuotaProvider. A source-level feasibility finding is not a tested upstream replacement or a published plugin.
