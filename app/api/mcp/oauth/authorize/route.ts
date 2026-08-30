import { NextRequest, NextResponse } from "next/server";
import { createAuthorizationCode, getMcpBaseUrl, getMcpResource, hasRequiredScope, isMcpAuthConfigured, verifyClient, verifyPassword } from "@/lib/mcp/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; resetAt: number }>();

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character] as string));
}

function readParams(params: URLSearchParams, request: NextRequest) {
  const values = {
    responseType: params.get("response_type") || "",
    clientId: params.get("client_id") || "",
    redirectUri: params.get("redirect_uri") || "",
    state: params.get("state") || "",
    codeChallenge: params.get("code_challenge") || "",
    codeChallengeMethod: params.get("code_challenge_method") || "",
    resource: params.get("resource") || "",
    scope: params.get("scope") || "",
  };
  const valid = values.responseType === "code"
    && values.codeChallengeMethod === "S256"
    && values.codeChallenge.length >= 43
    && values.resource === getMcpResource(request)
    && hasRequiredScope(values.scope)
    && Boolean(verifyClient(values.clientId, values.redirectUri));
  return { values, valid };
}

function html(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "DENY" },
  });
}

export function GET(request: NextRequest) {
  if (!isMcpAuthConfigured()) return html("<h1>Pantry MCP 인증이 설정되지 않았습니다.</h1>", 503);
  const { values, valid } = readParams(request.nextUrl.searchParams, request);
  if (!valid) return html("<h1>잘못된 OAuth 요청입니다.</h1><p>ChatGPT 연결 화면에서 다시 시작해 주세요.</p>", 400);
  const hidden = Object.entries({
    response_type: values.responseType,
    client_id: values.clientId,
    redirect_uri: values.redirectUri,
    state: values.state,
    code_challenge: values.codeChallenge,
    code_challenge_method: values.codeChallengeMethod,
    resource: values.resource,
    scope: values.scope,
  }).map(([name, value]) => `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`).join("");
  return html(`<!doctype html><html lang="ko"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pantry 연결</title><style>body{margin:0;background:#0a0a0a;color:#f5f5f5;font-family:system-ui,sans-serif;display:grid;min-height:100vh;place-items:center}.card{width:min(420px,calc(100% - 32px));box-sizing:border-box;border:1px solid #3f3f46;border-radius:18px;padding:28px;background:#18181b}h1{font-size:24px;margin:0 0 10px}p{color:#a1a1aa;line-height:1.6}label{display:block;font-size:13px;margin:22px 0 8px}input[type=password]{width:100%;box-sizing:border-box;border:1px solid #52525b;border-radius:10px;background:#09090b;color:white;padding:13px}button{width:100%;border:0;border-radius:10px;background:#fb923c;color:#111827;font-weight:700;padding:13px;margin-top:14px;cursor:pointer}.note{font-size:12px}</style></head><body><main class="card"><h1>🧑‍🍳 Japan Life Pantry</h1><p>ChatGPT가 보유 재료와 신선도, 요리 추천을 읽도록 연결합니다. 재료를 추가하거나 삭제할 권한은 제공하지 않습니다.</p><form method="post">${hidden}<label for="password">Pantry 연결 비밀번호</label><input id="password" name="password" type="password" required autofocus autocomplete="current-password"><button type="submit">읽기 권한 연결</button></form><p class="note">비밀번호는 이 서버에서만 확인하며 ChatGPT에 전달하지 않습니다.</p></main></body></html>`);
}

export async function POST(request: NextRequest) {
  if (!isMcpAuthConfigured()) return html("<h1>Pantry MCP 인증이 설정되지 않았습니다.</h1>", 503);
  const form = await request.formData();
  const params = new URLSearchParams();
  for (const key of ["response_type", "client_id", "redirect_uri", "state", "code_challenge", "code_challenge_method", "resource", "scope"]) {
    const value = form.get(key);
    if (typeof value === "string") params.set(key, value);
  }
  const { values, valid } = readParams(params, request);
  if (!valid) return html("<h1>잘못된 OAuth 요청입니다.</h1>", 400);

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwarded || "unknown";
  const now = Date.now();
  if (attempts.size > 100) {
    for (const [attemptKey, attempt] of attempts) {
      if (attempt.resetAt <= now) attempts.delete(attemptKey);
    }
  }
  const current = attempts.get(key);
  if (current && current.resetAt > now && current.count >= 5) return html("<h1>로그인 시도가 너무 많습니다.</h1><p>10분 후 다시 시도해 주세요.</p>", 429);

  const password = form.get("password");
  if (typeof password !== "string" || !verifyPassword(password)) {
    attempts.set(key, current && current.resetAt > now ? { ...current, count: current.count + 1 } : { count: 1, resetAt: now + 10 * 60 * 1000 });
    return html("<h1>비밀번호가 맞지 않습니다.</h1><p>ChatGPT 연결 화면으로 돌아가 다시 시도해 주세요.</p>", 401);
  }
  attempts.delete(key);

  const code = createAuthorizationCode({
    clientId: values.clientId,
    redirectUri: values.redirectUri,
    codeChallenge: values.codeChallenge,
    resource: values.resource,
    scope: values.scope,
  });
  const redirect = new URL(values.redirectUri);
  redirect.searchParams.set("code", code);
  if (values.state) redirect.searchParams.set("state", values.state);
  redirect.searchParams.set("iss", getMcpBaseUrl(request));
  // OAuth authorization responses must return the user agent to the client
  // callback with a GET. NextResponse defaults to 307, which preserves this
  // form POST and makes ChatGPT's callback reject the request as Bad Request.
  return NextResponse.redirect(redirect, 303);
}
