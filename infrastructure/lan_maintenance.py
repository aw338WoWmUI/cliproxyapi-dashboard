#!/usr/bin/env python3
"""Collect usage and prefer healthy subscriptions whose weekly quota resets first."""
import datetime as dt
import json
import math
import os
import urllib.request


def priorities(accounts, now):
    result = {}
    # shortcut: rank shared weekly quotas only; use model-specific routing when scoped buckets diverge.
    for provider, weekly_id, session_id in [
        ("claude", "seven-day", "five-hour"),
        ("codex", "secondary-window", "primary-window"),
    ]:
        eligible = []
        depleted = []
        for account in accounts:
            if account.get("provider") != provider or account.get("error"):
                continue
            groups = {g["id"]: g for g in account.get("groups", [])}
            weekly = groups.get(weekly_id)
            session = groups.get(session_id)
            if provider == "codex":
                weekly = next((g for g in groups.values() if g.get("label") == "168h Window"), weekly)
                session = next((g for g in groups.values() if g.get("label") == "5h Window"), None)
            if not weekly:
                continue
            try:
                reset = dt.datetime.fromisoformat(str(weekly["resetTime"]).replace("Z", "+00:00")).timestamp()
                remaining = min(weekly["remainingFraction"], session["remainingFraction"] if session else 1)
            except (KeyError, TypeError, ValueError):
                continue
            if reset <= now or not math.isfinite(remaining):
                continue
            if remaining <= 0:
                depleted.append(str(account["auth_index"]))
            else:
                eligible.append((reset, str(account["auth_index"])))
        result.update({index: 0 for index in depleted})
        eligible.sort()
        result.update({index: len(eligible) - rank for rank, (_, index) in enumerate(eligible)})
    return result


def request(url, headers, method="GET", data=None):
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, method=method,
                                 headers={**headers, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as response:
        return json.load(response)


def main():
    key = os.environ["MANAGEMENT_API_KEY"]
    dashboard = "http://127.0.0.1:3000"
    proxy = "http://127.0.0.1:28317/v8/management"
    request(dashboard + "/api/usage/collect",
            {"Authorization": "Bearer " + os.environ["COLLECTOR_API_KEY"]}, "POST", {})
    quotas = request(dashboard + "/api/quota", {"x-internal-key": key})
    headers = {"Authorization": "Bearer " + key}
    files = request(proxy + "/credentials", headers)["files"]
    enabled = {str(f["auth_index"]) for f in files if not f.get("disabled")}
    ranked = priorities([a for a in quotas["accounts"] if str(a["auth_index"]) in enabled],
                        dt.datetime.now(dt.timezone.utc).timestamp())
    changed = 0
    for file in files:
        if file.get("disabled"):
            continue
        patch = {"name": file["name"]}
        index = str(file["auth_index"])
        if index in ranked and file.get("priority", 0) != ranked[index]:
            patch["priority"] = ranked[index]
        if file.get("provider") == "codex" and file.get("websockets") is not True:
            patch["websockets"] = True
        if len(patch) > 1:
            request(proxy + "/credentials/fields", headers, "PATCH", patch)
            changed += 1
    print(json.dumps({"quota_accounts": len(quotas["accounts"]), "ranked_accounts": len(ranked),
                      "changed_accounts": changed}))


if __name__ == "__main__":
    main()
