import { NextRequest, NextResponse } from "next/server";
import { getMcpBaseUrl, PANTRY_MCP_SCOPE } from "@/lib/mcp/auth";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const baseUrl = getMcpBaseUrl(request);
  return NextResponse.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/mcp/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/mcp/oauth/token`,
    registration_endpoint: `${baseUrl}/api/mcp/oauth/register`,
    authorization_response_iss_parameter_supported: true,
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: [PANTRY_MCP_SCOPE],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
  });
}
