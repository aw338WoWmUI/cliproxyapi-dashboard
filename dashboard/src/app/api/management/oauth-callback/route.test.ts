import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.hoisted(() => {
  process.env.CLIPROXYAPI_MANAGEMENT_URL = "http://cliproxyapi:8317/v0/management";
  process.env.MANAGEMENT_API_KEY = "test-management-key";
});
vi.mock("@/lib/auth/session", () => ({ verifySession: vi.fn(async () => ({ userId: "user" })) }));
vi.mock("@/lib/auth/origin", () => ({ validateOrigin: vi.fn(() => null) }));
vi.mock("@/lib/auth/rate-limit", () => ({ checkRateLimitWithPreset: vi.fn(() => ({ allowed: true })) }));
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { POST } from "./route";

describe("OAuth callback relay", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ files: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response("invalid code", { status: 400 })));
  });

  it.each([
    ["gemini-cli", "/v0/management/oauth-callback"],
    ["claude", "/anthropic/callback"],
  ])("relays %s to its owning callback handler", async (provider, path) => {
    const response = await POST(new NextRequest("https://dashboard.example/api/management/oauth-callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, callbackUrl: "http://localhost/?code=code-value&state=state-value" }),
    }));
    expect(response.status).toBe(400);
    const callback = new URL(String(vi.mocked(fetch).mock.calls[1]?.[0]));
    expect(callback.pathname).toBe(path);
    expect(callback.searchParams.get("code")).toBe("code-value");
    expect(callback.searchParams.get("state")).toBe("state-value");
  });
});
