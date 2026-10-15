# Personal LAN subscription gateway

The appliance runs unmodified CLIProxyAPI v8.0.30 with the existing provider plugins and [Subscription Tools](https://github.com/aw338WoWmUI/cpa-subscription-tools). Quota Pacer provides quota collection/scoring; Subscription Tools safely applies its read-only plans through the native credential-field API.

## Access

- HTTP inference: `http://192.168.100.36:8318` (`/v1` for OpenAI clients).
- HTTP management: `http://192.168.100.36:3000`.
- Subscription tools: `/v0/resource/plugins/cpa-subscription-tools/status` on the management origin.
- Original Dashboard and PostgreSQL usage history remain available under `/dashboard`.
- The Cloudflare temporary origin proxies Dashboard, native management and plugin resource/API routes. Native management and plugin actions require the existing management key; the Dashboard retains its own login.

## Credentials and reset

Use Subscription Tools for native Claude `claudeAiOauth` and Codex `tokens` JSON. Preview first, then confirm import. Existing imported files and refreshed tokens are not replaced. Existing native/provider-plugin OAuth logins remain available.

Reset Bank inventory is read-only until a selected credit is explicitly confirmed for redemption. The plugin has no automatic reset job. An uncertain result requires refreshing inventory; reuse the request ID for the same operation.

## Routing

Use native weighted round robin and session affinity. The deployed affinity lifetime is 24h with quota rebinding and subagent inheritance. Subscription Tools exposes a routing form that patches only strategy/affinity/lifetime through the native v8 configuration API.

Keep Quota Pacer `auto_apply: false`; only Subscription Tools writes quota-derived priority/weight. Its scope is Claude/Codex, excluding Antigravity's independent model groups. No other priority writer should run. `infrastructure/lan_maintenance.py` now collects durable Dashboard usage only; the old Python ranker and bridge tests moved to the standalone plugin repository's Go/native integration suite.

The Dashboard retains a small native quota-provider fallback for Copilot. Legacy `$TOKEN$` substitution cannot read its provider-owned credentials on an unmodified host. Weekly-window classification is tracked in [upstream PR #306](https://github.com/itsmylife44/cliproxyapi-dashboard/pull/306). Former native-import, affinity-form, cache/timeout and token-resolver fork patches are no longer required by the plugin-owned flows.

## Validation and rollback

See the standalone plugin README for unit/race/native host tests. Dashboard changes use `npm run typecheck`, `npm run lint`, `npm test` and a production build. Preserve model IDs, the local Codex provider identity/history/context catalog, credentials and database volumes during upgrades.

Private appliance configuration, auth files and prior images are backed up before migration. Rollback restores runtime config/images and the old maintenance script, never stale credential JSON over rotated live tokens. Stop the new pacing worker before re-enabling an old priority writer.
