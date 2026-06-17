import { sha256Hex, randomToken, isoPlusSeconds, nowIso } from "./lib/crypto.mjs";
import { getBearerToken, httpError, jsonResponse, readJson } from "./lib/http.mjs";
import {
  createAccountRecord,
  createDeploymentRecord,
  deleteRows,
  findAssetsBySessionId,
  findDeploymentById,
  findDeploymentByPublicKey,
  findElectoralMatchBySessionId,
  findExtractedDataBySessionId,
  findFaceMatchBySessionId,
  findManualReviewsBySessionId,
  findSessionById,
  findWebhookEventsBySessionId,
  insertRow,
  insertRows,
  selectRow,
  updateRows,
} from "./lib/supabase.mjs";
import { processVerification } from "./lib/processor.mjs";

const SESSION_TOKEN_HEADER = "x-openverify-token";

function baseUrlForRequest(env, request) {
  return env.OPENVERIFY_BASE_URL || new URL(request.url).origin;
}

function deploymentSecretDigest(secret) {
  return sha256Hex(secret);
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getSessionToken(request) {
  const headerToken = request.headers.get(SESSION_TOKEN_HEADER);
  if (headerToken) {
    return headerToken.trim();
  }

  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  return queryToken ? queryToken.trim() : null;
}

async function requireDeployment(env, request, deploymentKey) {
  const providedSecret = getBearerToken(request);
  if (!providedSecret) {
    throw httpError(401, "Missing deployment secret.");
  }

  const deployment = await findDeploymentByPublicKey(env, deploymentKey);
  if (!deployment) {
    throw httpError(404, "Deployment not found.");
  }

  const providedHash = await deploymentSecretDigest(providedSecret);
  if (providedHash !== deployment.secret_key_hash) {
    throw httpError(403, "Invalid deployment secret.");
  }

  return deployment;
}

async function requireSessionAccess(env, request, sessionId) {
  const session = await findSessionById(env, sessionId);
  if (!session) {
    throw httpError(404, "Verification session not found.");
  }

  const token = getSessionToken(request);
  if (!token) {
    throw httpError(401, "Missing verification token.");
  }

  const tokenHash = await sha256Hex(token);
  if (tokenHash !== session.verification_token_hash) {
    throw httpError(403, "Invalid verification token.");
  }

  return session;
}

async function loadSessionAggregate(env, sessionId) {
  const session = await findSessionById(env, sessionId);
  if (!session) {
    return null;
  }

  const [deployment, assets, extractedData, faceMatch, electoralMatch, manualReviews, webhookEvents] = await Promise.all([
    findDeploymentById(env, session.deployment_id),
    findAssetsBySessionId(env, sessionId),
    findExtractedDataBySessionId(env, sessionId),
    findFaceMatchBySessionId(env, sessionId),
    findElectoralMatchBySessionId(env, sessionId),
    findManualReviewsBySessionId(env, sessionId),
    findWebhookEventsBySessionId(env, sessionId),
  ]);

  return {
    session,
    deployment,
    assets,
    extractedData,
    faceMatch,
    electoralMatch,
    manualReviews,
    webhookEvents,
  };
}

async function createVerificationSession(env, request) {
  const body = await readJson(request);
  const deploymentKey = typeof body.deployment_key === "string" ? body.deployment_key.trim() : "";
  if (!deploymentKey) {
    throw httpError(400, "deployment_key is required.");
  }

  const deployment = await requireDeployment(env, request, deploymentKey);

  const externalReference = typeof body.external_reference === "string" ? body.external_reference.trim() : "";
  const subjectName = typeof body.subject_name === "string" ? body.subject_name.trim() : "";
  const subjectEmail = typeof body.subject_email === "string" ? body.subject_email.trim() : "";
  if (!externalReference || !subjectName || !subjectEmail) {
    throw httpError(400, "external_reference, subject_name, and subject_email are required.");
  }

  const verificationToken = randomToken("verify_", 24);
  const verificationTokenHash = await sha256Hex(verificationToken);
  const sessionId = randomToken("verify_", 10);
  const ttlSeconds = Number(env.SESSION_TTL_SECONDS ?? 900);
  const expiresAt = isoPlusSeconds(Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 900);
  const now = nowIso();
  const ipAddress = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "unknown";

  const session = await insertRow(
    env,
    "verification_sessions",
    {
      id: sessionId,
      deployment_id: deployment.id,
      account_id: deployment.account_id,
      external_reference: externalReference,
      status: "created",
      subject_name: subjectName,
      subject_email: subjectEmail,
      subject_phone: typeof body.subject_phone === "string" ? body.subject_phone.trim() : "",
      purpose: typeof body.purpose === "string" ? body.purpose.trim() : "onboarding",
      requester_name: deployment.requester_name,
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
      geo_result: body.geo_result ?? null,
      score: 0,
      score_breakdown: {
        idLayoutConfidence: 0,
        ocrConfidence: 0,
        faceMatchScore: 0,
        electoralRegisterMatch: 0,
        ipGeolocationProximity: 0,
      },
      decision_reason: "Awaiting processing.",
      risk_flags: [],
      verification_token_hash: verificationTokenHash,
    },
    "*",
  );

  await insertRow(
    env,
    "audit_logs",
    {
      account_id: deployment.account_id,
      action: "Created verification session",
      entity_type: "verification_session",
      entity_id: session.id,
      metadata: {
        deployment_id: deployment.id,
        external_reference: externalReference,
      },
      ip_address: ipAddress,
      created_at: now,
    },
    "*",
  );

  const verificationUrl = new URL(`/verify/${session.id}`, baseUrlForRequest(env, request));
  verificationUrl.searchParams.set("token", verificationToken);

  return jsonResponse({
    id: session.id,
    status: session.status,
    verification_url: verificationUrl.toString(),
    expires_at: session.expires_at,
  });
}

async function createAccount(env, request) {
  const body = await readJson(request);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!name || !fullName || !email) {
    throw httpError(400, "name, full_name, and email are required.");
  }

  const result = await createAccountRecord(env, {
    name,
    fullName,
    email,
  });

  return jsonResponse(result, { status: 201 });
}

