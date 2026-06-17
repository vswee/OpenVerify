import { clamp, selectText, seedScore } from "./lib/seed.mjs";
import { analyzeElectoralMatch } from "./providers/electoral.mjs";
import { analyzeFaceMatch } from "./providers/face.mjs";
import { analyzeOcr } from "./providers/ocr.mjs";

function getAssets(input) {
  const assets = input?.assets;
  if (Array.isArray(assets)) {
    return assets;
  }
  if (assets && typeof assets === "object") {
    return Object.entries(assets).map(([assetType, value]) => ({
      assetType,
      ...(value && typeof value === "object" ? value : {}),
    }));
  }
  return [];
}

function assetByType(input, assetType) {
  const assets = getAssets(input);
  return assets.find((asset) => asset?.assetType === assetType || asset?.asset_type === assetType) ?? null;
}

function deriveGeoResult(input, seedSource) {
  const geoResult = input?.session?.geo_result ?? input?.session?.geoResult ?? input?.geo_result ?? input?.geoResult ?? null;
  if (geoResult) {
    return geoResult;
  }

  const geoPoints = [
    { city: "Port of Spain", region: "Port of Spain", country: "TT", latitude: 10.6667, longitude: -61.5167 },
    { city: "San Fernando", region: "Victoria", country: "TT", latitude: 10.2796, longitude: -61.459 },
    { city: "Chaguanas", region: "Chaguanas", country: "TT", latitude: 10.5167, longitude: -61.4167 },
  ];

  return geoPoints[seedScore(seedSource, 14, geoPoints.length)];
}

function buildStatus(score, hasAssets) {
  if (!hasAssets.idFront || !hasAssets.selfie) {
    return "resubmission_requested";
  }
  if (score >= 85) {
    return "verified";
  }
  if (score >= 60) {
    return "needs_review";
  }
  return "rejected";
}

export function buildAnalysis(input) {
  const session = input?.session ?? {};
  const subject = input?.subject ?? {};
  const seedSource = JSON.stringify({
    sessionId: session.id ?? input?.session_id ?? input?.sessionId ?? null,
    externalReference: session.external_reference ?? input?.external_reference ?? input?.externalReference ?? null,
    subjectName: selectText(subject.full_name ?? subject.fullName ?? input?.subject_name ?? input?.subjectName, "Pending"),
    idFrontName: assetByType(input, "id_front")?.name ?? null,
    selfieName: assetByType(input, "selfie")?.name ?? null,
  });

  const extractedData = analyzeOcr(input);
  const faceMatch = analyzeFaceMatch(input, extractedData);
  const electoralMatch = analyzeElectoralMatch(input, extractedData);
  const geoResult = deriveGeoResult(input, seedSource);

  const scoreBreakdown = {
    idLayoutConfidence: extractedData.layoutConfidence,
    ocrConfidence: extractedData.ocrConfidence,
    faceMatchScore: faceMatch.matchScore,
    electoralRegisterMatch: Math.round((electoralMatch.nameScore + electoralMatch.addressScore) / 2),
    ipGeolocationProximity: clamp(
      52 + seedScore(seedSource, 10, 22) + (geoResult?.country === "TT" ? 6 : 0),
      0,
      100,
    ),
  };

  const score = Math.round(
    scoreBreakdown.idLayoutConfidence * 0.2 +
      scoreBreakdown.ocrConfidence * 0.15 +
      scoreBreakdown.faceMatchScore * 0.3 +
      scoreBreakdown.electoralRegisterMatch * 0.25 +
      scoreBreakdown.ipGeolocationProximity * 0.1,
  );

  const hasAssets = {
    idFront: Boolean(assetByType(input, "id_front")),
    selfie: Boolean(assetByType(input, "selfie")),
  };
  const status = buildStatus(score, hasAssets);
  const riskFlags = new Set(Array.isArray(session.risk_flags) ? session.risk_flags : []);

  if (!hasAssets.idFront) {
    riskFlags.add("missing-id-front");
  }
  if (!hasAssets.selfie) {
    riskFlags.add("missing-selfie");
  }
  if (extractedData.ocrConfidence < 65) {
    riskFlags.add("low-ocr-confidence");
  }
  if (faceMatch.matchScore < 65) {
    riskFlags.add("low-face-match");
  }
  if (scoreBreakdown.electoralRegisterMatch < 65) {
    riskFlags.add("weak-register-match");
  }
  if (scoreBreakdown.ipGeolocationProximity < 60) {
    riskFlags.add("geo-mismatch");
  }
  if (hasAssets.idFront && hasAssets.selfie) {
    riskFlags.add("reviewable-seed");
  }

  const decisionReason =
    status === "verified"
      ? "Automatic verification passed with strong document, face, and register signals."
      : status === "needs_review"
        ? "Automatic verification paused because the score was not high enough for approval."
        : status === "rejected"
          ? "The automatic score fell below the rejection threshold."
          : "The capture set is incomplete and needs to be submitted again.";

  return {
    provider: "openverify-node",
    status,
    score,
    decisionReason,
    scoreBreakdown,
    riskFlags: Array.from(riskFlags),
    extractedData: {
      ...extractedData,
      rawOcr: extractedData.rawOcr ?? {},
    },
    faceMatch,
    electoralMatch,
    geoResult,
  };
}

