import { NextRequest, NextResponse } from "next/server";
import { getMcpBaseUrl, getMcpResource, PANTRY_MCP_SCOPE } from "@/lib/mcp/auth";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const baseUrl = getMcpBaseUrl(request);
  return NextResponse.json({
    resource: getMcpResource(request),
    authorization_servers: [baseUrl],
    scopes_supported: [PANTRY_MCP_SCOPE],
    resource_documentation: `${baseUrl}/cooking`,
  });
}