async function createDeployment(env, request) {
  const body = await readJson(request);
  const accountId = typeof body.account_id === "string" ? body.account_id.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const webhookUrl = typeof body.webhook_url === "string" ? body.webhook_url.trim() : "";
  const successRedirectUrl = typeof body.success_redirect_url === "string" ? body.success_redirect_url.trim() : "";
  const pendingRedirectUrl = typeof body.pending_redirect_url === "string" ? body.pending_redirect_url.trim() : "";
  const failureRedirectUrl = typeof body.failure_redirect_url === "string" ? body.failure_redirect_url.trim() : "";
  const requesterName = typeof body.requester_name === "string" ? body.requester_name.trim() : "";

  if (!accountId || !name || !webhookUrl || !successRedirectUrl || !pendingRedirectUrl || !failureRedirectUrl || !requesterName) {
    throw httpError(
      400,
      "account_id, name, webhook_url, success_redirect_url, pending_redirect_url, failure_redirect_url, and requester_name are required.",
    );
  }

  const result = await createDeploymentRecord(env, {
    accountId,
    name,
    description: typeof body.description === "string" ? body.description.trim() : "",
    webhookUrl,
    webhookSecret: typeof body.webhook_secret === "string" ? body.webhook_secret.trim() : undefined,
    successRedirectUrl,
    pendingRedirectUrl,
    failureRedirectUrl,
    allowedOrigins: normalizeList(body.allowed_origins),
    branding: body.branding && typeof body.branding === "object" ? body.branding : {},
    status: typeof body.status === "string" ? body.status.trim() : "active",
    testMode: body.test_mode !== false,
    requesterName,
  });

  return jsonResponse(result, { status: 201 });
}

async function rotateDeploymentKeys(env, request, deploymentId) {
  const deployment = await findDeploymentById(env, deploymentId);
  if (!deployment) {
    throw httpError(404, "Deployment not found.");
  }

  const newSecretKey = randomToken("dep_sec_", 24);
  const newSecretHash = await sha256Hex(newSecretKey);

  await updateRows(
    env,
    "deployments",
    { id: deployment.id },
    {
      secret_key_hash: newSecretHash,
      updated_at: nowIso(),
    },
    "*",
  );

  return jsonResponse({
    id: deployment.id,
    secret_key: newSecretKey,
  });
}

