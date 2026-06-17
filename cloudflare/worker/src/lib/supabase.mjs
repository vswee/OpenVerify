import { randomToken, sha256Hex, slugify } from "./crypto.mjs";

function requireSupabase(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase is not configured.");
  }
}

function supabaseHeaders(env, extraHeaders = {}) {
  requireSupabase(env);
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "content-type": "application/json",
    ...extraHeaders,
  };
}

function makeUrl(env, table, query = {}) {
  requireSupabase(env);
  const url = new URL(`/rest/v1/${table}`, env.SUPABASE_URL);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

async function parseSupabaseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function supabaseRequest(env, table, { method = "GET", query = {}, body, headers = {}, prefer, signal } = {}) {
  const url = makeUrl(env, table, query);
  const requestHeaders = supabaseHeaders(env, headers);
  if (prefer) {
    requestHeaders.prefer = prefer;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const detail = await parseSupabaseResponse(response);
    throw new Error(`Supabase ${method} ${table} failed: ${response.status} ${JSON.stringify(detail)}`);
  }

  return parseSupabaseResponse(response);
}

export async function selectRows(env, table, filters = {}, select = "*") {
  const query = { select };
  for (const [column, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      query[column] = `eq.${value}`;
    }
  }
  return (await supabaseRequest(env, table, { query })) ?? [];
}

export async function selectRow(env, table, filters = {}, select = "*") {
  const rows = await selectRows(env, table, filters, select);
  return rows[0] ?? null;
}

export async function insertRow(env, table, row, select = "*") {
  const result = await supabaseRequest(env, table, {
    method: "POST",
    query: { select },
    body: row,
    prefer: "return=representation",
  });
  return Array.isArray(result) ? result[0] ?? null : result;
}

export async function insertRows(env, table, rows, select = "*") {
  const result = await supabaseRequest(env, table, {
    method: "POST",
    query: { select },
    body: rows,
    prefer: "return=representation",
  });
  return Array.isArray(result) ? result : result ? [result] : [];
}

export async function updateRows(env, table, filters, patch, select = "*") {
  const query = { select };
  for (const [column, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      query[column] = `eq.${value}`;
    }
  }
  const result = await supabaseRequest(env, table, {
    method: "PATCH",
    query,
    body: patch,
    prefer: "return=representation",
  });
  return Array.isArray(result) ? result : result ? [result] : [];
}

export async function deleteRows(env, table, filters) {
  const query = {};
  for (const [column, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      query[column] = `eq.${value}`;
    }
  }
  await supabaseRequest(env, table, {
    method: "DELETE",
    query,
    prefer: "return=minimal",
  });
}

export async function findDeploymentByPublicKey(env, publicKey) {
  return selectRow(env, "deployments", { public_key: publicKey });
}

export async function findDeploymentById(env, deploymentId) {
  return selectRow(env, "deployments", { id: deploymentId });
}

export async function findSessionById(env, sessionId) {
  return selectRow(env, "verification_sessions", { id: sessionId });
}

export async function findAssetsBySessionId(env, sessionId) {
  return selectRows(env, "verification_assets", { verification_session_id: sessionId }, "*");
}

export async function findExtractedDataBySessionId(env, sessionId) {
  return selectRow(env, "verification_extracted_data", { verification_session_id: sessionId });
}

export async function findFaceMatchBySessionId(env, sessionId) {
  return selectRow(env, "face_match_results", { verification_session_id: sessionId });
}

export async function findElectoralMatchBySessionId(env, sessionId) {
  return selectRow(env, "electoral_register_matches", { verification_session_id: sessionId });
}

export async function findWebhookEventsBySessionId(env, sessionId) {
  return selectRows(env, "webhook_events", { verification_session_id: sessionId });
}

export async function findManualReviewsBySessionId(env, sessionId) {
  return selectRows(env, "manual_reviews", { verification_session_id: sessionId });
}

export async function createAccountRecord(env, input) {
  const account = await insertRow(
    env,
    "accounts",
    {
      name: input.name,
      slug: slugify(input.name),
      status: "active",
    },
    "*",
  );

  const existingProfiles = await selectRows(env, "profiles", {}, "id");
  const profileRole = existingProfiles.length === 0 ? "super_admin" : "admin";

  const profile = await insertRow(
    env,
    "profiles",
    {
      account_id: account.id,
      full_name: input.fullName,
      email: input.email,
      role: profileRole,
    },
    "*",
  );

  return {
    account,
    profile,
  };
}

export async function createDeploymentRecord(env, input) {
  const publicKey = randomToken("dep_pub_", 18);
  const secretKey = randomToken("dep_sec_", 24);
  const secretHash = await sha256Hex(secretKey);
  const webhookSecret = input.webhookSecret ?? randomToken("whsec_", 24);

  const deployment = await insertRow(
    env,
    "deployments",
    {
      account_id: input.accountId,
      name: input.name,
      description: input.description ?? "",
      public_key: publicKey,
      secret_key_hash: secretHash,
      webhook_url: input.webhookUrl,
      webhook_secret: webhookSecret,
      success_redirect_url: input.successRedirectUrl,
      pending_redirect_url: input.pendingRedirectUrl,
      failure_redirect_url: input.failureRedirectUrl,
      allowed_origins: input.allowedOrigins ?? [],
      branding: input.branding ?? {},
      status: input.status ?? "active",
      test_mode: input.testMode ?? true,
      requester_name: input.requesterName,
    },
    "*",
  );

  return {
    deployment,
    secretKey,
  };
}

