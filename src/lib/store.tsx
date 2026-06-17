import React from "react";
import type {
  Account,
  AccountInput,
  DeploymentInput,
  Role,
  SessionCreationInput,
  SessionStatus,
  TimelineEntry,
  VerificationAsset,
  VerificationSession,
  WorkspaceState,
} from "./types";
import { createInitialWorkspaceState } from "./seed";
import { makeSampleIdCardSvg, makeSampleSelfieSvg } from "./sample-art";
import {
  getImageSizeFromDataUrl,
  makeId,
  makeUuid,
  readFileAsDataUrl,
  slugify,
} from "./utils";

const STORAGE_KEY = "openverify.workspace.v1";

interface WorkspaceContextValue {
  state: WorkspaceState;
  hydrateAccount: (input: AccountInput) => void;
  createDeployment: (input: DeploymentInput) => { deploymentId: string; secretKey: string };
  rotateDeploymentKeys: (deploymentId: string) => string;
  createVerificationSession: (input: SessionCreationInput) => string;
  setActiveRole: (role: Role) => void;
  updateDeployment: (deploymentId: string, patch: Partial<DeploymentInput>) => void;
  suspendAccount: (accountId: string, suspended: boolean) => void;
  saveCaptureFile: (sessionId: string, assetType: "id_front" | "selfie", file: File) => Promise<void>;
  loadSampleCaptures: (sessionId: string) => void;
  clearCapture: (sessionId: string, assetType: "id_front" | "selfie") => void;
  startVerificationProcessing: (sessionId: string) => Promise<void>;
  applyDecision: (sessionId: string, nextStatus: SessionStatus, reason: string) => void;
  setRevealKey: (deploymentId: string | null, secretKey: string | null) => void;
  dismissRevealKey: () => void;
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

function loadState() {
  if (typeof window === "undefined") {
    return createInitialWorkspaceState();
  }

  const serialized = window.localStorage.getItem(STORAGE_KEY);
  if (!serialized) {
    return createInitialWorkspaceState();
  }

  try {
    const parsed = JSON.parse(serialized) as WorkspaceState;
    return {
      ...createInitialWorkspaceState(),
      ...parsed,
    };
  } catch {
    return createInitialWorkspaceState();
  }
}

function persistState(state: WorkspaceState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function appendAudit(
  state: WorkspaceState,
  action: string,
  entityType: string,
  entityId?: string,
  metadata: Record<string, unknown> = {},
) {
  return {
    ...state,
    auditLogs: [
      {
        id: makeUuid(),
        actorProfileId: state.currentProfileId ?? undefined,
        accountId: state.currentAccountId ?? undefined,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress: "190.186.12.44",
        createdAt: new Date().toISOString(),
      },
      ...state.auditLogs,
    ],
  } satisfies WorkspaceState;
}

function updateSession(
  state: WorkspaceState,
  sessionId: string,
  updater: (session: VerificationSession) => VerificationSession,
) {
  return {
    ...state,
    sessions: state.sessions.map((session) => (session.id === sessionId ? updater(session) : session)),
  } satisfies WorkspaceState;
}

function updateTimeline(session: VerificationSession, entry: TimelineEntry) {
  return {
    ...session,
    timeline: [entry, ...session.timeline],
  };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<WorkspaceState>(() => loadState());

  React.useEffect(() => {
    persistState(state);
  }, [state]);

  const hydrateAccount = React.useCallback((input: AccountInput) => {
    setState((previous) => {
      const now = new Date().toISOString();
      const isFirstAccount = previous.accounts.length === 0;
      const accountId = makeUuid();
      const profileId = makeUuid();
      const account = {
        id: accountId,
        name: input.name,
        slug: slugify(input.name),
        status: "active" as const,
        createdAt: now,
        updatedAt: now,
      };
      const profile = {
        id: profileId,
        accountId,
        fullName: input.fullName,
        email: input.email,
        role: isFirstAccount ? ("super_admin" as const) : ("admin" as const),
        createdAt: now,
        updatedAt: now,
      };
      return appendAudit(
        {
          ...previous,
          accounts: [...previous.accounts, account],
          profiles: [...previous.profiles, profile],
          currentAccountId: accountId,
          currentProfileId: profileId,
          activeRole: profile.role,
        },
        "Created account",
        "account",
        accountId,
        { accountName: account.name, role: profile.role },
      );
    });
  }, []);

  const createDeployment = React.useCallback((input: DeploymentInput) => {
    let revealSecret = "";
    let deploymentId = "";
    setState((previous) => {
      const now = new Date().toISOString();
      deploymentId = makeUuid();
      revealSecret = `sk_${makeId("live", 18)}`;
      const deployment = {
        id: deploymentId,
        accountId: previous.currentAccountId ?? previous.accounts[0]?.id ?? "",
        name: input.name,
        description: input.description,
        publicKey: `dep_public_${makeId("", 8)}`,
        secretKeyHash: `hash_${makeId("", 24)}`,
        webhookUrl: input.webhookUrl,
        webhookSecret: input.webhookSecret,
        successRedirectUrl: input.successRedirectUrl,
        pendingRedirectUrl: input.pendingRedirectUrl,
        failureRedirectUrl: input.failureRedirectUrl,
        allowedOrigins: input.allowedOrigins,
        branding: {
          accentColor: "#0f7e82",
          logoMark: "shield",
          surfaceTint: "#eef4f6",
          heroBackground: "#ffffff",
        },
        status: "active" as const,
        testMode: input.testMode,
        createdAt: now,
        updatedAt: now,
        requesterName: input.requesterName,
      };
      return appendAudit(
        {
          ...previous,
          deployments: [deployment, ...previous.deployments],
          revealKeyForDeploymentId: deploymentId,
          lastGeneratedSecretKey: revealSecret,
        },
        "Created deployment",
        "deployment",
        deploymentId,
        { deploymentName: deployment.name },
      );
    });
    return { deploymentId, secretKey: revealSecret };
  }, []);

  const rotateDeploymentKeys = React.useCallback((deploymentId: string) => {
    let secretKey = "";
    setState((previous) => {
      secretKey = `sk_${makeId("live", 18)}`;
      const next = previous.deployments.map((deployment) =>
        deployment.id === deploymentId
          ? {
              ...deployment,
              secretKeyHash: `hash_${makeId("", 24)}`,
              updatedAt: new Date().toISOString(),
            }
          : deployment,
      );
      return appendAudit(
        {
          ...previous,
          deployments: next,
          revealKeyForDeploymentId: deploymentId,
          lastGeneratedSecretKey: secretKey,
        },
        "Rotated deployment credentials",
        "deployment",
        deploymentId,
        {},
      );
    });
    return secretKey;
  }, []);

  const createVerificationSession = React.useCallback((input: SessionCreationInput) => {
    let sessionId = "";
    setState((previous) => {
      const now = new Date().toISOString();
      const deployment = previous.deployments.find((item) => item.id === input.deploymentId);
      if (!deployment) {
        return previous;
      }

      sessionId = `OV-${makeId("", 6).toUpperCase()}`;
      const session: VerificationSession = {
        id: sessionId,
        deploymentId: deployment.id,
        accountId: deployment.accountId,
        externalReference: input.externalReference,
        status: "created",
        subjectName: input.subjectName,
        subjectEmail: input.subjectEmail,
        subjectPhone: input.subjectPhone,
        purpose: input.purpose,
        requesterName: deployment.requesterName,
        consentedAt: undefined,
        startedAt: undefined,
        completedAt: undefined,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
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
        score: 0,
        scoreBreakdown: {
          idLayoutConfidence: 0,
          ocrConfidence: 0,
          faceMatchScore: 0,
          electoralRegisterMatch: 0,
          ipGeolocationProximity: 0,
        },
        decisionReason: "Awaiting upload.",
        riskFlags: [],
        assets: {},
        extractedData: {
          cardVersion: "Pending",
          fullName: input.subjectName,
          idNumber: "Pending",
          dateOfBirth: "Pending",
          addressText: "Pending",
          ocrConfidence: 0,
          layoutConfidence: 0,
        },
        electoralMatch: {
          matched: false,
          nameScore: 0,
          addressScore: 0,
          registeredAddress: "Pending",
          registeredLat: 0,
          registeredLon: 0,
          distanceFromIpKm: 0,
        },
        faceMatch: {
          matchScore: 0,
          provider: "OpenVerify Face Compare",
        },
        manualReviews: [],
        webhookEvents: [],
        timeline: [
          {
            id: makeUuid(),
            label: "Session created",
            detail: `Created for ${input.subjectName}.`,
            tone: "neutral",
            createdAt: now,
          },
        ],
        redirectSuccessUrl: deployment.successRedirectUrl,
        redirectPendingUrl: deployment.pendingRedirectUrl,
        redirectFailureUrl: deployment.failureRedirectUrl,
        createdAt: now,
        updatedAt: now,
      };
      return appendAudit(
        {
          ...previous,
          sessions: [session, ...previous.sessions],
        },
        "Created verification session",
        "verification_session",
        sessionId,
        { deploymentId: deployment.id, externalReference: input.externalReference },
      );
    });
    return sessionId;
  }, []);

  const setActiveRole = React.useCallback((role: Role) => {
    setState((previous) => appendAudit({ ...previous, activeRole: role }, "Switched role view", "profile", previous.currentProfileId ?? undefined, { role }));
  }, []);

  const updateDeployment = React.useCallback((deploymentId: string, patch: Partial<DeploymentInput>) => {
    setState((previous) => {
      const next = previous.deployments.map((deployment) =>
        deployment.id === deploymentId
          ? {
              ...deployment,
              ...patch,
              updatedAt: new Date().toISOString(),
            }
          : deployment,
      );
      return appendAudit(
        {
          ...previous,
          deployments: next,
        },
        "Updated deployment settings",
        "deployment",
        deploymentId,
        patch,
      );
    });
  }, []);

  const suspendAccount = React.useCallback((accountId: string, suspended: boolean) => {
    setState((previous) => {
      const next: Account[] = previous.accounts.map((account) =>
        account.id === accountId
          ? { ...account, status: suspended ? "suspended" : "active", updatedAt: new Date().toISOString() }
          : account,
      );
      return appendAudit(
        {
          ...previous,
          accounts: next,
        },
        suspended ? "Suspended account" : "Reactivated account",
        "account",
        accountId,
        { suspended },
      );
    });
  }, []);

  const saveCaptureFile = React.useCallback(
    async (sessionId: string, assetType: "id_front" | "selfie", file: File) => {
      const dataUrl = await readFileAsDataUrl(file);
      const { width, height } = await getImageSizeFromDataUrl(dataUrl);
      const quality: VerificationAsset["quality"] =
        file.size > 120_000 && width > 900 && height > 900 ? "clean" : file.size > 50_000 ? "borderline" : "poor";
      const asset: VerificationAsset = {
        id: makeUuid(),
        assetType,
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        width,
        height,
        previewDataUrl: dataUrl,
        createdAt: new Date().toISOString(),
        source: "upload",
        quality,
      };

      setState((previous) =>
        appendAudit(
          updateSession(previous, sessionId, (session) => {
            const nextStatus: SessionStatus =
              assetType === "id_front" ? "id_uploaded" : session.assets.id_front ? "selfie_uploaded" : "id_uploaded";
            return {
              ...session,
              assets: {
                ...session.assets,
                [assetType]: asset,
              },
              status: session.assets.id_front || assetType === "id_front" ? nextStatus : "started",
              timeline: updateTimeline(session, {
                id: makeUuid(),
                label: assetType === "id_front" ? "ID uploaded" : "Selfie uploaded",
                detail: `${file.name} was added to the verification session.`,
                tone: "success",
                createdAt: new Date().toISOString(),
              }).timeline,
              updatedAt: new Date().toISOString(),
            };
          }),
          "Uploaded verification asset",
          "verification_asset",
          sessionId,
          { assetType, fileName: file.name, size: file.size, width, height },
        ),
      );
    },
    [],
  );

  const loadSampleCaptures = React.useCallback((sessionId: string) => {
    setState((previous) =>
      appendAudit(
        updateSession(previous, sessionId, (session) => {
          const now = new Date().toISOString();
          const initials = session.subjectName
            .split(/\s+/)
            .map((part) => part[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const idFront = {
            id: makeUuid(),
            assetType: "id_front" as const,
            name: "tt-id-front-sample.svg",
            mimeType: "image/svg+xml",
            sizeBytes: 122_000,
            width: 1200,
            height: 760,
            previewDataUrl:
              session.assets.id_front?.previewDataUrl ??
              makeSampleIdCardSvg({
                fullName: session.subjectName,
                idNumber: session.extractedData.idNumber === "Pending" ? "123456789" : session.extractedData.idNumber,
                dateOfBirth: session.extractedData.dateOfBirth === "Pending" ? "18 Apr 1992" : session.extractedData.dateOfBirth,
                addressText: session.extractedData.addressText === "Pending" ? "10 Rust Street, San Fernando" : session.extractedData.addressText,
              }),
            createdAt: now,
            source: "sample" as const,
            quality: "clean" as const,
          };
          const selfie = {
            id: makeUuid(),
            assetType: "selfie" as const,
            name: "selfie-sample.svg",
            mimeType: "image/svg+xml",
            sizeBytes: 140_000,
            width: 1200,
            height: 1200,
            previewDataUrl: session.assets.selfie?.previewDataUrl ?? makeSampleSelfieSvg({ initials, accent: "#0f7e82" }),
            createdAt: now,
            source: "sample" as const,
            quality: "borderline" as const,
          };
          return {
            ...session,
            status: "selfie_uploaded",
            assets: {
              id_front: idFront,
              selfie,
            },
            timeline: [
              {
                id: makeUuid(),
                label: "Sample captures loaded",
                detail: "Sample ID card and selfie captures were added for this session.",
                tone: "neutral",
                createdAt: now,
              },
              ...session.timeline,
            ],
            updatedAt: now,
          };
        }),
        "Loaded sample verification captures",
        "verification_session",
        sessionId,
        {},
      ),
    );
  }, []);

  const clearCapture = React.useCallback((sessionId: string, assetType: "id_front" | "selfie") => {
    setState((previous) =>
      appendAudit(
        updateSession(previous, sessionId, (session) => ({
          ...session,
          assets: {
            ...session.assets,
            [assetType]: undefined,
          },
          status: "started",
          updatedAt: new Date().toISOString(),
        })),
        "Cleared capture",
        "verification_asset",
        sessionId,
        { assetType },
      ),
    );
  }, []);

  const startVerificationProcessing = React.useCallback(async (sessionId: string) => {
    setState((previous) =>
      updateSession(previous, sessionId, (session) => ({
        ...session,
        status: "processing",
        timeline: [
          {
            id: makeUuid(),
            label: "Processing started",
            detail: "Automatic checks are running now.",
            tone: "warning",
            createdAt: new Date().toISOString(),
          },
          ...session.timeline,
        ],
        updatedAt: new Date().toISOString(),
      })),
    );

    await new Promise((resolve) => setTimeout(resolve, 1100));

    setState((previous) =>
      appendAudit(
        updateSession(previous, sessionId, (session) => {
          const idFront = session.assets.id_front;
          const selfie = session.assets.selfie;
          const idQuality = idFront ? (idFront.quality === "clean" ? 92 : idFront.quality === "borderline" ? 72 : 42) : 0;
          const ocrQuality = idFront ? Math.min(95, Math.round((idFront.width / idFront.height) * 48 + (idFront.sizeBytes > 100_000 ? 28 : 12))) : 0;
          const faceScore = selfie ? (selfie.quality === "clean" ? 91 : selfie.quality === "borderline" ? 64 : 38) : 0;
          const registerScore = idFront && selfie ? Math.round((idQuality + ocrQuality + faceScore) / 3) - 6 : 0;
          const ipScore = idFront ? 56 : 0;
          const overall = Math.round((idQuality * 0.2 + ocrQuality * 0.15 + faceScore * 0.3 + registerScore * 0.25 + ipScore * 0.1) / 1);
          const nextStatus: SessionStatus =
            !idFront || !selfie
              ? "resubmission_requested"
              : idFront.quality === "poor" || selfie.quality === "poor"
                ? "resubmission_requested"
                : overall >= 85
                  ? "verified"
                  : overall >= 60
                    ? "needs_review"
                    : "rejected";
          const riskFlags = uniqueRiskFlags(session);
          const scoreBreakdown = {
            idLayoutConfidence: clampNumber(idQuality),
            ocrConfidence: clampNumber(ocrQuality),
            faceMatchScore: clampNumber(faceScore),
            electoralRegisterMatch: clampNumber(registerScore),
            ipGeolocationProximity: clampNumber(ipScore),
          };
          const decisionReason =
            nextStatus === "verified"
              ? "Automatic verification passed with strong document, face, and register signals."
              : nextStatus === "needs_review"
                ? "Automatic verification paused because the score was not high enough for approval."
                : nextStatus === "rejected"
                  ? "The automatic score fell below the rejection threshold."
                  : "The images need to be captured again.";
          const extractedData = {
            cardVersion: idFront ? "Current TT EBC layout" : "Pending",
            fullName: session.subjectName,
            idNumber: idFront ? "123456789" : "Pending",
            dateOfBirth: idFront ? "1992-04-18" : "Pending",
            addressText: idFront ? "10 Rust Street, San Fernando" : "Pending",
            ocrConfidence: scoreBreakdown.ocrConfidence,
            layoutConfidence: scoreBreakdown.idLayoutConfidence,
          };
          const updated: VerificationSession = {
            ...session,
            status: nextStatus,
            score: overall,
            scoreBreakdown,
            decisionReason,
            riskFlags,
            extractedData,
            faceMatch: {
              matchScore: faceScore,
              provider: "OpenVerify Face Compare",
            },
            electoralMatch: {
              matched: overall >= 85,
              matchedRecordId: overall >= 85 ? "reg_0091" : undefined,
              nameScore: clampNumber(registerScore - 3),
              addressScore: clampNumber(registerScore - 8),
              registeredAddress: idFront ? "10 Rust Street, San Fernando" : "No match",
              registeredLat: idFront ? 10.2713 : 0,
              registeredLon: idFront ? -61.371 : 0,
              distanceFromIpKm: idFront ? 8.4 : 0,
            },
            completedAt: new Date().toISOString(),
            timeline: [
              {
                id: makeUuid(),
                label: nextStatus === "verified" ? "Approved" : nextStatus === "needs_review" ? "Needs review" : nextStatus === "rejected" ? "Rejected" : "Resubmission requested",
                detail: decisionReason,
                tone: nextStatus === "verified" ? "success" : nextStatus === "rejected" ? "danger" : "warning",
                createdAt: new Date().toISOString(),
              },
              ...session.timeline,
            ],
            webhookEvents: [
              {
                id: makeUuid(),
                eventType:
                  nextStatus === "verified"
                    ? "verification.verified"
                    : nextStatus === "needs_review"
                      ? "verification.needs_review"
                      : nextStatus === "rejected"
                        ? "verification.rejected"
                        : "verification.resubmission_requested",
                status: "pending",
                attemptCount: 0,
                createdAt: new Date().toISOString(),
              },
              ...session.webhookEvents,
            ],
            updatedAt: new Date().toISOString(),
          };
          return updated;
        }),
        "Completed verification processing",
        "verification_session",
        sessionId,
        {},
      ),
    );
  }, []);

  const applyDecision = React.useCallback((sessionId: string, nextStatus: SessionStatus, reason: string) => {
    setState((previous) =>
      appendAudit(
        updateSession(previous, sessionId, (session) => {
          const now = new Date().toISOString();
          const reviewerId = previous.currentProfileId ?? "reviewer";
          return {
            ...session,
            status: nextStatus,
            score: nextStatus === "verified" ? Math.max(session.score, 90) : nextStatus === "rejected" ? Math.min(session.score, 32) : session.score,
            decisionReason: reason,
            manualReviews: [
              {
                reviewerId,
                previousStatus: session.status,
                newStatus: nextStatus,
                reason,
                createdAt: now,
              },
              ...session.manualReviews,
            ],
            timeline: [
              {
                id: makeUuid(),
                label:
                  nextStatus === "verified"
                    ? "Manually approved"
                    : nextStatus === "rejected"
                      ? "Manually rejected"
                      : nextStatus === "resubmission_requested"
                        ? "Resubmission requested"
                        : "Manual review updated",
                detail: reason,
                tone: nextStatus === "verified" ? "success" : nextStatus === "rejected" ? "danger" : "warning",
                createdAt: now,
              },
              ...session.timeline,
            ],
            webhookEvents: [
              {
                id: makeUuid(),
                eventType:
                  nextStatus === "verified"
                    ? "verification.verified"
                    : nextStatus === "rejected"
                      ? "verification.rejected"
                      : nextStatus === "resubmission_requested"
                        ? "verification.resubmission_requested"
                        : "verification.needs_review",
                status: "pending",
                attemptCount: 0,
                createdAt: now,
              },
              ...session.webhookEvents,
            ],
            completedAt: now,
            updatedAt: now,
          };
        }),
        "Applied manual review decision",
        "verification_session",
        sessionId,
        { nextStatus, reason },
      ),
    );
  }, []);

  const setRevealKey = React.useCallback((deploymentId: string | null, secretKey: string | null) => {
    setState((previous) => ({
      ...previous,
      revealKeyForDeploymentId: deploymentId,
      lastGeneratedSecretKey: secretKey,
    }));
  }, []);

  const dismissRevealKey = React.useCallback(() => {
    setState((previous) => ({
      ...previous,
      revealKeyForDeploymentId: null,
      lastGeneratedSecretKey: null,
    }));
  }, []);

  const value = React.useMemo<WorkspaceContextValue>(
    () => ({
      state,
      hydrateAccount,
      createDeployment,
      rotateDeploymentKeys,
      createVerificationSession,
      setActiveRole,
      updateDeployment,
      suspendAccount,
      saveCaptureFile,
      loadSampleCaptures,
      clearCapture,
      startVerificationProcessing,
      applyDecision,
      setRevealKey,
      dismissRevealKey,
    }),
    [
      state,
      hydrateAccount,
      createDeployment,
      rotateDeploymentKeys,
      createVerificationSession,
      setActiveRole,
      updateDeployment,
      suspendAccount,
      saveCaptureFile,
      loadSampleCaptures,
      clearCapture,
      startVerificationProcessing,
      applyDecision,
      setRevealKey,
      dismissRevealKey,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }
  return context;
}

export function useSession(sessionId?: string) {
  const {
    state: { sessions },
  } = useWorkspace();
  return sessions.find((session) => session.id === sessionId);
}

function clampNumber(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function uniqueRiskFlags(session: VerificationSession) {
  const flags = new Set(session.riskFlags);
  if (session.assets.id_front && session.assets.id_front.quality === "borderline") {
    flags.add("borderline-id-capture");
  }
  if (session.assets.selfie && session.assets.selfie.quality === "borderline") {
    flags.add("borderline-selfie-capture");
  }
  return Array.from(flags);
}
