---
title: Validate OMO sections before saving or syncing
author: Aw338WoWmUI
date: 2026-10-16
branch: chore/upgrade-20261016
touches:
  - dashboard/messages/es.json
  - dashboard/messages/zh-CN.json
  - dashboard/src/lib/__tests__/omo-new-fields.test.ts
  - dashboard/src/lib/config-generators/oh-my-opencode-types.ts
  - dashboard/src/lib/validation/schemas.ts
  - dashboard/src/lib/config-generators/upstream/omo-sections.ts
---

## Decided
Validate the eight newly supported OMO object sections with strict Zod shapes matching the pinned upstream schema. Reject malformed API writes before persistence and omit invalid legacy stored sections during normalization. Add the OMO notice to Spanish and Simplified Chinese.

## Tried and ruled out
Runtime Ajv compilation is inappropriate in the client config-generator bundle: production CSP excludes unsafe-eval. Reuse Zod instead, without new runtime dependencies. Both the save-boundary and stored-normalization guards have separate precise red mutations; the valid upstream-schema round trips remain green.

## Watch out
When updating the pinned OMO schema, compare these section shapes too, including numeric bounds, nested additional properties and keyword enums. Never let an accepted configuration fail only after synchronization to OpenCode. This supersedes treating these sections as size-bounded opaque objects.
