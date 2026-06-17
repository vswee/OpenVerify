export function jsonResponse(body, init = {}) {
  const headers = new Headers(init.headers ?? {});
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers,
  });
}

export async function readJson(request) {
  const text = await request.text();
  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON body: ${detail}`);
  }
}

export function getBearerToken(request) {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header) {
    return null;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function httpError(status, message, detail) {
  return jsonResponse(
    {
      error: message,
      detail,
    },
    { status },
  );
}

