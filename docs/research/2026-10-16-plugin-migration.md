# Moving gateway enhancements into the CLIProxyAPI ecosystem

Research date: 2026-10-16. This is a migration design, not a claim that a replacement deployment has passed acceptance. No credentials, reset credits, client settings or live routing were changed for this investigation.

## Target

Run an unmodified upstream CLIProxyAPI host, reuse maintained ecosystem plugins, and retain only independently useful enhancements in our own distributable plugin. Fix host/UI defects in their owning projects. Keep the current forks as a rollback source until every removed patch has an equivalent verified path.

The deployed host fork differs from its v8.0.30 upstream baseline `5be2cdab` by 19 production-code lines in `internal/api/handlers/management/api_tools.go`; its remaining changes are tests. Dashboard fork baseline is upstream v0.1.88 `f6038d0`. Removing a patch requires behavioral equivalence, not just a plugin with a similar name.

## Reuse and migration map

| Current requirement or patch | Destination | Work still needed |
|---|---|---|
| Claude/Codex credential upload | Native upload plus [Account Config Manager](https://github.com/Mxucc/cpa-account-config-manager/tree/v0.3.1469) | Its release supports native Codex `tokens`; contribute missing native Claude `claudeAiOauth` normalization rather than write another account manager. |
| Copilot login and inference | Existing [GitHub Copilot plugin](https://github.com/syepes/CLIProxyAPI-plugin-github-copilot) | Retain the provider implementation. Add normalized quota support there if absent, or fix the host token-resolution bug upstream. The current Dashboard's hard-coded quota request must also adopt the replacement path. |
| Quota weights and native affinity | Existing [Quota Pacer](https://github.com/xg1990/quota-pacer/tree/v1.0.19) plus native weighted routing/affinity | Keep the current read-only bridge until the plugin can update routing fields without replacing concurrent credential state and can reliably clear depleted weights. Contribute fixes to its owner; do not publish a second scheduler or copy its scoring algorithm. |
| Reset Bank count and manual redemption | Account Config Manager v0.3.1469 | It has a confirmed manual reset API independent of automatic redemption. Evaluate this existing implementation before adding any reset plugin of our own. |
| Dashboard affinity save and quota-window classification | Dashboard upstream fixes | A backend plugin cannot patch its independent React UI or save planner. A plugin-owned page is an alternative user flow, not a transparent fix to the original page. |
| Dashboard OAuth cache/timeouts and request forwarding | Dashboard upstream fixes or a verified replacement UI | Preserve callback ownership/state binding. No plugin hook was found that transparently rewrites these Next.js handlers. |
| Durable usage history and external management entry | Retain existing storage/access until a replacement UI is accepted | Preserve existing PostgreSQL history. Native plugin resources are separate from the current Dashboard-only Cloudflare route; plugin installation alone does not expose those pages. |

### Important correction: manual Reset already exists elsewhere

The earlier ecosystem report considered Quota Pacer, Quota Monitor, Quota Center and Codex Auto Reset. It did not establish the absence of manual-only reset across the entire ecosystem.

Account Config Manager's [v0.3.1469 release](https://github.com/Mxucc/cpa-account-config-manager/releases/tag/v0.3.1469) exposes `POST /accounts/quota-metadata/reset`, requires `confirm: true`, and checks account type and available credits. This endpoint does not require enabling Codex Auto Reset's automatic account worker. Its [handler](https://github.com/Mxucc/cpa-account-config-manager/blob/v0.3.1469/internal/manager/quota_metadata.go#L143-L179) and [confirmation test](https://github.com/Mxucc/cpa-account-config-manager/blob/v0.3.1469/internal/manager/quota_metadata_test.go#L223-L271) distinguish refreshing metadata from consuming a credit. No real reset was executed during this audit.

This plugin also declares scheduling, interception and provider capabilities. Before enabling it on the appliance, verify default behavior, scheduler delegation and request identity behavior with those features disabled. Do not enable a broad plugin merely because its reset/import page is useful.

Its [released Codex converter](https://github.com/Mxucc/cpa-account-config-manager/blob/v0.3.1469/internal/manager/import_parse.go#L461-L520) handles nested `tokens`. The [native-provider recognizer](https://github.com/Mxucc/cpa-account-config-manager/blob/v0.3.1469/internal/manager/import_native.go#L15-L38) does not unwrap `claudeAiOauth`. Failure or misclassification of that Claude wrapper is a source-derived finding; a synthetic fixture must reproduce it before implementing a fix.

## What the official plugin interface can carry

The [official examples](https://github.com/router-for-me/CLIProxyAPI/blob/5be2cdab/examples/plugin/README.md) and `sdk/pluginapi` expose provider/auth capabilities, model/executor integrations, request processing, quota providers, management APIs, and plugin-owned resources.

- A plugin can implement its own import preview/API/page and save compatible auth through the host. An auth parser capability does not imply a general pre-import hook for every built-in provider and existing upload route.
- A quota provider can expose fetch/reset behavior through the host's normalized quota interface. That does not automatically update a third-party Dashboard that calls a different API.
- Management resource pages are supported. There is no general Dashboard React component injection API or universal HTTP management middleware in the audited interface. Routes colliding with host-owned routes are skipped rather than replacing the host handler.
- `host.auth.save` accepts complete auth material. Do not treat a full-document save as an atomic patch of only priority/weight or as compare-and-swap against token refresh.
- Scheduler plugins can replace native selection. New functionality should preserve native weighted routing and affinity unless replacing both is an explicit design requirement.

## Smallest useful publication plan

1. Validate existing Account Config Manager imports/manual reset and inactive-policy behavior in an isolated upstream host with synthetic credentials. Add Claude export fixtures to expose the missing nested format.
2. Prepare targeted changes for existing plugins: Claude import normalization; safe Quota Pacer application/depleted exclusion; normalized Copilot quota. Keep these contributions separate from a new plugin repository.
3. Prepare the small host/Dashboard bug fixes for their owners. Use the standard quota API and plugin resource entry points wherever the consuming UI supports them.
4. If an independently useful gap remains, publish one narrowly scoped plugin for that gap. Do not bundle copies of existing OAuth providers, quota collectors, routing algorithms or account dashboards.
5. Run the upstream host and candidate plugin set side by side with isolated state. Retire the production fork patches only after the replacement passes import, quota, callback, streaming, WebSocket, affinity and management-access acceptance.

This investigation does not create a new GitHub repository, publish a release, submit upstream PRs, or migrate the live appliance. The smallest first implementation is a compatibility contribution to an existing plugin, not a new all-purpose plugin.

## Release and acceptance boundary

The [official store rules](https://github.com/router-for-me/CLIProxyAPI-Plugins-Store#release-requirements) require the author's repository to own release notes, binaries and checksums. A `v<version>` release supplies `<id>_<version>_<goos>_<goarch>.zip` with the matching dynamic library at the archive root and a SHA-256 `checksums.txt`. The store lists metadata in `registry.json`; store acceptance is a separate step from publishing a release.

Use the official dynamic-library ABI and test the exact host/plugin combination. Start with the appliance's Linux/amd64 platform and state the tested host version; advertise additional OS/architecture/libc combinations only after native validation. Preserve source licenses when adapting existing code.

Acceptance must cover no token disclosure, invalid/duplicate import handling, refresh preservation, manual-reset confirmation and idempotency, no automatic redemption when disabled, unchanged client-visible model IDs, HTTP streaming and WebSocket completion, native affinity on new/repeated/rebound sessions, and working authenticated external plugin pages. A fake upstream can validate reset semantics without consuming real subscription credits. Real account reset remains a separate explicitly chosen action.
