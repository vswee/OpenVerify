import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { buildAnalysis } from "./src/analyze.mjs";

const PORT = Number(process.env.PORT ?? 10000);
const PROCESSOR_TOKEN = typeof process.env.PROCESSOR_TOKEN === "string" ? process.env.PROCESSOR_TOKEN.trim() : "";

function json(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function isAuthorized(request) {
  if (!PROCESSOR_TOKEN) {
    return false;
  }

  const header = request.headers.authorization || request.headers.Authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return false;
  }

  const provided = Buffer.from(match[1].trim());
  const expected = Buffer.from(PROCESSOR_TOKEN);
  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");

  if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health" || url.pathname === "/api/v1/processing/health")) {
    json(response, 200, {
      ok: true,
      service: "openverify-processing",
      runtime: "node",
      provider: "openverify-node",
      port: PORT,
      mode: "docker",
      authRequired: Boolean(PROCESSOR_TOKEN),
    });
    return;
  }

  if (request.method !== "POST") {
    json(response, 405, { error: "Method not allowed" });
    return;
  }

  if (
    url.pathname !== "/analyze" &&
    url.pathname !== "/ocr" &&
    url.pathname !== "/face-match" &&
    url.pathname !== "/api/v1/processing/analyze" &&
    url.pathname !== "/api/v1/processing/ocr" &&
    url.pathname !== "/api/v1/processing/face-match"
  ) {
    json(response, 404, { error: "Not found" });
    return;
  }

  if (!isAuthorized(request)) {
    json(response, 401, { error: "Unauthorized" });
    return;
  }

  try {
    const payload = await readJson(request);
    const analysis = buildAnalysis(payload);

    if (url.pathname.endsWith("/ocr")) {
      json(response, 200, {
        provider: analysis.provider,
        extractedData: analysis.extractedData,
      });
      return;
    }

    if (url.pathname.endsWith("/face-match")) {
      json(response, 200, {
        provider: analysis.provider,
        faceMatch: analysis.faceMatch,
      });
      return;
    }

    json(response, 200, analysis);
  } catch (error) {
    json(response, 400, {
      error: "Invalid JSON payload",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`OpenVerify processing service listening on port ${PORT}`);
});
