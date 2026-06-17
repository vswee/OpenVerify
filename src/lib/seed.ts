import { makeSampleIdCardSvg, makeSampleSelfieSvg } from "./sample-art";
import type {
  Account,
  AuditLog,
  Deployment,
  Profile,
  VerificationAsset,
  VerificationSession,
  WorkspaceState,
} from "./types";
import { isoAgo, isoDaysAgo, makeId, makeUuid, slugify } from "./utils";

const accountId = makeUuid();
const profileId = makeUuid();
const deploymentOneId = makeUuid();
const deploymentTwoId = makeUuid();

function buildAsset(
  assetType: VerificationAsset["assetType"],
  name: string,
  mimeType: string,
  width: number,
  height: number,
  source: VerificationAsset["source"],
  quality: VerificationAsset["quality"],
  previewDataUrl: string,
): VerificationAsset {
  return {
    id: makeUuid(),
    assetType,
    name,
    mimeType,
    sizeBytes: Math.round((width * height) / 12),
    width,
    height,
    previewDataUrl,
    createdAt: isoAgo(15),
    source,
    quality,
  };
}

function timeline(
  entries: Array<{ label: string; detail: string; tone: "neutral" | "success" | "warning" | "danger"; minutesAgo: number }>,
) {
  return entries.map((entry) => ({
    id: makeUuid(),
    label: entry.label,
    detail: entry.detail,
    tone: entry.tone,
    createdAt: isoAgo(entry.minutesAgo),
  }));
}

