import { clamp, seedScore, selectText } from "../lib/seed.mjs";

const GEO_POINTS = [
  { city: "Port of Spain", region: "Port of Spain", country: "TT", latitude: 10.6667, longitude: -61.5167 },
  { city: "San Fernando", region: "Victoria", country: "TT", latitude: 10.2796, longitude: -61.459 },
  { city: "Chaguanas", region: "Chaguanas", country: "TT", latitude: 10.5167, longitude: -61.4167 },
];

function defaultGeoResult(seed) {
  return GEO_POINTS[seedScore(seed, 8, GEO_POINTS.length)];
}

function getGeoResult(input) {
  return input?.session?.geo_result ?? input?.session?.geoResult ?? input?.geo_result ?? input?.geoResult ?? null;
}

export function analyzeElectoralMatch(input, extractedData) {
  const subject = input?.subject ?? {};
  const subjectName = selectText(subject.full_name ?? subject.fullName ?? extractedData?.fullName ?? input?.subject_name ?? input?.subjectName, "Pending");
  const addressText = selectText(extractedData?.addressText ?? subject.address_text ?? subject.addressText ?? input?.address_text ?? input?.addressText, "Pending");
  const geoResult = getGeoResult(input);
  const seed = JSON.stringify({
    sessionId: input?.session_id ?? input?.sessionId ?? null,
    externalReference: input?.external_reference ?? input?.externalReference ?? null,
    subjectName,
    addressText,
    geoResult,
    ipAddress: input?.session?.ip_address ?? input?.session?.ipAddress ?? input?.ip_address ?? input?.ipAddress ?? null,
  });

  const nameScoreBase = seedScore(seed, 0, 23);
  const addressScoreBase = seedScore(seed, 2, 21);
  const geoScoreBase = seedScore(seed, 4, 19);
  const highConfidenceBoost = subjectName !== "Pending" && addressText !== "Pending" ? 10 : 0;

  const nameScore = clamp(55 + nameScoreBase + highConfidenceBoost, 0, 100);
  const addressScore = clamp(51 + addressScoreBase + highConfidenceBoost, 0, 100);
  const proximity = clamp(48 + geoScoreBase + (geoResult ? 6 : 0), 0, 100);
  const matched = nameScore >= 78 && addressScore >= 74 && proximity >= 68;
  const registeredGeo = geoResult ?? defaultGeoResult(seed);

  return {
    matched,
    matchedRecordId: matched ? `reg_${String(seedScore(seed, 6, 9000)).padStart(4, "0")}` : null,
    nameScore,
    addressScore,
    registeredAddress: matched ? addressText : "No match",
    registeredLat: matched ? registeredGeo.latitude : 0,
    registeredLon: matched ? registeredGeo.longitude : 0,
    distanceFromIpKm: matched ? Number((seedScore(seed, 10, 55) / 10).toFixed(1)) : 0,
    rawMatch: {
      seed,
      geoResult: registeredGeo,
      subjectName,
      addressText,
      recordConfidence: matched ? "high" : "low",
      matchedRecordId: matched ? `reg_${String(seedScore(seed, 6, 9000)).padStart(4, "0")}` : null,
    },
  };
}

