import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { normalizeImportedOAuthCredential } from "./oauth-import-normalization";

function normalize(provider: "claude" | "codex", input: unknown) {
  const result = normalizeImportedOAuthCredential(provider, JSON.stringify(input));
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error);
  return JSON.parse(result.normalizedContent);
}

describe("native subscription imports", () => {
  it("normalizes API-key-mode Codex auth.json", () => {
    expect(normalize("codex", { auth_mode: "api-key", OPENAI_API_KEY: "test-key" })).toMatchObject({ type: "codex", api_key: "test-key" });
  });
  it("flattens Claude OAuth without copying unrelated service credentials", () => {
    const result = normalize("claude", {
      mcpOAuth: { secret: "do-not-copy" },
      claudeAiOauth: { accessToken: "access", refreshToken: "refresh", expiresAt: 1800000000000 },
    });
    expect(result).toMatchObject({ type: "claude", access_token: "access", refresh_token: "refresh", expired: "2027-01-15T08:00:00.000Z" });
    expect(result).not.toHaveProperty("mcpOAuth");
    expect(result).not.toHaveProperty("claudeAiOauth");
    expect(result).not.toHaveProperty("refreshToken");
    expect(result).not.toHaveProperty("accessToken");
  });
  it("flattens native Codex auth.json and preserves account identity", () => {
    expect(normalize("codex", {
      auth_mode: "chatgpt", OPENAI_API_KEY: null, last_refresh: "2026-10-12T00:00:00Z",
      tokens: { access_token: "access", refresh_token: "refresh", id_token: "identity", account_id: "account" },
    })).toEqual({ type: "codex", access_token: "access", refresh_token: "refresh", id_token: "identity", account_id: "account", last_refresh: "2026-10-12T00:00:00Z" });
  });
  it("preserves proxy-native settings for additional accounts", () => {
    for (const provider of ["claude", "codex"] as const) {
      expect(normalize(provider, { type: provider, refresh_token: "refresh", access_token: "access", priority: 12, websockets: true })).toMatchObject({ type: provider, priority: 12, websockets: true });
    }
  });
  it("labels a native Codex subscription from its identity token", () => {
    const claims = Buffer.from(JSON.stringify({ email: "account@example.com" })).toString("base64url");
    expect(normalize("codex", { tokens: { refresh_token: "refresh", id_token: `header.${claims}.signature` } }).email).toBe("account@example.com");
    expect(normalize("codex", { tokens: { refresh_token: "refresh", id_token: "opaque" } })).not.toHaveProperty("email");
  });
  it("rejects invalid JSON and missing subscription credentials", () => {
    expect(normalizeImportedOAuthCredential("codex", "broken").ok).toBe(false);
    for (const input of [{}, [], { tokens: {} }, { claudeAiOauth: [] }]) {
      for (const provider of ["claude", "codex"] as const) {
        expect(normalizeImportedOAuthCredential(provider, JSON.stringify(input)).ok).toBe(false);
      }
    }
  });
});
