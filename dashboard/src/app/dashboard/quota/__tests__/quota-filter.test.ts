import { describe, expect, it } from "vitest";
import { filterQuotaAccounts } from "../page";
import { DEFAULT_QUOTA_QUERY_STATE } from "@/lib/quota/query-state";
import type { QuotaAccount } from "@/lib/model-first-monitoring";

describe("quota account status filter", () => {
  it.each([{ remaining: 0.8, status: "active" }, { remaining: 0.1, status: "warning" }])
    ("classifies main quota $remaining as $status despite an exhausted scoped limit", ({ remaining, status }) => {
      const account: QuotaAccount = { auth_index: "fixture", provider: "codex", supported: true, groups: [
        { id: "primary-window", label: "Main", remainingFraction: remaining, resetTime: null, models: [] },
        { id: "code-review-primary-window", label: "Code Review", remainingFraction: 0, resetTime: null, models: [], scope: { id: "code-review", label: "Code Review" } },
      ] };
      expect(filterQuotaAccounts([account], { ...DEFAULT_QUOTA_QUERY_STATE, status: "active" })).toHaveLength(status === "active" ? 1 : 0);
      expect(filterQuotaAccounts([account], { ...DEFAULT_QUOTA_QUERY_STATE, status: "warning" })).toHaveLength(status === "warning" ? 1 : 0);
    });
});
