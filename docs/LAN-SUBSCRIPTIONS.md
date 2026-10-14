# Personal LAN subscription gateway

The LAN deployment uses the CLIProxyAPI fork with OAuth credentials, this dashboard,
PostgreSQL, Caddy, and a restricted Docker socket proxy. The proxy's management
listener and dashboard backend stay on loopback; Caddy exposes authenticated HTTPS
to `192.168.100.0/24`. No client settings on the original workstation are changed.

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

In **Config**, enable **Session affinity** and set its lifetime, for example `24h`.
The proxy retains existing account bindings, inherits parent bindings for
subagents, and rebinds on quota/auth failures. Round robin chooses among accounts
at the same priority for new conversations.

`infrastructure/lan_maintenance.py` is an optional deployment task, separate from
the dashboard server. In this appliance it runs every minute with
`MANAGEMENT_API_KEY` and `COLLECTOR_API_KEY` from a root-readable environment file.
It uses loopback ports 3000 (dashboard) and 28317 (proxy), collects request usage,
and sets higher priority on healthy accounts whose shared weekly quota resets
sooner, independently for Claude and Codex. It skips disabled accounts, leaves
priority unchanged when quota cannot be determined, and enables Codex upstream
WebSockets. Model-specific weekly buckets remain visible but do not determine
this shared-account priority. The proxy handles per-model cooldown/failover.

The task uses the maintained v8 credential management endpoints and modifies
only priority/WebSocket fields, preserving provider tokens. Stop its systemd timer
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
