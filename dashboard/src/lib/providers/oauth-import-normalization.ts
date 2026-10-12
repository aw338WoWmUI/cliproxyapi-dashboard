import "server-only";
import { type OAuthProvider, OAUTH_PROVIDER } from "./constants";

export type NormalizationResult = 
  | { ok: true; normalizedContent: string }
  | { ok: false; error: string };

/**
 * Normalizes OAuth credential JSON from various formats into a consistent structure.
 * Different OAuth providers may export credentials in different formats.
 * This function attempts to parse and validate the content.
 */
export function normalizeImportedOAuthCredential(
  provider: OAuthProvider,
  fileContent: string
): NormalizationResult {
  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(fileContent);
  } catch {
    return { ok: false, error: "Invalid JSON content" };
  }

  if (!parsedContent || typeof parsedContent !== "object" || Array.isArray(parsedContent)) {
    return { ok: false, error: "Credential file must contain a JSON object, not an array" };
  }

  const content = parsedContent as Record<string, unknown>;

  // Provider-specific normalization
  switch (provider) {
    case OAUTH_PROVIDER.CLAUDE:
      return normalizeClaudeCredential(content);
    case OAUTH_PROVIDER.GEMINI_CLI:
      return normalizeGeminiCredential(content);
    case OAUTH_PROVIDER.CODEX:
      return normalizeCodexCredential(content);
    case OAUTH_PROVIDER.COPILOT:
      return normalizeCopilotCredential(content);
    case OAUTH_PROVIDER.CURSOR:
      return normalizeCursorCredential(content);
    default:
      // For other providers, just validate basic structure and pass through
      return normalizeGenericCredential(content);
  }
}

function normalizeClaudeCredential(content: Record<string, unknown>): NormalizationResult {
  // Native Claude exports also contain unrelated MCP tokens; import only Claude OAuth.
  const oauth = content.claudeAiOauth && typeof content.claudeAiOauth === "object"
    ? content.claudeAiOauth as Record<string, unknown> : content;
  const { accessToken, refreshToken: nativeRefreshToken, expiresAt, ...metadata } = oauth;
  const refreshToken = oauth.refresh_token ?? nativeRefreshToken;
  if (typeof refreshToken !== "string" || !refreshToken.trim()) {
    return { ok: false, error: "Claude credential must contain refresh_token" };
  }
  const expired = typeof expiresAt === "number" && Number.isFinite(expiresAt) && Math.abs(expiresAt) <= 8.64e15
    ? new Date(expiresAt).toISOString() : oauth.expired;
  return { ok: true, normalizedContent: JSON.stringify({
    ...metadata, type: "claude", refresh_token: refreshToken,
    access_token: oauth.access_token ?? accessToken, expired,
  }) };
}

function normalizeGeminiCredential(content: Record<string, unknown>): NormalizationResult {
  // Gemini CLI credentials
  if (!content.refresh_token && !content.refreshToken) {
    return { ok: false, error: "Gemini credential must contain refresh_token" };
  }
  return { ok: true, normalizedContent: JSON.stringify(content) };
}

function normalizeCodexCredential(content: Record<string, unknown>): NormalizationResult {
  const tokens = content.tokens && typeof content.tokens === "object" && !Array.isArray(content.tokens)
    ? content.tokens as Record<string, unknown> : content;
  if (!tokens.refresh_token && !tokens.api_key && !tokens.accessToken && !tokens.access_token) {
    return { ok: false, error: "Codex credential must contain refresh_token, api_key, or accessToken" };
  }
  let email = tokens.email;
  if (!email && typeof tokens.id_token === "string") {
    try {
      // Display metadata only; the upstream verifies the actual credential.
      const claims: unknown = JSON.parse(Buffer.from(tokens.id_token.split(".")[1] ?? "", "base64url").toString("utf8"));
      if (claims && typeof claims === "object" && "email" in claims && typeof claims.email === "string") email = claims.email;
    } catch {
      // Non-JWT tokens remain usable without an email label.
    }
  }
  return { ok: true, normalizedContent: JSON.stringify({
    ...tokens, type: "codex", access_token: tokens.access_token ?? tokens.accessToken,
    email,
    last_refresh: content.last_refresh ?? tokens.last_refresh,
  }) };
}

function normalizeCopilotCredential(content: Record<string, unknown>): NormalizationResult {
  // GitHub Copilot credentials
  if (!content.oauth_token && !content.token && !content.access_token) {
    return { ok: false, error: "Copilot credential must contain oauth_token, token, or access_token" };
  }
  return { ok: true, normalizedContent: JSON.stringify(content) };
}

function normalizeCursorCredential(content: Record<string, unknown>): NormalizationResult {
  // Cursor credentials
  if (!content.accessToken && !content.access_token && !content.refreshToken && !content.refresh_token) {
    return { ok: false, error: "Cursor credential must contain accessToken or refreshToken" };
  }
  return { ok: true, normalizedContent: JSON.stringify(content) };
}

function normalizeGenericCredential(content: Record<string, unknown>): NormalizationResult {
  // For unknown providers, validate there's at least some token-like field
  const hasToken = Object.keys(content).some(key => 
    key.toLowerCase().includes("token") || 
    key.toLowerCase().includes("key") ||
    key.toLowerCase().includes("secret") ||
    key.toLowerCase().includes("credential")
  );

  if (!hasToken && Object.keys(content).length === 0) {
    return { ok: false, error: "Credential file appears to be empty or invalid" };
  }

  return { ok: true, normalizedContent: JSON.stringify(content) };
}
