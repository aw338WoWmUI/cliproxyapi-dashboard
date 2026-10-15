#!/usr/bin/env python3
"""Collect usage and apply Quota Pacer plans through the host field-update API."""
import json
import os
import urllib.request


def pacing_fields(items):
    result = {}
    for item in items:
        if (item.get("provider") not in ("claude", "codex")
                or not item.get("evidence_fresh") or item.get("status") != "active"):
            continue
        target = item["target"]
        priority = target["priority"]
        if type(priority) is not int:
            raise ValueError("Quota Pacer priority must be an integer")
        fields = {"priority": priority}
        weight = target.get("weight")
        if item.get("reason") == "fresh remaining depleted":
            weight = 0
        if weight is not None:
            if type(weight) is not int or not 0 <= weight <= 1_000_000:
                raise ValueError("Quota Pacer weight is outside the host range")
            fields["weight"] = weight
        result[str(item["auth_index"])] = fields
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
    headers = {"Authorization": "Bearer " + key}
    files = request(proxy + "/credentials", headers)["files"]
    # Keep the plugin read-only: its native apply path writes credential files directly.
    plan = request("http://127.0.0.1:28317/v0/management/plugins/quota-pacer/run"
                   "?mode=dry-run&provider=claude&provider=codex", headers, "POST", {})
    ranked = pacing_fields(plan["snapshot"]["items"])
    changed = 0
    for file in files:
        if file.get("disabled"):
            continue
        patch = {"name": file["name"]}
        index = str(file["auth_index"])
        for field, value in ranked.get(index, {}).items():
            if file.get(field, 1 if field == "weight" else 0) != value:
                patch[field] = value
        if file.get("provider") == "codex" and file.get("websockets") is not True:
            patch["websockets"] = True
        if len(patch) > 1:
            request(proxy + "/credentials/fields", headers, "PATCH", patch)
            changed += 1
    print(json.dumps({"planned_accounts": len(ranked),
                      "changed_accounts": changed}))


if __name__ == "__main__":
    main()
