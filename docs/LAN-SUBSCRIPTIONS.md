# Personal LAN subscription gateway

The LAN deployment uses the CLIProxyAPI fork with OAuth credentials, this dashboard,
PostgreSQL, Caddy, and a restricted Docker socket proxy. The proxy's management
listener and dashboard backend stay on loopback. The appliance exposes API-key
authenticated HTTP inference at `http://192.168.100.36:8318` and HTTPS through
Caddy. The Cloudflare temporary address exposes the dashboard only.

## Add another subscription

In **Providers → Connect New Account**, choose Claude Code or Codex and click
**Import JSON**. Use a unique filename for each account. Supported inputs include
Claude's `claudeAiOauth` export, Codex's native `auth.json`, and CLIProxyAPI auth
JSON. Claude MCP authorizations are excluded from native imports. The OAuth
Connect button is also available for obtaining an independent login.

**Quota** shows provider-reported windows and reset times. Expand an account to
inspect each bucket. A weekly Codex window may be returned as `primary_window`;
the dashboard classifies its duration rather than assuming primary means 5h.
**Usage** shows only requests that traversed this gateway, not historical requests
made directly from other clients.

## Routing

In **Settings → Plugins**, install **Quota Pacer v1.0.19** and keep `auto_apply`
false with `provider_scope` set to `claude|codex`. The maintenance task below owns
application of its read-only plans; the plugin's native apply path must stay off.

In **Config**, select **weighted-round-robin**, enable **Session affinity** and
set its lifetime, for example `24h`. Existing installations must change the
strategy explicitly: ordinary round robin ignores credential weights. Verify
the saved strategy before starting the maintenance timer.
The proxy retains existing account bindings, inherits parent bindings for
subagents, and rebinds on quota failures. Weighted round robin chooses among
accounts at the same priority for new or rebound conversations.

`infrastructure/lan_maintenance.py` is an optional deployment task, separate from
the dashboard server. In this appliance it runs every minute with
`MANAGEMENT_API_KEY` and `COLLECTOR_API_KEY` from a root-readable environment file.
It uses loopback ports 3000 (dashboard) and 28317 (proxy), collects request usage,
and requests Quota Pacer dry-run plans for Claude and Codex. It applies fresh
priority/weight targets through the host field API, explicitly excluding accounts
with confirmed depleted quota using weight 0. Disabled accounts, stale evidence
and other providers are untouched. The plugin reuses a 15-minute probe cache
between fresh quota checks. Codex upstream WebSockets remain enabled; the proxy
handles per-model cooldown/failover. Antigravity weights are not changed because
its model groups can have independent quota.

The task uses the maintained v8 credential management endpoints and modifies
only priority/weight/WebSocket fields, preserving provider tokens. Stop its systemd timer
before managing account priorities manually. It does not change existing session
bindings; those are in memory and are cleared when the proxy restarts.

## Operations

On the appliance, runtime files live under `/opt/cliproxy`; `.env`, `auths/`, the
TLS key, PostgreSQL volume, and dashboard backup volume contain private state.
Never commit these files. Keep an encrypted backup of them before upgrades.
Copied refresh tokens share the original login's lifecycle; if either copy is
revoked or refresh-token rotation rejects the other copy, reconnect that account
with an independent OAuth login.

The initial LAN certificate is locally issued. Trust its certificate on devices
that use the HTTPS endpoints; no TLS verification needs to be disabled in clients.
Use `cliproxy.local` for mDNS-capable clients or the VM's current LAN address.
The VM starts automatically with PVE, Docker services use `unless-stopped`, and
the maintenance timer is enabled at boot. Rebuild the dashboard from this branch
when upgrading; replacing it with an upstream image would remove these changes.

Checks:

```sh
cd dashboard
npm test
npm run typecheck
npm run lint
cd ..
python3 -m unittest discover -s infrastructure -p test_lan_maintenance.py
```