async function registerAsset(env, request, sessionId) {
  const session = await requireSessionAccess(env, request, sessionId);
  const body = await readJson(request);
  const assetType = typeof body.asset_type === "string" ? body.asset_type.trim() : "";
  const r2Key = typeof body.r2_key === "string" ? body.r2_key.trim() : "";
  if (!assetType || !r2Key) {
    throw httpError(400, "asset_type and r2_key are required.");
  }

  const asset = await insertRow(
    env,
    "verification_assets",
    {
      verification_session_id: session.id,
      asset_type: assetType,
      r2_bucket: env.R2_BUCKET || "open-verify",
      r2_key: r2Key,
      mime_type: typeof body.mime_type === "string" ? body.mime_type.trim() : "",
      size_bytes: Number.isFinite(Number(body.size_bytes)) ? Number(body.size_bytes) : null,
      checksum: typeof body.checksum === "string" ? body.checksum.trim() : "",
      source: typeof body.source === "string" ? body.source.trim() : "upload",
    },
    "*",
  );

  await updateRows(
    env,
    "verification_sessions",
    { id: session.id },
    {
      status: assetType === "selfie" ? "selfie_uploaded" : "id_uploaded",
      updated_at: nowIso(),
    },
    "*",
  );

  return jsonResponse(asset, { status: 201 });
}

async function processSession(env, request, sessionId) {
  const session = await requireSessionAccess(env, request, sessionId);
  const deployment = await findDeploymentById(env, session.deployment_id);
  if (!deployment) {
    throw httpError(404, "Deployment not found for session.");
  }

  const assets = await findAssetsBySessionId(env, session.id);
  const payload = {
    session,
    deployment,
    assets,
  };

  await updateRows(
    env,
    "verification_sessions",
    { id: session.id },
    {
      status: "processing",
      updated_at: nowIso(),
    },
    "*",
  );

  let analysis;
  try {
    analysis = await processVerification(env, payload);
  } catch (error) {
    const failedAt = nowIso();
    const detail = error instanceof Error ? error.message : String(error);

    await Promise.all([
      updateRows(
        env,
        "verification_sessions",
        { id: session.id },
        {
          status: "error",
          decision_reason: "Automatic verification failed.",
          completed_at: failedAt,
          updated_at: failedAt,
        },
        "*",
      ),
      insertRow(
        env,
        "audit_logs",
        {
          account_id: deployment.account_id,
          action: "Verification processing failed",
          entity_type: "verification_session",
          entity_id: session.id,
          metadata: {
            error: detail,
          },
          ip_address: session.ip_address,
          created_at: failedAt,
        },
        "*",
      ),
    ]);

    throw httpError(502, "Verification analysis failed.", detail);
  }
  const now = nowIso();

  await Promise.all([
    updateRows(
      env,
      "verification_sessions",
      { id: session.id },
      {
        status: analysis.status,
        score: analysis.score,
        score_breakdown: analysis.scoreBreakdown,
        decision_reason: analysis.decisionReason,
        risk_flags: analysis.riskFlags ?? [],
        geo_result: analysis.geoResult ?? session.geo_result ?? null,
        completed_at: now,
        updated_at: now,
      },
      "*",
    ),
    deleteRows(env, "verification_extracted_data", { verification_session_id: session.id }),
    deleteRows(env, "face_match_results", { verification_session_id: session.id }),
    deleteRows(env, "electoral_register_matches", { verification_session_id: session.id }),
  ]);

  const extractedDataRow = await insertRow(
    env,
    "verification_extracted_data",
    {
      verification_session_id: session.id,
      card_version: analysis.extractedData.cardVersion,
      full_name: analysis.extractedData.fullName,
      id_number: analysis.extractedData.idNumber,
      date_of_birth: analysis.extractedData.dateOfBirth,
      address_text: analysis.extractedData.addressText,
      ocr_confidence: analysis.extractedData.ocrConfidence,
      layout_confidence: analysis.extractedData.layoutConfidence,
      raw_ocr: analysis.extractedData.rawOcr ?? {},
    },
    "*",
  );

  const faceMatchRow = await insertRow(
    env,
    "face_match_results",
    {
      verification_session_id: session.id,
      match_score: analysis.faceMatch.matchScore,
      provider: analysis.faceMatch.provider,
      raw_result: analysis.faceMatch.rawResult ?? {},
    },
    "*",
  );

  const electoralMatchRow = await insertRow(
    env,
    "electoral_register_matches",
    {
      verification_session_id: session.id,
      matched: analysis.electoralMatch.matched,
      matched_record_id: analysis.electoralMatch.matchedRecordId ?? null,
      name_score: analysis.electoralMatch.nameScore,
      address_score: analysis.electoralMatch.addressScore,
      registered_address: analysis.electoralMatch.registeredAddress,
      registered_lat: analysis.electoralMatch.registeredLat,
      registered_lon: analysis.electoralMatch.registeredLon,
      distance_from_ip_km: analysis.electoralMatch.distanceFromIpKm,
      raw_match: analysis.electoralMatch.rawMatch ?? {},
    },
    "*",
  );

  const eventType =
    analysis.status === "verified"
      ? "verification.verified"
      : analysis.status === "needs_review"
        ? "verification.needs_review"
      : analysis.status === "rejected"
        ? "verification.rejected"
      : analysis.status === "resubmission_requested"
        ? "verification.resubmission_requested"
      : "verification.error";

  const webhookEvent = await insertRow(
    env,
    "webhook_events",
    {
      verification_session_id: session.id,
      deployment_id: deployment.id,
      event_type: eventType,
      payload: {
        event: eventType,
        created_at: now,
        data: {
          verification_session_id: session.id,
          deployment_id: deployment.id,
          external_reference: session.external_reference,
          status: analysis.status,
          score: analysis.score,
          decision_reason: analysis.decisionReason,
        },
      },
      status: "pending",
      attempt_count: 0,
    },
    "*",
  );

  await insertRow(
    env,
    "audit_logs",
    {
      account_id: deployment.account_id,
      action: "Completed automatic verification",
      entity_type: "verification_session",
      entity_id: session.id,
      metadata: {
        status: analysis.status,
        score: analysis.score,
      },
      ip_address: session.ip_address,
      created_at: now,
    },
    "*",
  );

  return jsonResponse(
    {
      session_id: session.id,
      status: analysis.status,
      score: analysis.score,
      decision_reason: analysis.decisionReason,
      score_breakdown: analysis.scoreBreakdown,
      risk_flags: analysis.riskFlags ?? [],
      extracted_data: extractedDataRow,
      face_match: faceMatchRow,
      electoral_match: electoralMatchRow,
      webhook_event: webhookEvent,
    },
    { status: 200 },
  );
}

