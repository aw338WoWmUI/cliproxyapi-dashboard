import contextlib
import io
import unittest
from unittest.mock import patch

from lan_maintenance import main, pacing_fields


def item(index, provider="codex", fresh=True, reason="fresh remaining positive", **target):
    return {"auth_index": index, "provider": provider, "evidence_fresh": fresh,
            "status": "active", "reason": reason, "target": target}


class PacingTest(unittest.TestCase):
    def test_fresh_weights_and_depleted_exclusion(self):
        plan = [item("healthy", priority=100, weight=812),
                item("depleted", provider="claude", priority=0, reason="fresh remaining depleted")]
        self.assertEqual(pacing_fields(plan), {
            "healthy": {"priority": 100, "weight": 812},
            "depleted": {"priority": 0, "weight": 0},
        })

    def test_stale_other_providers_and_inactive_accounts_are_untouched(self):
        inactive = item("disabled", priority=100, weight=10)
        inactive["status"] = "disabled"
        self.assertEqual(pacing_fields([
            item("stale", fresh=False, priority=100, weight=10),
            item("ag", provider="antigravity", priority=100, weight=10), inactive]), {})

    def test_invalid_plugin_weights_fail_before_any_apply(self):
        for weight in [-1, 1_000_001, True, 1.5]:
            with self.subTest(weight=weight), self.assertRaises(ValueError):
                pacing_fields([item("bad", priority=100, weight=weight)])

    def test_main_patches_only_routing_fields_and_keeps_collection_and_websockets(self):
        files = [{"name": "native.json", "auth_index": "native", "provider": "codex", "priority": 1},
                 {"name": "disabled.json", "auth_index": "disabled", "provider": "codex", "disabled": True},
                 {"name": "other.json", "auth_index": "other", "provider": "antigravity", "priority": 9}]
        plan = {"snapshot": {"items": [item("native", priority=100, weight=812),
                                       item("disabled", priority=100, weight=12)]}}
        with patch.dict("os.environ", {"MANAGEMENT_API_KEY": "test", "COLLECTOR_API_KEY": "collector"}), \
                patch("lan_maintenance.request", side_effect=[{}, {"files": files}, plan, {}]) as request, \
                contextlib.redirect_stdout(io.StringIO()):
            main()
        self.assertTrue(request.call_args_list[0].args[0].endswith("/api/usage/collect"))
        self.assertIn("mode=dry-run", request.call_args_list[2].args[0])
        self.assertEqual(request.call_args_list[3].args[2:], ("PATCH", {
            "name": "native.json", "priority": 100, "weight": 812, "websockets": True}))
        self.assertEqual(request.call_count, 4)


if __name__ == "__main__":
    unittest.main()
