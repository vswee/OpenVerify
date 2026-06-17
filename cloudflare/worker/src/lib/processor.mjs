import { buildAnalysis } from "../../../processor/src/analyze.mjs";
import { getBearerToken, httpError } from "./http.mjs";

function normalizeProcessorUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function callRemoteProcessor(env, payload) {
  const processorUrl = normalizeProcessorUrl(env.PROCESSOR_URL);
  if (!processorUrl) {
    return buildAnalysis(payload);
  }

  const processorToken = normalizeProcessorUrl(env.PROCESSOR_TOKEN);
  if (!processorToken) {
    throw httpError(503, "Processor token is not configured.");
  }

  const url = new URL("/analyze", processorUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${processorToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw httpError(502, "Processor analysis failed.", body);
    }

    return response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw httpError(504, "Processor analysis timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function processVerification(env, payload) {
  return callRemoteProcessor(env, payload);
}

export function requireDeploymentSecret(request) {
  const token = getBearerToken(request);
  if (!token) {
    throw httpError(401, "Missing deployment secret.");
  }
  return token;
}