async function getSession(env, request, sessionId) {
  await requireSessionAccess(env, request, sessionId);
  const aggregate = await loadSessionAggregate(env, sessionId);
  if (!aggregate) {
    throw httpError(404, "Verification session not found.");
  }
  return jsonResponse(aggregate);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return jsonResponse({
        ok: true,
        service: "openverify-api",
        supabaseConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
        processorConfigured: Boolean(env.PROCESSOR_URL),
        processingMode: env.PROCESSOR_URL ? "oracle-http" : "local",
        r2Bound: Boolean(env.ASSETS),
      });
    }

    if (request.method === "POST" && url.pathname === "/api/v1/accounts") {
      return createAccount(env, request);
    }

    if (request.method === "POST" && url.pathname === "/api/v1/deployments") {
      return createDeployment(env, request);
    }

    const deploymentRotateMatch = url.pathname.match(/^\/api\/v1\/deployments\/([^/]+)\/rotate-keys$/);
    if (request.method === "POST" && deploymentRotateMatch) {
      return rotateDeploymentKeys(env, request, deploymentRotateMatch[1]);
    }

    if (request.method === "POST" && url.pathname === "/api/v1/verification-sessions") {
      return createVerificationSession(env, request);
    }

    const sessionAssetsMatch = url.pathname.match(/^\/api\/v1\/verification-sessions\/([^/]+)\/assets$/);
    if (request.method === "POST" && sessionAssetsMatch) {
      return registerAsset(env, request, sessionAssetsMatch[1]);
    }

    const sessionProcessMatch = url.pathname.match(/^\/api\/v1\/verification-sessions\/([^/]+)\/process$/);
    if (request.method === "POST" && sessionProcessMatch) {
      return processSession(env, request, sessionProcessMatch[1]);
    }

    const sessionMatch = url.pathname.match(/^\/api\/v1\/verification-sessions\/([^/]+)$/);
    if (request.method === "GET" && sessionMatch) {
      return getSession(env, request, sessionMatch[1]);
    }

    return httpError(404, "Not found.");
  },
};
