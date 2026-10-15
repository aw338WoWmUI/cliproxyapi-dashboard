# Plugin coverage of the LAN subscription gateway

Verified on 2026-10-16 against CLIProxyAPI v8.0.30, Dashboard v0.1.88, and the [official plugin store](https://github.com/router-for-me/CLIProxyAPI-Plugins-Store). The live store contained 124 entries. Store listing is discovery, not proof of compatibility.

## Decision

Install [Quota Pacer v1.0.19](https://github.com/xg1990/quota-pacer/releases/tag/v1.0.19) from the official store, leaving its `auto_apply` disabled. Its released source computes quota pacing weights for Claude, Codex, Antigravity, and xAI while leaving native session affinity in control. Use its read-only `dry-run` plan for Claude/Codex and apply only priority/weight through the host `PATCH /v8/management/credentials/fields` API. Replace the previous hand-written reset-time ranking in `infrastructure/lan_maintenance.py`; preserve usage collection and Codex WebSocket maintenance.

Set native routing to `weighted-round-robin`. Keep affinity enabled, TTL 24h, quota-only rebinding, and parent/subagent inheritance. Keep model IDs, alias mappings, client authentication, client history and the 475k Codex catalog unchanged. Only new or rebound sessions participate in weighted account selection.

Antigravity stays on native routing: its Gemini and Claude quota groups can differ, while credential weights are global. Applying one selected group to the whole credential could exclude healthy models. Copilot/Cursor provider plugins remain installed; they are not replaced by a quota scheduler.

## Coverage

| Requirement | Existing native/plugin capability | Disposition |
|---|---|---|
| Sticky sessions and quota failover | [Core configuration](https://github.com/router-for-me/CLIProxyAPI/blob/v8.0.30/config.example.yaml) | Keep native affinity; do not add a scheduler plugin that bypasses it. |
| Quota-aware account weighting | [Quota Pacer](https://github.com/xg1990/quota-pacer/tree/v1.0.19) | Use read-only plans plus the host field API. |
| Cross-provider model chains | [Model Router](https://github.com/markhuangai/cpa-plugin-model-router), [Priority Auto Router](https://github.com/Apparux/cpa-plugin-priority-auto-router), [Model Fallback Router](https://github.com/thebtf/cpa-model-fallback-router) | Available alternatives, not configured: this task does not authorize changing existing model IDs or introducing fallback to a different model. Shared-ID native pooling remains available. |
| Subscription JSON import | Upstream already supports credential uploads; fork normalization accepts native nested `claudeAiOauth` and Codex `tokens` exports | Keep only the format compatibility patch; importing JSON itself is not a fork-only feature. |
| Quota UI and weekly-window classification | Existing Dashboard plus [Quota Monitor](https://github.com/dohwi/cliproxyapi-plugin-quota-monitor) and [Quota Center](https://github.com/RayenAlex/quota-center) | Keep the current dashboard; another UI is optional and would duplicate collection. |
| Copilot login/inference and quota display | Installed `github-copilot` plugin already provides login/inference; current core v8 token lookup and Dashboard request fix quota access | Keep only quota compatibility fixes, not an independent provider implementation. |

## Alternatives not enabled

- [quota-reset-router](https://github.com/WebDevCaptain/quota-reset-router): matches earliest weekly reset, but selecting in `scheduler.pick` bypasses native affinity.
- [kpatdev quota-router](https://github.com/kpatdev/quota-router): adds persistent sessions, own affinity and quota history; documented header-only identity and mixed-provider/WebSocket delegation differ from native affinity's complete request identity support. Not a transparent replacement.
- [expiring-first](https://github.com/magoz/cpa-expiring-first): needs another quota JSON producer and pins provider/model routes, not individual conversations. It does not remove the collector and overrides native affinity.
- [Credential Tiers](https://github.com/William-zgx/cpa-plugin-credential-tier-router): supports Codex/Antigravity tiers but not Claude.
- Usage observers duplicate the existing PostgreSQL usage history. Warmup/activation plugins generate inference requests and are outside this task.

## Why a small adapter remains

The [released Quota Pacer host client](https://github.com/xg1990/quota-pacer/blob/v1.0.19/internal/host/client.go#L233) reads and atomically replaces physical credential JSON for priority and weight separately. It does not coordinate these writes with the host's OAuth refresh ownership. Keep that path disabled.

The [released apply path](https://github.com/xg1990/quota-pacer/blob/v1.0.19/internal/apply/apply.go#L149) writes weights only when positive; a depleted plan lowers priority but does not clear an old positive weight. The adapter explicitly writes weight 0 for fresh confirmed depletion. Stale/unknown evidence, other providers, disabled accounts, and unrelated credential fields are untouched. Invalid planned weights fail before any apply. Native auth/cooldown remains responsible for authentication errors and per-model upstream limits.

The adapter is intentionally limited to the plugin's read-only output plus host field updates. Upgrade or remove it when the plugin offers an equivalent host-mediated field patch. Do not enable its `auto_apply` alongside this bridge.

## Operator access and rollback

Existing dashboard Settings exposes the installed plugin and its configuration fields. `auto_apply=false` is deliberate: `cliproxy-maintenance.timer` invokes the read-only plan and the safe host-field bridge every minute. The plugin reuses its 15-minute probe cache between fresh quota checks; cached-only plans leave existing weights unchanged. Do not run a second priority-writing plugin or the retired reset-time ranker.

Deployment makes a private runtime backup before changing config. To roll back, stop the timer, restore the previous maintenance script and routing config, restore only the prior priority/weight fields through the host API, then disable Quota Pacer. Never restore an old OAuth JSON over a refreshed live token.

## Verification

Run `python3 -m unittest discover -s infrastructure -p test_lan_maintenance.py`. Tests cover fresh plans, explicit depleted exclusion, stale/unsupported/disabled accounts, invalid weights, usage collection, WebSocket preservation, and the actual main-to-host-PATCH path. A precise mutation making depleted weight 1 must fail. Runtime acceptance additionally checks plugin registration, zero writes during preview, weighted routing, original affinity settings, successful inference/WebSocket, unchanged local client files and working dashboard quota/login routes. Full real-account refresh/depletion stress is not claimed.

## Reset Bank follow-up

[Codex Auto Reset](https://github.com/JefferyZhang2019/cpa-plugin-codex-auto-reset) is listed in the official store and provides a Reset Bank UI, expiring-credit detection and a manual reset action, alongside automatic redemption. Released v0.1.8 has no independent manual-only switch: both manual actions and automatic workers require an account in `enabled_accounts`; enabling it may immediately redeem a credit near expiry. An empty list prevents redemption but also prevents live credit probing through those actions. Quota Pacer exposes reset-credit count/expiry for weighting but does not provide a redemption button. Reset-credit redemption is an upstream account action, not clearing a local request or waiting for a window reset. No real redemption or automatic redemption was enabled in this deployment. Its separate resource UI is not currently exposed through the Dashboard-only Cloudflare route; installation alone would not make its reset controls reachable there.
