import { NextRequest, NextResponse } from "next/server";
import { getMcpResource, issueTokens, verifyAuthorizationCode, verifyClient, verifyPkce, verifyRefreshToken } from "@/lib/mcp/auth";

export const runtime = "nodejs";

const usedCodes = new Set<string>();

function oauthError(error: string, description: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const grantType = form.get("grant_type");
  const clientId = form.get("client_id");
  const resource = form.get("resource");
  if (typeof clientId !== "string" || !verifyClient(clientId)) return oauthError("invalid_client", "Unknown client", 401);
  if (resource !== getMcpResource(request)) return oauthError("invalid_target", "Unexpected resource");

  if (grantType === "authorization_code") {
    const code = form.get("code");
    const redirectUri = form.get("redirect_uri");
    const codeVerifier = form.get("code_verifier");
    if (typeof code !== "string" || typeof redirectUri !== "string" || typeof codeVerifier !== "string") return oauthError("invalid_request", "Missing authorization code fields");
    if (usedCodes.has(code)) return oauthError("invalid_grant", "Authorization code was already used");
    const payload = verifyAuthorizationCode(code);
    if (!payload || payload.clientId !== clientId || payload.redirectUri !== redirectUri || payload.resource !== resource || !payload.codeChallenge || !verifyPkce(codeVerifier, payload.codeChallenge)) {
      return oauthError("invalid_grant", "Authorization code or PKCE verifier is invalid");
    }
    usedCodes.add(code);
    return NextResponse.json(issueTokens(clientId, resource, payload.scope), { headers: { "Cache-Control": "no-store" } });
  }

  if (grantType === "refresh_token") {
    const refreshToken = form.get("refresh_token");
    if (typeof refreshToken !== "string") return oauthError("invalid_request", "Missing refresh token");
    const payload = verifyRefreshToken(refreshToken);
    if (!payload || payload.clientId !== clientId || payload.resource !== resource) return oauthError("invalid_grant", "Refresh token is invalid");
    return NextResponse.json(issueTokens(clientId, resource, payload.scope), { headers: { "Cache-Control": "no-store" } });
  }

  return oauthError("unsupported_grant_type", "Only authorization_code and refresh_token are supported");
}
