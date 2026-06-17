import {
  clamp,
  dataUrlToText,
  extractSvgTextNodes,
  parseDataUrl,
  seedScore,
  selectText,
  textAfterLabel,
} from "../lib/seed.mjs";

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

function parseSvgExtractedFields(svgText) {
  const textNodes = extractSvgTextNodes(svgText);
  if (!textNodes.length) {
    return null;
  }

  const upperNodes = textNodes.map((node) => node.toUpperCase());
  const hasTitle = upperNodes.some((node) => node.includes("NATIONAL IDENTIFICATION CARD"));
  const hasRepublic = upperNodes.some((node) => node.includes("REPUBLIC OF TRINIDAD AND TOBAGO"));

  const fallback = "Pending";
  return {
    cardVersion: hasTitle ? "Current TT EBC layout" : hasRepublic ? "Previous TT EBC layout" : fallback,
    fullName: textAfterLabel(textNodes, "NAME", fallback),
    idNumber: textAfterLabel(textNodes, "ID NUMBER", fallback),
    dateOfBirth: textAfterLabel(textNodes, "DATE OF BIRTH", fallback),
    addressText: textAfterLabel(textNodes, "ADDRESS", fallback),
    textNodes,
  };
}

export function analyzeOcr(input) {
  const subject = input?.subject ?? {};
  const asset = getAsset(input, "id_front") ?? getAsset(input, "idFront") ?? null;
  const previewDataUrl = getPreviewDataUrl(asset);
  const parsedDataUrl = parseDataUrl(previewDataUrl);
  const inlineText = dataUrlToText(previewDataUrl);
  const svgText = parsedDataUrl?.mimeType?.includes("svg") || inlineText?.includes("<svg") ? inlineText : null;
  const parsedFields = svgText ? parseSvgExtractedFields(svgText) : null;

  const subjectName = selectText(subject.full_name ?? subject.fullName ?? input?.subject_name ?? input?.subjectName, "Pending");
  const fallbackSeed = JSON.stringify({
    sessionId: input?.session_id ?? input?.sessionId ?? null,
    externalReference: input?.external_reference ?? input?.externalReference ?? null,
    subjectName,
    assetName: asset?.name ?? null,
    assetType: asset?.asset_type ?? asset?.assetType ?? null,
    previewSample: typeof previewDataUrl === "string" ? previewDataUrl.slice(0, 96) : null,
  });

  const layoutConfidence = clamp(
    (svgText ? 84 : 68) + seedScore(fallbackSeed, 0, 13) + (parsedFields ? 5 : 0),
    0,
    100,
  );
  const ocrConfidence = clamp(
    (svgText ? 80 : 64) + seedScore(fallbackSeed, 2, 15) + (parsedFields ? 8 : 0),
    0,
    100,
  );

  const fullName = selectText(parsedFields?.fullName ?? subjectName, subjectName);
  const idNumber = selectText(parsedFields?.idNumber ?? subject.id_number ?? subject.idNumber ?? input?.id_number ?? input?.idNumber, "Pending");
  const dateOfBirth = selectText(parsedFields?.dateOfBirth ?? subject.date_of_birth ?? subject.dateOfBirth ?? input?.date_of_birth ?? input?.dateOfBirth, "Pending");
  const addressText = selectText(parsedFields?.addressText ?? subject.address_text ?? subject.addressText ?? input?.address_text ?? input?.addressText, "Pending");

  return {
    cardVersion: parsedFields?.cardVersion ?? "Pending",
    fullName,
    idNumber,
    dateOfBirth,
    addressText,
    ocrConfidence,
    layoutConfidence,
    rawOcr: {
      source: asset?.source ?? null,
      assetName: asset?.name ?? null,
      mimeType: parsedDataUrl?.mimeType ?? asset?.mime_type ?? asset?.mimeType ?? null,
      svgTextPreview: svgText ? svgText.slice(0, 200) : null,
      parsedFields: parsedFields
        ? {
            cardVersion: parsedFields.cardVersion,
            fullName: parsedFields.fullName,
            idNumber: parsedFields.idNumber,
            dateOfBirth: parsedFields.dateOfBirth,
            addressText: parsedFields.addressText,
            textNodes: parsedFields.textNodes.slice(0, 16),
          }
        : null,
      fallbackSeed,
    },
  };
}