function initialsForName(fullName: string) {
  return fullName
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function sampleEmailForName(fullName: string) {
  const parts = fullName
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .split(/[\s-]+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return "sample.user@example.com";
  }
  return `${parts[0]}.${parts[parts.length - 1]}@example.com`;
}

function buildIdCardPreview(fullName: string) {
  return makeSampleIdCardSvg({
    fullName,
    idNumber: "123456789",
    dateOfBirth: "18 Apr 1992",
    addressText: "10 Rust Street, San Fernando",
  });
}

function buildSelfiePreview(fullName: string) {
  return makeSampleSelfieSvg({ initials: initialsForName(fullName), accent: "#0f7e82" });
}

const accounts: Account[] = [
  {
    id: accountId,
    name: "Pro Services Ltd",
    slug: slugify("Pro Services Ltd"),
    status: "active",
    createdAt: isoDaysAgo(12),
    updatedAt: isoDaysAgo(1),
  },
];

const profiles: Profile[] = [
  {
    id: profileId,
    accountId,
    fullName: "Alex Morgan",
    email: "alex.morgan@example.com",
    role: "super_admin",
    createdAt: isoDaysAgo(12),
    updatedAt: isoDaysAgo(1),
  },
];

const deployments: Deployment[] = [
  {
    id: deploymentOneId,
    accountId,
    name: "Driver Verification",
    description: "KYC flow for high-trust account creation and loan eligibility checks.",
    publicKey: "dep_public_7v4n2p",
    secretKeyHash: "hash_5c2d9f6b2e7a1f4a",
    webhookUrl: "https://example.com/webhooks/openverify",
    webhookSecret: "whsec_8a2d7d3f9c11",
    successRedirectUrl: "https://example.com/onboarding/verified",
    pendingRedirectUrl: "https://example.com/onboarding/pending",
    failureRedirectUrl: "https://example.com/onboarding/failed",
    allowedOrigins: ["https://example.com", "https://app.example.com"],
    branding: {
      accentColor: "#0f7e82",
      logoMark: "shield",
      surfaceTint: "#eff6f7",
      heroBackground: "#ffffff",
    },
    status: "active",
    testMode: true,
    createdAt: isoDaysAgo(9),
    updatedAt: isoAgo(38),
    lastUsedAt: isoAgo(21),
    requesterName: "Pro Services Ltd",
  },
  {
    id: deploymentTwoId,
    accountId,
    name: "Customer Onboarding",
    description: "Hosted verification for member onboarding and branch appointment requests.",
    publicKey: "dep_public_m4s2d1",
    secretKeyHash: "hash_7b9d1ec4a5f03b9e",
    webhookUrl: "https://example.com/webhooks/customer-onboarding",
    webhookSecret: "whsec_17ff29d2b21",
    successRedirectUrl: "https://example.com/app/verified",
    pendingRedirectUrl: "https://example.com/app/review",
    failureRedirectUrl: "https://example.com/app/failed",
    allowedOrigins: ["https://example.com"],
    branding: {
      accentColor: "#0f7e82",
      logoMark: "shield",
      surfaceTint: "#eef4f6",
      heroBackground: "#ffffff",
    },
    status: "active",
    testMode: true,
    createdAt: isoDaysAgo(7),
    updatedAt: isoAgo(110),
    lastUsedAt: isoAgo(61),
    requesterName: "Pro Services Ltd",
  },
];

function sessionTemplate(overrides: Partial<VerificationSession>): VerificationSession {
  const deployment = deployments.find((item) => item.id === overrides.deploymentId) ?? deployments[0];
  const subjectName = overrides.subjectName ?? "Jordan Lee";
  const extractedFullName = overrides.extractedData?.fullName ?? subjectName;
  const subjectEmail = overrides.subjectEmail ?? sampleEmailForName(subjectName);
  const extractedIdNumber = overrides.extractedData?.idNumber ?? "123456789";
  const extractedDateOfBirth = overrides.extractedData?.dateOfBirth ?? "1992-04-18";
  const extractedAddressText = overrides.extractedData?.addressText ?? "10 Rust Street, San Fernando";
  const previewIdCard = buildIdCardPreview(extractedFullName);
  const previewSelfie = buildSelfiePreview(extractedFullName);
  const base: VerificationSession = {
    id: makeId("verify", 6),
    deploymentId: deployment.id,
    accountId,
    externalReference: "ref-1001",
    status: "created",
    subjectName,
    subjectEmail,
    subjectPhone: "+1 (868) 555-0146",
    purpose: "onboarding",
    requesterName: deployment.requesterName,
    consentedAt: isoAgo(36),
    startedAt: isoAgo(35),
    completedAt: undefined,
    expiresAt: isoAgo(-240),
    ipAddress: "190.186.12.44",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    geoResult: {
      city: "Port of Spain",
      region: "Port of Spain",
      country: "TT",
      latitude: 10.6667,
      longitude: -61.5167,
    },
    score: 68,
    scoreBreakdown: {
      idLayoutConfidence: 72,
      ocrConfidence: 66,
      faceMatchScore: 64,
      electoralRegisterMatch: 56,
      ipGeolocationProximity: 56,
    },
    decisionReason:
      "Automatic verification paused because the face match and electoral register confidence were not strong enough for approval.",
    riskFlags: ["borderline-lighting", "manual-review-recommended"],
    assets: {
      id_front: buildAsset(
        "id_front",
        "tt-id-front-sample.svg",
        "image/svg+xml",
        1200,
        760,
        "sample",
        "borderline",
        previewIdCard,
      ),
      selfie: buildAsset("selfie", "selfie-sample.svg", "image/svg+xml", 1200, 1200, "sample", "clean", previewSelfie),
    },
    extractedData: {
      cardVersion: "Current TT EBC layout",
      fullName: extractedFullName,
      idNumber: extractedIdNumber,
      dateOfBirth: extractedDateOfBirth,
      addressText: extractedAddressText,
      ocrConfidence: 66,
      layoutConfidence: 72,
    },
    electoralMatch: {
      matched: false,
      matchedRecordId: undefined,
      nameScore: 54,
      addressScore: 46,
      registeredAddress: "10 Rust Street, San Fernando",
      registeredLat: 10.2713,
      registeredLon: -61.371,
      distanceFromIpKm: 8.4,
    },
    faceMatch: {
      matchScore: 64,
      provider: "OpenVerify Face Compare",
    },
    manualReviews: [],
    webhookEvents: [
      {
        id: makeUuid(),
        eventType: "verification.created",
        status: "sent",
        attemptCount: 1,
        createdAt: isoAgo(35),
        lastAttemptAt: isoAgo(34),
        lastResponseStatus: 204,
      },
      {
        id: makeUuid(),
        eventType: "verification.started",
        status: "sent",
        attemptCount: 1,
        createdAt: isoAgo(34),
        lastAttemptAt: isoAgo(33),
        lastResponseStatus: 204,
      },
      {
        id: makeUuid(),
        eventType: "verification.needs_review",
        status: "pending",
        attemptCount: 0,
        createdAt: isoAgo(22),
      },
    ],
    timeline: timeline([
      { label: "Session created", detail: "Business initiated a verification request.", tone: "neutral", minutesAgo: 35 },
      { label: "Started", detail: "User opened the hosted verification flow.", tone: "neutral", minutesAgo: 34 },
      { label: "Consent recorded", detail: "End user accepted the processing notice.", tone: "success", minutesAgo: 33 },
      { label: "ID uploaded", detail: "Front of the Trinidad and Tobago ID card was captured.", tone: "success", minutesAgo: 24 },
      { label: "Selfie uploaded", detail: "Selfie capture completed with acceptable visibility.", tone: "success", minutesAgo: 23 },
      { label: "Processing", detail: "Automatic checks ran against the scoring model.", tone: "warning", minutesAgo: 22 },
      { label: "Needs review", detail: "The score did not clear the automatic approval threshold.", tone: "warning", minutesAgo: 22 },
    ]),
    redirectSuccessUrl: deployment.successRedirectUrl,
    redirectPendingUrl: deployment.pendingRedirectUrl,
    redirectFailureUrl: deployment.failureRedirectUrl,
    createdAt: isoAgo(36),
    updatedAt: isoAgo(22),
    ...overrides,
  };

  return base;
}

const sessions: VerificationSession[] = [
  sessionTemplate({
    id: "OV-845922",
    status: "selfie_uploaded",
    externalReference: "ref-1002",
    subjectName: "Jordan Lee",
    score: 0,
    scoreBreakdown: {
      idLayoutConfidence: 0,
      ocrConfidence: 0,
      faceMatchScore: 0,
      electoralRegisterMatch: 0,
      ipGeolocationProximity: 0,
    },
    decisionReason: "Awaiting processing.",
    riskFlags: [],
    webhookEvents: [],
    timeline: timeline([
      { label: "Session created", detail: "Business initiated a verification request.", tone: "neutral", minutesAgo: 15 },
      { label: "Started", detail: "User opened the hosted verification flow.", tone: "neutral", minutesAgo: 14 },
      { label: "Consent recorded", detail: "End user accepted the processing notice.", tone: "success", minutesAgo: 13 },
      { label: "ID uploaded", detail: "Front of the Trinidad and Tobago ID card was captured.", tone: "success", minutesAgo: 12 },
      { label: "Selfie uploaded", detail: "Selfie capture completed and is waiting for processing.", tone: "success", minutesAgo: 11 },
    ]),
    createdAt: isoAgo(15),
    updatedAt: isoAgo(11),
  }),
  sessionTemplate({ id: "OV-845921", status: "needs_review", externalReference: "ref-1003", subjectName: "Avery Collins" }),
  sessionTemplate({
    id: "OV-845920",
    status: "verified",
    externalReference: "ref-1004",
    subjectName: "Taylor Reed",
    score: 92,
    scoreBreakdown: {
      idLayoutConfidence: 94,
      ocrConfidence: 88,
      faceMatchScore: 91,
      electoralRegisterMatch: 87,
      ipGeolocationProximity: 81,
    },
    decisionReason: "Automatic verification passed with strong document, face, and register signals.",
    riskFlags: [],
    electoralMatch: {
      matched: true,
      matchedRecordId: "reg_0091",
      nameScore: 93,
      addressScore: 85,
      registeredAddress: "15 Queen's Park West, Port of Spain",
      registeredLat: 10.6636,
      registeredLon: -61.5185,
      distanceFromIpKm: 2.1,
    },
    faceMatch: { matchScore: 91, provider: "OpenVerify Face Compare" },
    extractedData: {
      cardVersion: "Current TT EBC layout",
      fullName: "Taylor Reed",
      idNumber: "987654321",
      dateOfBirth: "1988-09-12",
      addressText: "15 Queen's Park West, Port of Spain",
      ocrConfidence: 88,
      layoutConfidence: 94,
    },
    timeline: timeline([
      { label: "Session created", detail: "Business initiated a verification request.", tone: "neutral", minutesAgo: 90 },
      { label: "Started", detail: "User opened the hosted verification flow.", tone: "neutral", minutesAgo: 88 },
      { label: "Approved", detail: "Automatic checks cleared the approval threshold.", tone: "success", minutesAgo: 82 },
    ]),
    webhookEvents: [
      {
        id: makeUuid(),
        eventType: "verification.verified",
        status: "sent",
        attemptCount: 1,
        createdAt: isoAgo(82),
        lastAttemptAt: isoAgo(81),
        lastResponseStatus: 204,
      },
    ],
    manualReviews: [],
    createdAt: isoAgo(90),
    updatedAt: isoAgo(82),
    completedAt: isoAgo(82),
  }),
  sessionTemplate({
    id: "OV-845919",
    status: "rejected",
    externalReference: "ref-1005",
    subjectName: "Casey Morgan",
    score: 31,
    decisionReason: "The ID image was too blurry and the card layout could not be validated.",
    riskFlags: ["blurred-id", "layout-mismatch"],
    faceMatch: { matchScore: 24, provider: "OpenVerify Face Compare" },
    extractedData: {
      cardVersion: "Unknown",
      fullName: "Unavailable",
      idNumber: "Unavailable",
      dateOfBirth: "Unavailable",
      addressText: "Unavailable",
      ocrConfidence: 19,
      layoutConfidence: 22,
    },
    electoralMatch: {
      matched: false,
      nameScore: 17,
      addressScore: 11,
      registeredAddress: "No match",
      registeredLat: 0,
      registeredLon: 0,
      distanceFromIpKm: 0,
    },
    scoreBreakdown: {
      idLayoutConfidence: 22,
      ocrConfidence: 19,
      faceMatchScore: 24,
      electoralRegisterMatch: 11,
      ipGeolocationProximity: 15,
    },
    timeline: timeline([
      { label: "Session created", detail: "Business initiated a verification request.", tone: "neutral", minutesAgo: 180 },
      { label: "Started", detail: "User opened the hosted verification flow.", tone: "neutral", minutesAgo: 178 },
      { label: "Rejected", detail: "Quality signals were insufficient for a safe verification decision.", tone: "danger", minutesAgo: 172 },
    ]),
    webhookEvents: [
      {
        id: makeUuid(),
        eventType: "verification.rejected",
        status: "failed",
        attemptCount: 2,
        createdAt: isoAgo(172),
        lastAttemptAt: isoAgo(171),
        lastResponseStatus: 500,
        lastResponseBody: "Temporary endpoint outage",
      },
    ],
    manualReviews: [],
    createdAt: isoAgo(180),
    updatedAt: isoAgo(172),
    completedAt: isoAgo(172),
  }),
  sessionTemplate({
    id: "OV-845918",
    status: "resubmission_requested",
    externalReference: "ref-1006",
    subjectName: "Morgan Ellis",
    score: 54,
    decisionReason: "Lighting was inconsistent and the selfie needed to be re-captured.",
    riskFlags: ["poor-lighting", "selfie-obstruction"],
    faceMatch: { matchScore: 58, provider: "OpenVerify Face Compare" },
    scoreBreakdown: {
      idLayoutConfidence: 61,
      ocrConfidence: 58,
      faceMatchScore: 58,
      electoralRegisterMatch: 45,
      ipGeolocationProximity: 49,
    },
    timeline: timeline([
      { label: "Session created", detail: "Business initiated a verification request.", tone: "neutral", minutesAgo: 240 },
      { label: "Started", detail: "User opened the hosted verification flow.", tone: "neutral", minutesAgo: 238 },
      { label: "Resubmission requested", detail: "User should capture the ID card again under better lighting.", tone: "warning", minutesAgo: 232 },
    ]),
    webhookEvents: [
      {
        id: makeUuid(),
        eventType: "verification.resubmission_requested",
        status: "retrying",
        attemptCount: 1,
        createdAt: isoAgo(232),
        lastAttemptAt: isoAgo(231),
        nextAttemptAt: isoAgo(-18),
        lastResponseStatus: 429,
        lastResponseBody: "Rate limited by receiving endpoint",
      },
    ],
    manualReviews: [],
    createdAt: isoAgo(240),
    updatedAt: isoAgo(232),
  }),
  sessionTemplate({
    id: "OV-845917",
    status: "verified",
    externalReference: "ref-1007",
    subjectName: "Riley Carter",
    score: 89,
    decisionReason: "Verified after manual review confirmed the ID image and register data were consistent.",
    riskFlags: ["manual-review"],
    manualReviews: [
      {
        reviewerId: profileId,
        previousStatus: "needs_review",
        newStatus: "verified",
        reason: "Matched the electoral register record and the selfie was sufficient for review.",
        createdAt: isoAgo(64),
      },
    ],
    webhookEvents: [
      {
        id: makeUuid(),
        eventType: "verification.verified",
        status: "sent",
        attemptCount: 1,
        createdAt: isoAgo(64),
        lastAttemptAt: isoAgo(63),
        lastResponseStatus: 204,
      },
    ],
    timeline: timeline([
      { label: "Session created", detail: "Business initiated a verification request.", tone: "neutral", minutesAgo: 70 },
      { label: "Started", detail: "User opened the hosted verification flow.", tone: "neutral", minutesAgo: 68 },
      { label: "Needs review", detail: "Automatic processing paused for a human decision.", tone: "warning", minutesAgo: 66 },
      { label: "Approved", detail: "Reviewer confirmed the identity details and cleared the session.", tone: "success", minutesAgo: 64 },
    ]),
    createdAt: isoAgo(70),
    updatedAt: isoAgo(64),
    completedAt: isoAgo(64),
  }),
  sessionTemplate({
    id: "OV-845916",
    status: "needs_review",
    externalReference: "ref-1008",
    subjectName: "Jamie Clarke",
    score: 62,
    decisionReason: "Document and face signals were reasonable, but the register match was incomplete.",
    riskFlags: ["partial-register-match"],
    scoreBreakdown: {
      idLayoutConfidence: 74,
      ocrConfidence: 63,
      faceMatchScore: 70,
      electoralRegisterMatch: 48,
      ipGeolocationProximity: 56,
    },
    timeline: timeline([
      { label: "Session created", detail: "Business initiated a verification request.", tone: "neutral", minutesAgo: 26 },
      { label: "Started", detail: "User opened the hosted verification flow.", tone: "neutral", minutesAgo: 24 },
      { label: "Needs review", detail: "Automatic checks need a human decision.", tone: "warning", minutesAgo: 18 },
    ]),
    webhookEvents: [],
    createdAt: isoAgo(26),
    updatedAt: isoAgo(18),
  }),
  sessionTemplate({
    id: "OV-845915",
    status: "verified",
    externalReference: "ref-1009",
    subjectName: "Avery Brooks",
    score: 95,
    decisionReason: "Strong match across all automatic signals.",
    riskFlags: [],
    scoreBreakdown: {
      idLayoutConfidence: 96,
      ocrConfidence: 91,
      faceMatchScore: 94,
      electoralRegisterMatch: 93,
      ipGeolocationProximity: 89,
    },
    createdAt: isoAgo(16),
    updatedAt: isoAgo(10),
    completedAt: isoAgo(10),
    webhookEvents: [],
    timeline: timeline([
      { label: "Session created", detail: "Business initiated a verification request.", tone: "neutral", minutesAgo: 16 },
      { label: "Started", detail: "User opened the hosted verification flow.", tone: "neutral", minutesAgo: 15 },
      { label: "Approved", detail: "Automatic verification passed with high confidence.", tone: "success", minutesAgo: 10 },
    ]),
  }),
];

const auditLogs: AuditLog[] = [
  {
    id: makeUuid(),
    actorProfileId: profileId,
    accountId,
    action: "Created deployment",
    entityType: "deployment",
    entityId: deploymentOneId,
    metadata: { deploymentName: "Driver Verification" },
    ipAddress: "190.186.12.44",
    createdAt: isoDaysAgo(9),
  },
  {
    id: makeUuid(),
    actorProfileId: profileId,
    accountId,
    action: "Manual review approved",
    entityType: "verification_session",
    entityId: "OV-845917",
    metadata: { previousStatus: "needs_review", newStatus: "verified" },
    ipAddress: "190.186.12.44",
    createdAt: isoAgo(64),
  },
  {
    id: makeUuid(),
    actorProfileId: profileId,
    accountId,
    action: "Webhook failed",
    entityType: "webhook_event",
    entityId: "evt_webhook_1",
    metadata: { eventType: "verification.rejected", status: "failed" },
    ipAddress: "190.186.12.44",
    createdAt: isoAgo(171),
  },
];

export function createInitialWorkspaceState(): WorkspaceState {
  return {
    accounts,
    profiles,
    deployments,
    sessions,
    auditLogs,
    currentAccountId: accountId,
    currentProfileId: profileId,
    activeRole: "super_admin",
    revealKeyForDeploymentId: null,
    lastGeneratedSecretKey: null,
  };
}
