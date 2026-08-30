import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClientId, isAllowedRedirectUri, isMcpAuthConfigured } from "@/lib/mcp/auth";

export const runtime = "nodejs";

const registrationSchema = z.object({
  redirect_uris: z.array(z.string().url()).min(1).max(10),
  token_endpoint_auth_method: z.literal("none").optional().default("none"),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  client_name: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  if (!isMcpAuthConfigured()) return NextResponse.json({ error: "server_error" }, { status: 503 });
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.redirect_uris.some((uri) => !isAllowedRedirectUri(uri))) {
    return NextResponse.json({ error: "invalid_redirect_uri" }, { status: 400 });
  }
  const clientId = createClientId(parsed.data.redirect_uris);
  return NextResponse.json({
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    redirect_uris: parsed.data.redirect_uris,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    client_name: parsed.data.client_name || "ChatGPT Pantry connector",
  }, { status: 201 });
}
