import unittest
from lan_maintenance import priorities


class PriorityTest(unittest.TestCase):
    def account(self, index, reset, remaining=1, provider="claude"):
        ids = ("seven-day", "five-hour") if provider == "claude" else ("secondary-window", "primary-window")
        return {"auth_index": index, "provider": provider, "groups": [
            {"id": ids[0], "resetTime": reset, "remainingFraction": remaining},
            {"id": ids[1], "remainingFraction": 1},
        ]}

    def test_reset_order_depletion_and_provider_isolation(self):
        accounts = [self.account("later", "2027-02-01T00:00:00Z"),
                    self.account("soon", "2027-01-01T00:00:00Z"),
                    self.account("empty", "2026-12-01T00:00:00Z", 0),
                    self.account("codex", "2027-01-01T00:00:00Z", provider="codex")]
        self.assertEqual(priorities(accounts, 0), {"empty": 0, "soon": 2, "later": 1, "codex": 1})

    def test_errors_missing_windows_and_stale_resets_do_not_change_priority(self):
        error = self.account("error", "2027-01-01T00:00:00Z")
        error["error"] = "quota unavailable"
        missing = self.account("missing", None)
        stale = self.account("stale", "1970-01-01T00:00:00Z")
        self.assertEqual(priorities([error, missing, stale], 1), {})

    def test_equal_reset_accounts_share_priority(self):
        accounts = [self.account("a", "2027-01-01T00:00:00Z"),
                    self.account("b", "2027-01-01T00:00:00Z"),
                    self.account("c", "2027-02-01T00:00:00Z")]
        self.assertEqual(priorities(accounts, 0), {"a": 2, "b": 2, "c": 1})

    def test_codex_weekly_quota_can_be_the_only_primary_window(self):
        account = {"provider": "codex", "auth_index": "pro", "groups": [{
            "id": "primary-window", "label": "168h Window",
            "resetTime": "2027-01-01T00:00:00Z", "remainingFraction": 0.53,
        }]}
        self.assertEqual(priorities([account], 0), {"pro": 1})


if __name__ == "__main__":
    unittest.main()
