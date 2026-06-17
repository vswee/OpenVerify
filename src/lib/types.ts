export type Role = "super_admin" | "admin" | "reviewer";
export type AccountStatus = "active" | "suspended";
export type DeploymentStatus = "active" | "paused" | "archived";
export type SessionStatus =
  | "created"
  | "started"
  | "consented"
  | "id_uploaded"
  | "selfie_uploaded"
  | "processing"
  | "verified"
  | "needs_review"
  | "rejected"
  | "resubmission_requested"
  | "expired"
  | "cancelled"
  | "error";
export type WebhookStatus = "pending" | "sent" | "failed" | "retrying" | "exhausted";
export type AssetType = "id_front" | "selfie" | "id_portrait_crop" | "processed_debug";

export interface Account {
  id: string;
  name: string;
  slug: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  accountId: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Branding {
  accentColor: string;
  logoMark: string;
  surfaceTint: string;
  heroBackground: string;
}

export interface Deployment {
  id: string;
  accountId: string;
  name: string;
  description: string;
  publicKey: string;
  secretKeyHash: string;
  webhookUrl: string;
  webhookSecret: string;
  successRedirectUrl: string;
  pendingRedirectUrl: string;
  failureRedirectUrl: string;
  allowedOrigins: string[];
  branding: Branding;
  status: DeploymentStatus;
  testMode: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  secretPreview?: string | null;
  requesterName: string;
}

export interface VerificationAsset {
  id: string;
  assetType: AssetType;
  name: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  previewDataUrl: string;
  createdAt: string;
  source: "sample" | "upload";
  quality: "clean" | "borderline" | "poor";
}

export interface ScoreBreakdown {
  idLayoutConfidence: number;
  ocrConfidence: number;
  faceMatchScore: number;
  electoralRegisterMatch: number;
  ipGeolocationProximity: number;
}

export interface ElectoralRegisterMatch {
  matched: boolean;
  matchedRecordId?: string;
  nameScore: number;
  addressScore: number;
  registeredAddress: string;
  registeredLat: number;
  registeredLon: number;
  distanceFromIpKm: number;
}

export interface FaceMatchResult {
  matchScore: number;
  provider: string;
}

export interface ManualReview {
  reviewerId: string;
  previousStatus: SessionStatus;
  newStatus: SessionStatus;
  reason: string;
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  eventType: string;
  status: WebhookStatus;
  attemptCount: number;
  createdAt: string;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  lastResponseStatus?: number;
  lastResponseBody?: string;
}

export interface TimelineEntry {
  id: string;
  label: string;
  detail: string;
  tone: "neutral" | "success" | "warning" | "danger";
  createdAt: string;
}

export interface VerificationSession {
  id: string;
  deploymentId: string;
  accountId: string;
  externalReference: string;
  status: SessionStatus;
  subjectName: string;
  subjectEmail: string;
  subjectPhone: string;
  purpose: string;
  requesterName: string;
  consentedAt?: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  geoResult: {
    city: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  score: number;
  scoreBreakdown: ScoreBreakdown;
  decisionReason: string;
  riskFlags: string[];
  assets: Partial<Record<AssetType, VerificationAsset>>;
  extractedData: {
    cardVersion: string;
    fullName: string;
    idNumber: string;
    dateOfBirth: string;
    addressText: string;
    ocrConfidence: number;
    layoutConfidence: number;
  };
  electoralMatch: ElectoralRegisterMatch;
  faceMatch: FaceMatchResult;
  manualReviews: ManualReview[];
  webhookEvents: WebhookEvent[];
  timeline: TimelineEntry[];
  redirectSuccessUrl: string;
  redirectPendingUrl: string;
  redirectFailureUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorProfileId?: string;
  accountId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface WorkspaceState {
  accounts: Account[];
  profiles: Profile[];
  deployments: Deployment[];
  sessions: VerificationSession[];
  auditLogs: AuditLog[];
  currentAccountId: string | null;
  currentProfileId: string | null;
  activeRole: Role;
  revealKeyForDeploymentId: string | null;
  lastGeneratedSecretKey: string | null;
}

export interface AccountInput {
  name: string;
  fullName: string;
  email: string;
}

export interface DeploymentInput {
  name: string;
  description: string;
  webhookUrl: string;
  webhookSecret: string;
  successRedirectUrl: string;
  pendingRedirectUrl: string;
  failureRedirectUrl: string;
  allowedOrigins: string[];
  requesterName: string;
  testMode: boolean;
}

export interface SessionCreationInput {
  deploymentId: string;
  externalReference: string;
  subjectName: string;
  subjectEmail: string;
  subjectPhone: string;
  purpose: string;
}
