import { NextRequest, NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { getMcpBaseUrl, isMcpAuthConfigured, PANTRY_MCP_SCOPE, verifyMcpRequest } from "@/lib/mcp/auth";
import { createPantryMcpServer } from "@/lib/mcp/pantry-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Last-Event-ID, MCP-Protocol-Version, MCP-Session-Id",
    "Access-Control-Expose-Headers": "MCP-Protocol-Version, MCP-Session-Id, WWW-Authenticate",
  };
}

function unauthorized(request: NextRequest) {
  const metadataUrl = `${getMcpBaseUrl(request)}/.well-known/oauth-protected-resource`;
  return NextResponse.json(
    { error: "authorization_required" },
    {
      status: 401,
      headers: {
        ...corsHeaders(),
        "WWW-Authenticate": `Bearer resource_metadata="${metadataUrl}", scope="${PANTRY_MCP_SCOPE}"`,
      },
    },
  );
}

async function handle(request: NextRequest) {
  if (!isMcpAuthConfigured()) {
    return NextResponse.json({ error: "Pantry MCP authentication is not configured" }, { status: 503, headers: corsHeaders() });
  }
  if (!verifyMcpRequest(request)) return unauthorized(request);

  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
  const server = createPantryMcpServer();
  await server.connect(transport);
  const response = await transport.handleRequest(request);
  for (const [key, value] of Object.entries(corsHeaders())) response.headers.set(key, value);
  return response;
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
