import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const PANTRY_MCP_SCOPE = "pantry:read";
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const AUTH_CODE_TTL_SECONDS = 5 * 60;
const CLIENT_TTL_SECONDS = 60 * 60 * 24 * 365;

type TokenKind = "access" | "refresh" | "code" | "client";

interface SignedPayload {
  kind: TokenKind;
  iat: number;
  exp: number;
  clientId?: string;
  redirectUri?: string;
  redirectUris?: string[];
  codeChallenge?: string;
  resource?: string;
  scope?: string;
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function getSecret() {
  const secret = process.env.PANTRY_MCP_AUTH_SECRET;
  if (!secret || secret.length < 32) return null;
  return secret;
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function sign(kind: TokenKind, payload: Omit<SignedPayload, "kind" | "iat" | "exp">, ttlSeconds: number) {
  const secret = getSecret();
  if (!secret) throw new Error("PANTRY_MCP_AUTH_SECRET must be at least 32 characters");
  const now = Math.floor(Date.now() / 1000);
  const encoded = base64url(JSON.stringify({ ...payload, kind, iat: now, exp: now + ttlSeconds }));
  return `plmcp_${kind}_${encoded}.${signature(encoded, secret)}`;
}

function verify(value: string, expectedKind: TokenKind): SignedPayload | null {
  const secret = getSecret();
  if (!secret || !value.startsWith(`plmcp_${expectedKind}_`)) return null;
  const signed = value.slice(`plmcp_${expectedKind}_`.length);
  const separator = signed.lastIndexOf(".");
  if (separator < 1) return null;
  const encoded = signed.slice(0, separator);
  const supplied = signed.slice(separator + 1);
  const expected = signature(encoded, secret);
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SignedPayload;
    const now = Math.floor(Date.now() / 1000);
    return payload.kind === expectedKind && payload.exp > now ? payload : null;
  } catch {
    return null;
  }
}

export function getMcpBaseUrl(request: NextRequest) {
  const configured = process.env.PANTRY_MCP_BASE_URL?.trim().replace(/\/$/, "");
  return configured || new URL(request.url).origin;
}

export function getMcpResource(request: NextRequest) {
  return `${getMcpBaseUrl(request)}/api/mcp`;
}

export function isMcpAuthConfigured() {
  return Boolean(getSecret() && process.env.PANTRY_MCP_PASSWORD);
}

export function verifyPassword(candidate: string) {
  const password = process.env.PANTRY_MCP_PASSWORD;
  if (!password) return false;
  const candidateHash = createHash("sha256").update(candidate).digest();
  const passwordHash = createHash("sha256").update(password).digest();
  return timingSafeEqual(candidateHash, passwordHash);
}

export function createClientId(redirectUris: string[]) {
  return sign("client", { redirectUris }, CLIENT_TTL_SECONDS);
}

export function verifyClient(clientId: string, redirectUri?: string) {
  const payload = verify(clientId, "client");
  if (!payload?.redirectUris?.length) return null;
  if (redirectUri && !payload.redirectUris.includes(redirectUri)) return null;
  return payload;
}

export function createAuthorizationCode(input: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  resource: string;
  scope: string;
}) {
  return sign("code", input, AUTH_CODE_TTL_SECONDS);
}

export function verifyAuthorizationCode(code: string) {
  return verify(code, "code");
}

export function verifyPkce(codeVerifier: string, codeChallenge: string) {
  return createHash("sha256").update(codeVerifier).digest("base64url") === codeChallenge;
}

export function issueTokens(clientId: string, resource: string, scope = PANTRY_MCP_SCOPE) {
  return {
    access_token: sign("access", { clientId, resource, scope }, ACCESS_TOKEN_TTL_SECONDS),
    token_type: "Bearer" as const,
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: sign("refresh", { clientId, resource, scope }, REFRESH_TOKEN_TTL_SECONDS),
    scope,
  };
}

export function verifyRefreshToken(token: string) {
  return verify(token, "refresh");
}

export function verifyMcpRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;
  const payload = verify(authorization.slice(7), "access");
  return Boolean(payload?.resource === getMcpResource(request) && payload.scope?.split(" ").includes(PANTRY_MCP_SCOPE));
}

export function isAllowedRedirectUri(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const configured = (process.env.PANTRY_MCP_ALLOWED_REDIRECT_ORIGINS || "https://chatgpt.com")
      .split(",")
      .map((item) => item.trim().replace(/\/$/, ""))
      .filter(Boolean);
    return configured.includes(url.origin);
  } catch {
    return false;
  }
}

export function hasRequiredScope(scope: string) {
  return scope.split(/\s+/).includes(PANTRY_MCP_SCOPE);
}
