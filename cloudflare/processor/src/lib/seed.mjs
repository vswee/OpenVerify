import { createHash } from "node:crypto";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function seedDigest(seed) {
  return createHash("sha256").update(seed).digest();
}

export function seedScore(seed, offset, span) {
  const digest = seedDigest(seed);
  const sliceOffset = offset % (digest.length - 2);
  const raw = digest.readUInt16BE(sliceOffset);
  return raw % span;
}

export function selectText(value, fallback) {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }
  return value.trim();
}

export function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

export function decodeXmlEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'");
}

export function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return null;
  }

  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    return null;
  }

  const header = dataUrl.slice(5, commaIndex);
  const body = dataUrl.slice(commaIndex + 1);
  const mimeType = header.split(";")[0] || "text/plain";
  const isBase64 = header.includes(";base64");
  const buffer = isBase64 ? Buffer.from(body, "base64") : Buffer.from(decodeURIComponent(body), "utf8");

  return { mimeType, buffer };
}

export function dataUrlToText(dataUrl) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return null;
  }

  const text = parsed.buffer.toString("utf8");
  return text.trim() ? text : null;
}

export function extractSvgTextNodes(svgText) {
  if (typeof svgText !== "string" || !svgText.trim()) {
    return [];
  }

  const nodes = [];
  const pattern = /<text\b[^>]*>([\s\S]*?)<\/text>/gi;
  let match;
  while ((match = pattern.exec(svgText)) !== null) {
    const text = normalizeWhitespace(decodeXmlEntities(match[1].replace(/<[^>]+>/g, " ")));
    if (text) {
      nodes.push(text);
    }
  }
  return nodes;
}

export function textAfterLabel(textNodes, label, fallback) {
  const normalizedLabel = label.toUpperCase();
  const index = textNodes.findIndex((node) => node.toUpperCase() === normalizedLabel);
  if (index === -1 || index + 1 >= textNodes.length) {
    return fallback;
  }
  return selectText(textNodes[index + 1], fallback);
}

