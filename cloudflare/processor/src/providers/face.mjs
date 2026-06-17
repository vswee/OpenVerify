import { clamp, dataUrlToText, extractSvgTextNodes, parseDataUrl, seedScore, selectText } from "../lib/seed.mjs";

function getAsset(input, assetType) {
  const assets = input?.assets;
  if (Array.isArray(assets)) {
    return assets.find((asset) => asset?.asset_type === assetType || asset?.assetType === assetType) ?? null;
  }
  if (assets && typeof assets === "object") {
    return assets[assetType] ?? assets[assetType.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())] ?? null;
  }
  return null;
}

function getPreviewDataUrl(asset) {
  if (!asset || typeof asset !== "object") {
    return null;
  }
  return asset.previewDataUrl ?? asset.preview_data_url ?? asset.dataUrl ?? asset.data_url ?? null;
}

function detectInitials(svgText, subjectInitials) {
  const textNodes = extractSvgTextNodes(svgText);
  const candidate = textNodes.find((node) => /^[A-Z]{1,4}$/.test(node.replace(/[^A-Z]/g, "")));
  if (!candidate) {
    return {
      textNodes,
      detectedInitials: null,
      initialsMatch: false,
    };
  }

  const detectedInitials = candidate.replace(/[^A-Z]/g, "");
  return {
    textNodes,
    detectedInitials,
    initialsMatch: Boolean(subjectInitials && detectedInitials === subjectInitials),
  };
}

function initialsForName(fullName) {
  return fullName
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function analyzeFaceMatch(input, extractedData) {
  const subject = input?.subject ?? {};
  const asset = getAsset(input, "selfie") ?? getAsset(input, "selfieImage") ?? null;
  const previewDataUrl = getPreviewDataUrl(asset);
  const parsedDataUrl = parseDataUrl(previewDataUrl);
  const inlineText = dataUrlToText(previewDataUrl);
  const svgText = parsedDataUrl?.mimeType?.includes("svg") || inlineText?.includes("<svg") ? inlineText : null;
  const subjectName = selectText(subject.full_name ?? subject.fullName ?? extractedData?.fullName ?? input?.subject_name ?? input?.subjectName, "Pending");
  const subjectInitials = initialsForName(subjectName);
  const initials = svgText ? detectInitials(svgText, subjectInitials) : { textNodes: [], detectedInitials: null, initialsMatch: false };
  const seed = JSON.stringify({
    sessionId: input?.session_id ?? input?.sessionId ?? null,
    externalReference: input?.external_reference ?? input?.externalReference ?? null,
    subjectName,
    assetName: asset?.name ?? null,
    assetType: asset?.asset_type ?? asset?.assetType ?? null,
    previewSample: typeof previewDataUrl === "string" ? previewDataUrl.slice(0, 96) : null,
    detectedInitials: initials.detectedInitials,
  });

  const qualityHint = typeof asset?.quality === "string" ? asset.quality : typeof asset?.quality_hint === "string" ? asset.quality_hint : null;
  const qualityBoost = qualityHint === "clean" ? 8 : qualityHint === "borderline" ? 0 : -6;
  const matchScore = clamp(
    (svgText ? 82 : 64) + seedScore(seed, 4, 18) + (initials.initialsMatch ? 8 : -6) + qualityBoost,
    0,
    100,
  );

  return {
    matchScore,
    provider: "openverify-node-face",
    rawResult: {
      assetName: asset?.name ?? null,
      mimeType: parsedDataUrl?.mimeType ?? asset?.mime_type ?? asset?.mimeType ?? null,
      subjectInitials,
      detectedInitials: initials.detectedInitials,
      initialsMatch: initials.initialsMatch,
      svgTextPreview: svgText ? svgText.slice(0, 160) : null,
      seed,
      textNodes: initials.textNodes.slice(0, 12),
    },
  };
}
