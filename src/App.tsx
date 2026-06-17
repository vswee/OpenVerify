import React from "react";
import { Button, Badge, Card, CopyButton, EmptyState, Field, ProgressBar, Select, StatCard, TextArea, TextInput } from "./components/Ui";
import { Icon } from "./components/Icon";
import { WorkspaceProvider, useWorkspace, useSession } from "./lib/store";
import type { Deployment, DeploymentInput, SessionStatus, VerificationAsset, VerificationSession } from "./lib/types";
import { average, classNames, formatBytes, formatDateTime, formatNumber, formatRelativeTime, makeId } from "./lib/utils";

export function App() {
  return (
    <WorkspaceProvider>
      <AppRouter />
    </WorkspaceProvider>
  );
}

function AppRouter() {
  const [location, setLocation] = React.useState(() => window.location.pathname + window.location.search);

  React.useEffect(() => {
    const onPop = () => setLocation(window.location.pathname + window.location.search);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  React.useEffect(() => {
    document.title = titleForPath(location);
  }, [location]);

  const navigate = React.useCallback((path: string) => {
    if (path === window.location.pathname + window.location.search) {
      return;
    }
    window.history.pushState({}, "", path);
    setLocation(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const path = location.split("?")[0];
  const search = new URLSearchParams(location.split("?")[1] ?? "");

  if (path.startsWith("/verify/")) {
    return <VerificationPage navigate={navigate} sessionId={decodeURIComponent(path.split("/")[2] ?? "")} />;
  }

  if (path === "/auth") {
    return <AuthPage navigate={navigate} />;
  }

  if (path.startsWith("/legal/")) {
    return <LegalPage navigate={navigate} slug={path.split("/")[2] ?? "privacy"} />;
  }

  if (path.startsWith("/app")) {
    return <DashboardApp navigate={navigate} route={path} sessionId={search.get("session") ?? undefined} />;
  }

  return <LandingPage navigate={navigate} />;
}

function titleForPath(path: string) {
  if (path.startsWith("/verify/")) return "OpenVerify verification";
  if (path === "/auth") return "OpenVerify sign in";
  if (path.startsWith("/legal/privacy")) return "OpenVerify privacy policy";
  if (path.startsWith("/legal/terms")) return "OpenVerify terms of service";
  if (path.startsWith("/app")) return "OpenVerify dashboard";
  return "OpenVerify";
}

function hostedFlowSessionId(sessions: VerificationSession[]) {
  const liveSession = sessions.find((session) =>
    ["created", "started", "consented", "id_uploaded", "selfie_uploaded", "processing"].includes(session.status),
  );
  return liveSession?.id ?? sessions[0]?.id ?? "OV-845922";
}

function completedSessions(sessions: VerificationSession[]) {
  return sessions.filter((session) => !["created", "started", "consented", "id_uploaded", "selfie_uploaded", "processing"].includes(session.status));
}

function LegalPage({ navigate, slug }: { navigate: (path: string) => void; slug: string }) {
  const document = slug === "terms" ? termsOfService : privacyPolicy;

  return (
    <div className="page-shell landing-shell">
      <header className="public-header">
        <button className="brand" onClick={() => navigate("/")}>
          <span className="brand-mark">
            <Icon name="shield" />
          </span>
          <span>
            <strong>OpenVerify</strong>
            <small>{document.title}</small>
          </span>
        </button>
        <nav className="public-nav">
          <a href="/" onClick={(event) => publicNavigate(event, navigate, "/")}>Home</a>
          <a href="/app" onClick={(event) => publicNavigate(event, navigate, "/app")}>Dashboard</a>
          <a href="/auth" onClick={(event) => publicNavigate(event, navigate, "/auth")}>Sign in</a>
        </nav>
      </header>

      <main style={{ display: "grid", gap: 18, maxWidth: 980, width: "100%", margin: "0 auto", paddingBottom: 36 }}>
        <Card title={document.title} subtitle={document.subtitle}>
          <div className="legal-meta">
            <div>
              <span>Effective date</span>
              <strong>[Insert date]</strong>
            </div>
            <div>
              <span>Last updated</span>
              <strong>[Insert date]</strong>
            </div>
            <div>
              <span>Scope</span>
              <strong>Trinidad and Tobago identity verification</strong>
            </div>
          </div>
        </Card>
        {document.sections.map((section) => (
          <Card key={section.title} title={section.title}>
            <div className="legal-section">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Card>
        ))}
      </main>
    </div>
  );
}

type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalDocument = {
  title: string;
  subtitle: string;
  sections: LegalSection[];
};

const privacyPolicy: LegalDocument = {
  title: "Privacy Policy",
  subtitle: "How OpenVerify collects, uses, shares, and protects verification data.",
  sections: [
    {
      title: "Who We Are",
      paragraphs: [
        "OpenVerify is operated by a Trinidad and Tobago-focused verification provider. The service exists to help businesses verify identity without inventing their own fragile document pipeline.",
        "If you are verifying because a business sent you here, that business also needs its own lawful reason to request your data.",
      ],
    },
    {
      title: "What OpenVerify Does",
      paragraphs: [
        "OpenVerify checks whether an uploaded Trinidad and Tobago national ID card appears to match the supported layout, whether the image is readable, whether the selfie appears to match the card photograph, and whether available register and geolocation signals support the decision.",
      ],
      bullets: [
        "ID card layout confidence",
        "OCR and readability checks",
        "Face comparison",
        "Electoral register matching",
        "Geo IP proximity scoring",
      ],
    },
    {
      title: "Information We Collect",
      paragraphs: [
        "We may collect the business reference, your name, email address, phone number, consent confirmation, the front of your ID card, a selfie, technical metadata, and the resulting verification status.",
        "Where required, we also store the extracted fields, score breakdown, manual review notes, and webhook delivery records.",
      ],
    },
    {
      title: "Why We Collect It",
      paragraphs: [
        "We use the information to provide identity verification, generate a score, send the result to the business customer, maintain security, and support lawful manual review where automation is not enough.",
      ],
    },
    {
      title: "Sharing and Retention",
      paragraphs: [
        "We may share the result with the business that requested the verification and with service providers needed to operate the service. Raw uploads are retained only as long as necessary for the service, compliance, dispute handling, and security.",
      ],
    },
    {
      title: "Security",
      paragraphs: [
        "Uploads are stored privately, access is role-restricted, secrets are not shown more than once, and webhooks are signed. None of that is magic, but it is the minimum required here.",
      ],
    },
  ],
};

const termsOfService: LegalDocument = {
  title: "Terms of Service",
  subtitle: "The rules for using the platform, dashboard, hosted flow, and webhooks.",
  sections: [
    {
      title: "The Service",
      paragraphs: [
        "OpenVerify provides hosted identity verification, deployment management, manual review, webhook delivery, audit logs, and dashboard access for businesses that need a Trinidad and Tobago KYC layer.",
      ],
    },
    {
      title: "Account Registration",
      paragraphs: [
        "The first account created in the system may automatically become a super admin account. Later accounts default to admin access unless invited or configured otherwise.",
      ],
    },
    {
      title: "Customer Responsibilities",
      paragraphs: [
        "Customers must use OpenVerify lawfully, provide notice to end users, secure their API keys and webhook endpoints, and avoid relying on scores without considering their own legal and operational obligations.",
      ],
    },
    {
      title: "End User Responsibilities",
      paragraphs: [
        "End users must provide genuine information, submit their own ID card and selfie, and avoid attempts to bypass the verification flow.",
      ],
    },
    {
      title: "Deployment and API Credentials",
      paragraphs: [
        "Each deployment may have unique credentials. Secret keys must be protected, rotated if exposed, and validated before use. Signed webhook requests should be verified before any downstream action is taken.",
      ],
    },
    {
      title: "Verification Results",
      paragraphs: [
        "A verified result means the submitted session passed the configured checks. A needs review result means the system was not confident enough to approve automatically. A rejected result means the session failed the applicable checks or manual review.",
      ],
    },
    {
      title: "Security and Retention",
      paragraphs: [
        "OpenVerify uses private storage, audit logs, and role-based access controls. Raw images, metadata, and logs are retained only as long as reasonably necessary for the service, compliance, and dispute handling.",
      ],
    },
  ],
};

function LandingPage({ navigate }: { navigate: (path: string) => void }) {
  const { state } = useWorkspace();
  const hostedFlowId = hostedFlowSessionId(state.sessions);
  const summarySessions = completedSessions(state.sessions);
  const verified = summarySessions.filter((session) => session.status === "verified").length;
  const review = summarySessions.filter((session) => session.status === "needs_review").length;
  const rejected = summarySessions.filter((session) => session.status === "rejected").length;
  const total = summarySessions.length;

  return (
    <div className="page-shell landing-shell">
      <header className="public-header">
        <button className="brand" onClick={() => navigate("/")}>
          <span className="brand-mark">
            <Icon name="shield" />
          </span>
          <span>
            <strong>OpenVerify</strong>
            <small>Trinidad and Tobago identity verification</small>
          </span>
        </button>
        <nav className="public-nav">
          <a href="/app" onClick={(event) => publicNavigate(event, navigate, "/app")}>
            Dashboard
          </a>
          <a href={`/verify/${hostedFlowId}`} onClick={(event) => publicNavigate(event, navigate, `/verify/${hostedFlowId}`)}>
            Hosted flow
          </a>
          <a href="/legal/privacy" onClick={(event) => publicNavigate(event, navigate, "/legal/privacy")}>
            Privacy
          </a>
          <a href="/legal/terms" onClick={(event) => publicNavigate(event, navigate, "/legal/terms")}>
            Terms
          </a>
          <a href="/auth" onClick={(event) => publicNavigate(event, navigate, "/auth")}>
            Sign in
          </a>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero-grid">
          <div className="hero-copy">
            <p className="section-kicker">Hosted verification, review, and webhooks</p>
            <h1>Identity verification for Trinidad and Tobago onboarding that businesses can actually ship.</h1>
            <p className="hero-lead">
              OpenVerify gives businesses a hosted TT ID capture flow, score-based automated checks, manual review, and
              signed webhook callbacks without building the whole pipeline from scratch.
            </p>
            <div className="hero-actions">
              <Button onClick={() => navigate("/auth")}>Create workspace</Button>
              <Button variant="secondary" onClick={() => navigate("/app")}>
                Open the dashboard
              </Button>
            </div>
            <div className="hero-note">
              <Icon name="lock" />
              Private uploads, explicit consent, and a review queue built for regulated onboarding.
            </div>
          </div>
          <div className="hero-preview">
            <Card className="hero-preview-card" title="Live operational snapshot" subtitle="The sample workspace is populated with TT verification data.">
              <div className="preview-stack">
                <div className="preview-panel">
                  <div>
                    <span>Verified</span>
                    <strong>{formatNumber(verified)}</strong>
                  </div>
                  <div>
                    <span>Needs review</span>
                    <strong>{formatNumber(review)}</strong>
                  </div>
                  <div>
                    <span>Rejected</span>
                    <strong>{formatNumber(rejected)}</strong>
                  </div>
                </div>
                <div className="preview-flow">
                  <div className="preview-flow-step is-verified">
                    <span>1</span>
                    Hosted flow
                  </div>
                  <Icon name="arrow-right" />
                  <div className="preview-flow-step is-warning">
                    <span>2</span>
                    Score model
                  </div>
                  <Icon name="arrow-right" />
                  <div className="preview-flow-step is-success">
                    <span>3</span>
                    Webhook
                  </div>
                </div>
              </div>
            </Card>
            <div className="hero-facts">
              <StatCard title="Total verifications" value={formatNumber(total)} subtext="Seeded sessions in the workspace." tone="neutral" />
              <StatCard title="Average score" value={`${formatNumber(average(summarySessions.map((item) => item.score)))} / 100`} subtext="Transparent weighted score." tone="success" />
            </div>
          </div>
        </section>

        <section className="section-band">
          <Card
            title="Built for the actual workflow"
            subtitle="The MVP is intentionally narrow: TT national ID cards, selfie comparison, electoral register matching, and a review queue."
          >
            <div className="feature-strip">
              <article>
                <Icon name="camera" />
                <h3>Hosted capture</h3>
                <p>Guided ID and selfie capture with explicit consent and clear upload validation.</p>
              </article>
              <article>
                <Icon name="chart" />
                <h3>Transparent scoring</h3>
                <p>Weighted signals for document layout, OCR confidence, face match, register match, and geo proximity.</p>
              </article>
              <article>
                <Icon name="webhook" />
                <h3>Signed callbacks</h3>
                <p>Webhook events that the business can verify before trusting any decision downstream.</p>
              </article>
            </div>
          </Card>
        </section>

        <section className="section-band two-up">
          <Card title="How it works" subtitle="The first account becomes super admin automatically. Later accounts get the admin role unless invited otherwise.">
            <div className="step-list">
              <div>
                <span>1</span>
                <strong>Create a workspace</strong>
                <p>Set up the first account and onboard the operator who will create deployments.</p>
              </div>
              <div>
                <span>2</span>
                <strong>Create a deployment</strong>
                <p>Generate public and secret credentials, webhook configuration, and redirect URLs.</p>
              </div>
              <div>
                <span>3</span>
                <strong>Send users to the hosted flow</strong>
                <p>Collect the TT ID card and selfie, score the result, then notify the business.</p>
              </div>
              <div>
                <span>4</span>
                <strong>Review exceptions</strong>
                <p>Approve, reject, or request resubmission from the review queue when automation is not enough.</p>
              </div>
            </div>
          </Card>
          <Card title="Compliance first" subtitle="The copy and structure are intentionally plain because identity verification should not be theatre.">
            <div className="trust-list">
              <div>
                <Icon name="shield" />
                Trinidad and Tobago ID support only
              </div>
              <div>
                <Icon name="lock" />
                Private asset storage and signed access
              </div>
              <div>
                <Icon name="webhook" />
                Webhooks signed with a deployment secret
              </div>
              <div>
                <Icon name="review" />
                Manual review with audit logging
              </div>
            </div>
            <div className="card-footnote">
              Read the policy and terms before you ship a real integration:
              <div className="inline-links">
                <a href="/legal/privacy" onClick={(event) => publicNavigate(event, navigate, "/legal/privacy")}>
                  Privacy Policy
                </a>
                <a href="/legal/terms" onClick={(event) => publicNavigate(event, navigate, "/legal/terms")}>
                  Terms of Service
                </a>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

function AuthPage({ navigate }: { navigate: (path: string) => void }) {
  const { state, hydrateAccount } = useWorkspace();
  const existing = state.accounts.length > 0;
  const [form, setForm] = React.useState({
    name: existing ? state.accounts[0]?.name ?? "Pro Services Ltd" : "Pro Services Ltd",
    fullName: existing ? state.profiles[0]?.fullName ?? "Alex Morgan" : "Alex Morgan",
    email: existing ? state.profiles[0]?.email ?? "alex.morgan@example.com" : "alex.morgan@example.com",
  });

  return (
    <div className="page-shell auth-shell">
      <div className="auth-panel">
        <div className="auth-hero">
          <button className="brand" onClick={() => navigate("/")}>
            <span className="brand-mark">
              <Icon name="shield" />
            </span>
            <span>
              <strong>OpenVerify</strong>
              <small>Workspace setup</small>
            </span>
          </button>
          <h1>Create the first account and start issuing deployments.</h1>
          <p>
            The first account in the system is automatically assigned the <code>super_admin</code> role. Later accounts
            default to <code>admin</code> unless they are explicitly invited.
          </p>
          <div className="auth-callouts">
            <div>
              <Icon name="key" />
              Secret API keys are shown once
            </div>
            <div>
              <Icon name="review" />
              Review queue and manual override built in
            </div>
            <div>
              <Icon name="globe" />
              TT ID and electoral register checks only
            </div>
          </div>
        </div>

        <Card className="auth-form-card" title={existing ? "Workspace created" : "Create workspace"} subtitle="A short form is enough for the MVP preview.">
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              hydrateAccount(form);
              navigate("/app");
            }}
          >
            <Field label="Business name" hint="E.g. Pro Services Ltd.">
              <TextInput value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} />
            </Field>
            <Field label="Your full name">
              <TextInput value={form.fullName} onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))} />
            </Field>
            <Field label="Work email">
              <TextInput type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} />
            </Field>
            <Field label="Password">
              <TextInput type="password" value="temporary-setup-password" readOnly />
            </Field>
            <div className="auth-actions">
              <Button type="submit">{existing ? "Enter dashboard" : "Create workspace"}</Button>
              <Button type="button" variant="secondary" onClick={() => navigate("/app")}>Skip setup</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function DashboardApp({ navigate, route, sessionId }: { navigate: (path: string) => void; route: string; sessionId?: string }) {
  const { state, setActiveRole } = useWorkspace();
  const sections = dashboardSectionsForRole(state.activeRole);
  const activeSection = sectionFromRoute(route);
  const defaultSession = state.sessions.find((item) => item.status === "needs_review") ?? state.sessions[0];
  const selectedSession = sessionId ? state.sessions.find((item) => item.id === sessionId) ?? defaultSession : defaultSession;
  const selectedDeployment = state.deployments[0];

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <button className="brand sidebar-brand" onClick={() => navigate("/app")}>
          <span className="brand-mark">
            <Icon name="shield" />
          </span>
          <span>
            <strong>OpenVerify</strong>
            <small>Admin console</small>
          </span>
        </button>
        <nav className="sidebar-nav">
          {sections.map((section) => {
            const active = section.path === activeSection.path;
            return (
              <a
                key={section.path}
                href={section.path}
                className={classNames("sidebar-link", active && "is-active")}
                onClick={(event) => publicNavigate(event, navigate, section.path)}
              >
                <Icon name={section.icon} />
                <span>{section.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-role">
            <span>Role preview</span>
            <div className="role-toggle">
              {(["super_admin", "admin", "reviewer"] as const).map((role) => (
                <button
                  key={role}
                  className={classNames("role-pill", state.activeRole === role && "is-active")}
                  onClick={() => setActiveRole(role)}
                >
                  {role.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <Icon name="logout" className="icon icon-inline" />
            Exit workspace
          </Button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div className="topbar-search">
            <Icon name="search" />
            <input placeholder="Search sessions, deployments, or audit logs" />
          </div>
          <div className="topbar-actions">
            <Button variant="ghost" size="sm">
              <Icon name="bell" className="icon icon-inline" />
              Alerts
            </Button>
            <Button variant="ghost" size="sm">
              <Icon name="help" className="icon icon-inline" />
              Help
            </Button>
            <div className="account-chip">
              <span>
                {(state.profiles[0]?.fullName ?? "Alex Morgan")
                  .split(/\s+/)
                  .map((part) => part[0] ?? "")
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <div>
                <strong>{state.profiles[0]?.fullName ?? "Alex Morgan"}</strong>
                <small>{state.activeRole.replace("_", " ")}</small>
              </div>
            </div>
          </div>
        </header>

        <section className="dashboard-page">
          {activeSection.key === "overview" && <OverviewPage navigate={navigate} session={selectedSession} />}
          {activeSection.key === "verifications" && <VerificationsPage navigate={navigate} session={selectedSession} />}
          {activeSection.key === "deployments" && <DeploymentsPage navigate={navigate} deployment={selectedDeployment} />}
          {activeSection.key === "integration" && <IntegrationPage navigate={navigate} deployment={selectedDeployment} />}
          {activeSection.key === "review" && <ReviewQueuePage navigate={navigate} />}
          {activeSection.key === "webhooks" && <WebhooksPage navigate={navigate} />}
          {activeSection.key === "settings" && <SettingsPage />}
          {activeSection.key === "platform" && <PlatformPage />}
          {activeSection.key === "audit" && <AuditPage />}
          {activeSection.key === "logs" && <LogsPage />}
        </section>
      </main>
    </div>
  );
}

function OverviewPage({ navigate, session }: { navigate: (path: string) => void; session?: VerificationSession }) {
  const { state } = useWorkspace();
  const summarySessions = completedSessions(state.sessions);
  const total = summarySessions.length;
  const verified = summarySessions.filter((item) => item.status === "verified").length;
  const review = summarySessions.filter((item) => item.status === "needs_review").length;
  const rejected = summarySessions.filter((item) => item.status === "rejected").length;
  const webhookFailures = summarySessions.flatMap((sessionItem) => sessionItem.webhookEvents).filter((event) => event.status === "failed").length;
  const averageScore = Math.round(average(summarySessions.map((item) => item.score)));

  return (
    <div className="content-grid overview-grid">
      <div className="content-main">
        <div className="page-header">
          <div>
            <p className="section-kicker">Overview</p>
            <h1>Verification operations.</h1>
            <p className="page-lead">
              The overview shows the live queue, current score mix, and the session selected for review. Average score across the sample data is {averageScore} / 100.
            </p>
          </div>
          <div className="page-actions">
            <Button variant="secondary" onClick={() => navigate("/app/deployments")}>
              <Icon name="plus" className="icon icon-inline" />
              Create deployment
            </Button>
            <Button onClick={() => navigate("/app/integration")}>Integration guide</Button>
          </div>
        </div>

        <div className="metric-grid">
          <StatCard title="Total verifications" value={formatNumber(total)} subtext="Seeded in the workspace." sparkline={<MiniSparkline values={[58, 66, 62, 73, 77, 82, 88]} />} />
          <StatCard title="Verified" value={formatNumber(verified)} subtext={`${Math.round((verified / total) * 100)}% of sessions`} tone="success" />
          <StatCard title="Needs review" value={formatNumber(review)} subtext="Queue items waiting for a human." tone="warning" />
          <StatCard title="Rejected" value={formatNumber(rejected)} subtext={`${webhookFailures} webhook failures in the sample data`} tone="danger" />
        </div>

        <Card title="Queue" subtitle="The table stays focused on the reviewable sessions.">
          <SessionTable compact sessionList={summarySessions.slice(0, 10)} navigate={navigate} />
        </Card>
      </div>

      <aside className="content-aside">
        {session ? <SessionDetailPanel session={session} compact /> : <EmptyState icon={<Icon name="review" />} title="No session selected" description="Choose a verification from the table to inspect the ID, selfie, score breakdown, and webhook history." />}
      </aside>
    </div>
  );
}

function VerificationsPage({ navigate, session }: { navigate: (path: string) => void; session?: VerificationSession }) {
  const { state } = useWorkspace();
  const [status, setStatus] = React.useState<SessionStatus | "all">("all");
  const [deployment, setDeployment] = React.useState("all");
  const [scoreRange, setScoreRange] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const filtered = state.sessions.filter((item) => {
    const matchesStatus = status === "all" ? true : item.status === status;
    const matchesDeployment = deployment === "all" ? true : item.deploymentId === deployment;
    const matchesScore =
      scoreRange === "all"
        ? true
        : scoreRange === "85plus"
          ? item.score >= 85
          : scoreRange === "60to84"
            ? item.score >= 60 && item.score <= 84
            : item.score < 60;
    const matchesSearch =
      !search ||
      [item.id, item.subjectName, item.requesterName, item.externalReference, item.extractedData.fullName]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchesStatus && matchesDeployment && matchesScore && matchesSearch;
  });

  return (
    <div className="content-grid verifications-grid">
      <div className="content-main">
        <div className="page-header">
          <div>
            <p className="section-kicker">Verifications</p>
            <h1>Search, filter, and inspect every session.</h1>
            <p className="page-lead">A table-first view for review, manual override, and audit-ready investigation.</p>
          </div>
          <div className="page-actions">
            <Button variant="secondary" onClick={() => navigate("/app/review")}>Open review queue</Button>
            <Button onClick={() => navigate("/app/integration")}>Create session</Button>
          </div>
        </div>

        <Card className="filters-card" title="Filters" subtitle="Use the filters to narrow the sample data.">
          <div className="filter-row">
            <Field label="Search">
              <TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, reference, or session ID" />
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(event) => setStatus(event.target.value as SessionStatus | "all")}>
                <option value="all">All statuses</option>
                <option value="verified">Verified</option>
                <option value="needs_review">Needs review</option>
                <option value="rejected">Rejected</option>
                <option value="resubmission_requested">Resubmission requested</option>
                <option value="processing">Processing</option>
              </Select>
            </Field>
            <Field label="Deployment">
              <Select value={deployment} onChange={(event) => setDeployment(event.target.value)}>
                <option value="all">All deployments</option>
                {state.deployments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Score range">
              <Select value={scoreRange} onChange={(event) => setScoreRange(event.target.value)}>
                <option value="all">All scores</option>
                <option value="85plus">85 - 100</option>
                <option value="60to84">60 - 84</option>
                <option value="below60">0 - 59</option>
              </Select>
            </Field>
          </div>
        </Card>

        <Card title="Verification table" subtitle={`${filtered.length} matching sessions.`}>
          <SessionTable sessionList={filtered} navigate={navigate} />
        </Card>
      </div>

      <aside className="content-aside">
        {session ? <SessionDetailPanel session={session} /> : <EmptyState icon={<Icon name="review" />} title="Select a session" description="Choose a row to inspect the capture quality, score breakdown, and webhook history." />}
      </aside>
    </div>
  );
}

function DeploymentsPage({ navigate, deployment }: { navigate: (path: string) => void; deployment: Deployment }) {
  const { state, createDeployment, rotateDeploymentKeys, dismissRevealKey, setRevealKey } = useWorkspace();
  const hostedFlowId = hostedFlowSessionId(state.sessions);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<DeploymentInput>({
    name: "",
    description: "",
    webhookUrl: "https://example.com/webhooks/openverify",
    webhookSecret: `whsec_${makeId("", 12)}`,
    successRedirectUrl: "https://example.com/onboarding/verified",
    pendingRedirectUrl: "https://example.com/onboarding/pending",
    failureRedirectUrl: "https://example.com/onboarding/failed",
    allowedOrigins: ["https://example.com"],
    requesterName: "Pro Services Ltd",
    testMode: true,
  });

  return (
    <div className="content-grid deployments-grid">
      <div className="content-main">
        <div className="page-header">
          <div>
            <p className="section-kicker">Deployments</p>
            <h1>Credentials, redirects, and webhook settings.</h1>
            <p className="page-lead">Each deployment gets its own public key, secret key, signing secret, and integration details.</p>
          </div>
          <div className="page-actions">
            <Button variant="secondary" onClick={() => navigate("/app/integration")}>Integration guide</Button>
            <Button onClick={() => setOpen(true)}>
              <Icon name="plus" className="icon icon-inline" />
              Create deployment
            </Button>
          </div>
        </div>

        <div className="deployment-list">
          {state.deployments.map((item) => (
            <button key={item.id} className={classNames("deployment-row", item.id === deployment.id && "is-selected")} onClick={() => setRevealKey(item.id, state.lastGeneratedSecretKey)}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
              </div>
              <div className="deployment-meta">
                <Badge tone={item.status === "active" ? "success" : "warning"}>{item.status}</Badge>
                <span>{item.testMode ? "Test mode" : "Live"}</span>
                <span>{item.publicKey}</span>
              </div>
            </button>
          ))}
        </div>

        <Card title="Deployment detail" subtitle="The selected deployment is used to build the integration snippet and the hosted verification link.">
          <div className="detail-grid">
            <div className="detail-panel">
              <Field label="Name">
                <TextInput value={deployment.name} readOnly />
              </Field>
              <Field label="Webhook URL">
                <TextInput value={deployment.webhookUrl} readOnly />
              </Field>
              <Field label="Allowed origins">
                <TextArea value={deployment.allowedOrigins.join("\n")} readOnly rows={3} />
              </Field>
              <Field label="Redirects">
                <TextArea
                  value={[deployment.successRedirectUrl, deployment.pendingRedirectUrl, deployment.failureRedirectUrl].join("\n")}
                  readOnly
                  rows={4}
                />
              </Field>
            </div>
            <div className="detail-panel">
              <div className="key-stack">
                <div>
                  <span>Public key</span>
                  <strong>{deployment.publicKey}</strong>
                </div>
                <div>
                  <span>Secret hash</span>
                  <strong>{deployment.secretKeyHash}</strong>
                </div>
                <div>
                  <span>Webhook signing secret</span>
                  <strong>{deployment.webhookSecret}</strong>
                </div>
              </div>
              <div className="snippet-card">
                <div className="snippet-header">
                  <strong>Hosted flow URL</strong>
                  <CopyButton text={new URL(`/verify/${hostedFlowId}`, window.location.origin).toString()} label="Copy link" />
                </div>
                <pre>{`POST /api/v1/verification-sessions\nAuthorization: Bearer ${deployment.publicKey}\n\n{\n  "deployment_key": "${deployment.publicKey}",\n  "external_reference": "ref-1001",\n  "subject_email": "person@example.com"\n}`}</pre>
              </div>
              <div className="detail-actions">
                <Button variant="secondary" onClick={() => rotateDeploymentKeys(deployment.id)}>Rotate API key</Button>
                <Button onClick={() => navigate(`/verify/${hostedFlowId}`)}>Preview hosted flow</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <aside className="content-aside">
        <Card title="Credential reveal" subtitle="Secret values are shown once, then hidden again.">
          {state.revealKeyForDeploymentId === deployment.id && state.lastGeneratedSecretKey ? (
            <div className="reveal-box">
              <p>This secret key will not be shown again in a production deployment.</p>
              <div className="secret-pill">{state.lastGeneratedSecretKey}</div>
              <div className="detail-actions">
                <CopyButton text={state.lastGeneratedSecretKey} label="Copy secret" />
                <Button variant="secondary" onClick={dismissRevealKey}>Dismiss</Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Icon name="key" />}
              title="No unrevealed secret"
              description="Create or rotate a deployment to surface the one-time API secret."
              action={<Button onClick={() => setOpen(true)}>Create deployment</Button>}
            />
          )}
        </Card>
      </aside>

      {open && (
        <Dialog title="Create deployment" onClose={() => setOpen(false)}>
          <form
            className="dialog-form"
            onSubmit={(event) => {
              event.preventDefault();
              const result = createDeployment(form);
              setOpen(false);
              navigate(`/app/deployments?created=${result.deploymentId}`);
            }}
          >
            <Field label="Deployment name">
              <TextInput value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} />
            </Field>
            <Field label="Description">
              <TextArea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} rows={3} />
            </Field>
            <Field label="Webhook URL">
              <TextInput value={form.webhookUrl} onChange={(event) => setForm((value) => ({ ...value, webhookUrl: event.target.value }))} />
            </Field>
            <Field label="Webhook secret">
              <TextInput value={form.webhookSecret} onChange={(event) => setForm((value) => ({ ...value, webhookSecret: event.target.value }))} />
            </Field>
            <Field label="Success redirect URL">
              <TextInput value={form.successRedirectUrl} onChange={(event) => setForm((value) => ({ ...value, successRedirectUrl: event.target.value }))} />
            </Field>
            <Field label="Pending redirect URL">
              <TextInput value={form.pendingRedirectUrl} onChange={(event) => setForm((value) => ({ ...value, pendingRedirectUrl: event.target.value }))} />
            </Field>
            <Field label="Failure redirect URL">
              <TextInput value={form.failureRedirectUrl} onChange={(event) => setForm((value) => ({ ...value, failureRedirectUrl: event.target.value }))} />
            </Field>
            <Field label="Allowed origins">
              <TextArea value={form.allowedOrigins.join("\n")} onChange={(event) => setForm((value) => ({ ...value, allowedOrigins: event.target.value.split(/\n+/).filter(Boolean) }))} rows={4} />
            </Field>
            <Field label="Requester name">
              <TextInput value={form.requesterName} onChange={(event) => setForm((value) => ({ ...value, requesterName: event.target.value }))} />
            </Field>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.testMode}
                onChange={(event) => setForm((value) => ({ ...value, testMode: event.target.checked }))}
              />
              <span>Enable test mode</span>
            </label>
            <div className="dialog-actions">
              <Button type="submit">Create deployment</Button>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}

function IntegrationPage({ navigate, deployment }: { navigate: (path: string) => void; deployment: Deployment }) {
  const { state, createVerificationSession } = useWorkspace();
  const hostedFlowId = hostedFlowSessionId(state.sessions);
  const [form, setForm] = React.useState({
    deploymentId: deployment.id,
    externalReference: "ref-1001",
    subjectName: "Jordan Lee",
    subjectEmail: "jordan.lee@example.com",
    subjectPhone: "+1 (868) 555-0146",
    purpose: "onboarding",
  });

  return (
    <div className="content-grid integration-grid">
      <div className="content-main">
        <div className="page-header">
          <div>
            <p className="section-kicker">Integration</p>
            <h1>Generate a session and redirect the user.</h1>
            <p className="page-lead">The preview shows the API shape, a frontend embed, and the signed webhook handshake.</p>
          </div>
          <div className="page-actions">
            <Button variant="secondary" onClick={() => navigate(`/verify/${hostedFlowId}`)}>
              Preview hosted flow
            </Button>
            <Button onClick={() => navigate("/app/verifications")}>Open verifications</Button>
          </div>
        </div>

        <div className="integration-grid-columns">
          <Card title="Create a verification session" subtitle="This form mirrors the payload in the plan.">
            <form
              className="dialog-form"
              onSubmit={(event) => {
                event.preventDefault();
                const id = createVerificationSession(form);
                navigate(`/verify/${id}`);
              }}
            >
              <Field label="Deployment">
                <Select value={form.deploymentId} onChange={(event) => setForm((value) => ({ ...value, deploymentId: event.target.value }))}>
                  {state.deployments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="External reference">
                <TextInput value={form.externalReference} onChange={(event) => setForm((value) => ({ ...value, externalReference: event.target.value }))} />
              </Field>
              <Field label="Subject name">
                <TextInput value={form.subjectName} onChange={(event) => setForm((value) => ({ ...value, subjectName: event.target.value }))} />
              </Field>
              <Field label="Subject email">
                <TextInput value={form.subjectEmail} onChange={(event) => setForm((value) => ({ ...value, subjectEmail: event.target.value }))} />
              </Field>
              <Field label="Subject phone">
                <TextInput value={form.subjectPhone} onChange={(event) => setForm((value) => ({ ...value, subjectPhone: event.target.value }))} />
              </Field>
              <Field label="Purpose">
                <TextInput value={form.purpose} onChange={(event) => setForm((value) => ({ ...value, purpose: event.target.value }))} />
              </Field>
              <div className="dialog-actions">
                <Button type="submit">Create session</Button>
                <Button type="button" variant="secondary" onClick={() => navigate("/app/deployments")}>Back to deployment settings</Button>
              </div>
            </form>
          </Card>
          <Card title="Sample API request" subtitle="Use the deployment key, redirect URLs, and external reference in your backend.">
            <pre className="code-block">{`POST /api/v1/verification-sessions\nAuthorization: Bearer ${deployment.publicKey}\nContent-Type: application/json\n\n{\n  "deployment_key": "${deployment.publicKey}",\n  "external_reference": "${form.externalReference}",\n  "subject_email": "${form.subjectEmail}",\n  "subject_phone": "${form.subjectPhone}",\n  "redirect_success_url": "${deployment.successRedirectUrl}",\n  "redirect_pending_url": "${deployment.pendingRedirectUrl}",\n  "redirect_failure_url": "${deployment.failureRedirectUrl}"\n}`}</pre>
            <div className="copy-row">
              <CopyButton
                text={`POST /api/v1/verification-sessions\nAuthorization: Bearer ${deployment.publicKey}\nContent-Type: application/json\n\n{\n  "deployment_key": "${deployment.publicKey}",\n  "external_reference": "${form.externalReference}",\n  "subject_email": "${form.subjectEmail}",\n  "subject_phone": "${form.subjectPhone}"\n}`}
              />
              <Button variant="secondary" onClick={() => navigate("/legal/privacy")}>
                Review privacy copy
              </Button>
            </div>
          </Card>
        </div>

        <Card title="Webhook verification" subtitle="Keep the callback simple and verify every event before trusting it.">
          <pre className="code-block">{`OpenVerify-Signature: HMAC_SHA256(webhook_secret, timestamp + "." + raw_body)\nOpenVerify-Timestamp: 1718451200\nOpenVerify-Event-Id: evt_01j...`}</pre>
        </Card>
      </div>
      <aside className="content-aside">
        <Card title="Integration notes" subtitle="The preview keeps the implementation brief and practical.">
          <div className="trust-list compact">
            <div><Icon name="lock" /> Private object storage in R2</div>
            <div><Icon name="review" /> Manual review in the dashboard</div>
            <div><Icon name="webhook" /> Signed webhook callbacks</div>
            <div><Icon name="globe" /> Geo IP is a signal, not proof</div>
          </div>
        </Card>
      </aside>
    </div>
  );
}

function ReviewQueuePage({ navigate }: { navigate: (path: string) => void }) {
  const { state } = useWorkspace();
  const queue = state.sessions.filter((session) => ["needs_review", "resubmission_requested"].includes(session.status));
  const selected = queue[0] ?? state.sessions[0];

  return (
    <div className="content-grid overview-grid">
      <div className="content-main">
        <div className="page-header">
          <div>
            <p className="section-kicker">Review queue</p>
            <h1>Fast decisions for the sessions automation could not finish.</h1>
            <p className="page-lead">Review queue items keep the interface sparse and the decision controls obvious.</p>
          </div>
          <div className="page-actions">
            <Button variant="secondary" onClick={() => navigate("/app/verifications")}>Open all verifications</Button>
            <Button onClick={() => navigate("/app/webhooks")}>Webhook history</Button>
          </div>
        </div>

        <Card title="Queue table" subtitle={`${queue.length} sessions are waiting for a human decision.`}>
          <SessionTable compact sessionList={queue} navigate={navigate} />
        </Card>
      </div>
      <aside className="content-aside">{selected ? <SessionDetailPanel session={selected} showDecisionButtons /> : null}</aside>
    </div>
  );
}

function WebhooksPage({ navigate }: { navigate: (path: string) => void }) {
  const { state } = useWorkspace();
  const events = state.sessions.flatMap((session) => session.webhookEvents.map((event) => ({ ...event, sessionId: session.id, deploymentId: session.deploymentId, status: event.status })));

  return (
    <div className="content-grid overview-grid">
      <div className="content-main">
        <div className="page-header">
          <div>
            <p className="section-kicker">Webhooks</p>
            <h1>Delivery history, retries, and failure visibility.</h1>
            <p className="page-lead">The MVP keeps webhook state in the data model so operators can inspect and replay it later.</p>
          </div>
          <div className="page-actions">
            <Button variant="secondary" onClick={() => navigate("/app/integration")}>Webhook signing guide</Button>
            <Button onClick={() => navigate("/app/settings")}>Manage alerts</Button>
          </div>
        </div>

        <Card title="Recent webhook events" subtitle="Pending, sent, failed, and retrying events are represented separately.">
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Session</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Last response</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{event.eventType}</td>
                  <td>{event.sessionId}</td>
                  <td><Badge tone={event.status === "sent" ? "success" : event.status === "failed" ? "danger" : event.status === "retrying" ? "warning" : "neutral"}>{event.status}</Badge></td>
                  <td>{event.attemptCount}</td>
                  <td>{event.lastResponseStatus ?? "—"}</td>
                  <td>{formatRelativeTime(event.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <aside className="content-aside">
        <Card title="Delivery rules" subtitle="Webhook delivery is signed and replay-safe.">
          <div className="trust-list compact">
            <div><Icon name="check" /> Sign every body and timestamp</div>
            <div><Icon name="clock" /> Reject stale requests</div>
            <div><Icon name="review" /> Retry failed events from the queue</div>
            <div><Icon name="alert" /> Surface delivery failures to the operator</div>
          </div>
        </Card>
      </aside>
    </div>
  );
}

function SettingsPage() {
  const { state } = useWorkspace();
  return (
    <div className="content-grid overview-grid">
      <div className="content-main">
        <div className="page-header">
          <div>
            <p className="section-kicker">Settings</p>
            <h1>Workspace and security defaults.</h1>
            <p className="page-lead">Keep the preview focused on the fields that matter most to the MVP.</p>
          </div>
        </div>
        <Card title="Account profile" subtitle="Basic workspace settings for the current account.">
          <div className="detail-grid">
            <div className="detail-panel">
              <Field label="Workspace name">
                <TextInput value={state.accounts[0]?.name ?? ""} readOnly />
              </Field>
              <Field label="Owner">
                <TextInput value={state.profiles[0]?.fullName ?? ""} readOnly />
              </Field>
              <Field label="Role">
                <TextInput value={state.activeRole.replace("_", " ")} readOnly />
              </Field>
            </div>
            <div className="detail-panel">
              <Field label="Support email">
                <TextInput value={state.profiles[0]?.email ?? ""} readOnly />
              </Field>
              <Field label="Default retention">
                <TextInput value="30 - 90 days for raw uploads" readOnly />
              </Field>
              <Field label="Data residency">
                <TextInput value="Cloudflare R2 and Supabase Postgres" readOnly />
              </Field>
            </div>
          </div>
        </Card>
      </div>
      <aside className="content-aside">
        <Card title="Security checklist" subtitle="The product is intentionally opinionated about private data.">
          <div className="trust-list compact">
            <div><Icon name="lock" /> Secret keys shown once</div>
            <div><Icon name="webhook" /> Signed webhooks only</div>
            <div><Icon name="review" /> Audit logs on sensitive actions</div>
            <div><Icon name="globe" /> Allowed origin controls</div>
          </div>
        </Card>
      </aside>
    </div>
  );
}

function PlatformPage() {
  const { state, suspendAccount } = useWorkspace();
  return (
    <div className="content-grid overview-grid">
      <div className="content-main">
        <div className="page-header">
          <div>
            <p className="section-kicker">Platform</p>
            <h1>Super admin oversight.</h1>
            <p className="page-lead">The first account gets full platform visibility, including account suspension and the audit trail.</p>
          </div>
        </div>
        <Card title="Accounts" subtitle="Manage all business accounts in the workspace.">
          <table className="table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.name}</td>
                  <td>{account.slug}</td>
                  <td><Badge tone={account.status === "active" ? "success" : "warning"}>{account.status}</Badge></td>
                  <td>{formatRelativeTime(account.createdAt)}</td>
                  <td>
                    <Button variant="secondary" size="sm" onClick={() => suspendAccount(account.id, account.status === "active")}>{account.status === "active" ? "Suspend" : "Resume"}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <aside className="content-aside">
        <Card title="Platform health" subtitle="Live sample metrics derived from local state.">
          <div className="metric-stack">
            <div><span>Total accounts</span><strong>{state.accounts.length}</strong></div>
            <div><span>Total deployments</span><strong>{state.deployments.length}</strong></div>
            <div><span>Total sessions</span><strong>{state.sessions.length}</strong></div>
            <div><span>Webhook failures</span><strong>{state.sessions.flatMap((item) => item.webhookEvents).filter((item) => item.status === "failed").length}</strong></div>
          </div>
        </Card>
      </aside>
    </div>
  );
}

function AuditPage() {
  const { state } = useWorkspace();
  return (
    <div className="content-grid overview-grid">
      <div className="content-main">
        <div className="page-header">
          <div>
            <p className="section-kicker">Audit logs</p>
            <h1>Append-only event history.</h1>
            <p className="page-lead">Sensitive actions are logged so support and platform staff can trace what happened.</p>
          </div>
        </div>
        <Card title="Recent audit entries" subtitle={`${state.auditLogs.length} logged actions in the workspace.`}>
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>Metadata</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {state.auditLogs.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.action}</td>
                  <td>{entry.entityType}</td>
                  <td>{JSON.stringify(entry.metadata)}</td>
                  <td>{formatRelativeTime(entry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <aside className="content-aside">
        <Card title="Audit scope" subtitle="Every sensitive edit should pass through this trail.">
          <div className="trust-list compact">
            <div><Icon name="shield" /> Account and profile changes</div>
            <div><Icon name="key" /> Credential rotation</div>
            <div><Icon name="review" /> Manual verification decisions</div>
            <div><Icon name="webhook" /> Webhook failure events</div>
          </div>
        </Card>
      </aside>
    </div>
  );
}

function LogsPage() {
  return <AuditPage />;
}

function VerificationPage({ navigate, sessionId }: { navigate: (path: string) => void; sessionId: string }) {
  const { state, saveCaptureFile, loadSampleCaptures, clearCapture, startVerificationProcessing } = useWorkspace();
  const session = useSession(sessionId) ?? state.sessions[0];
  const [consent, setConsent] = React.useState(Boolean(session?.consentedAt));
  const [processing, setProcessing] = React.useState(false);
  const idFrontInput = React.useRef<HTMLInputElement | null>(null);
  const selfieInput = React.useRef<HTMLInputElement | null>(null);

  const idFront = session?.assets.id_front;
  const selfie = session?.assets.selfie;

  const checks = React.useMemo(() => captureChecks(idFront, selfie), [idFront, selfie]);

  const canContinue = consent && Boolean(idFront) && Boolean(selfie) && !processing;

  React.useEffect(() => {
    if (!processing || !session) {
      return;
    }
    const timer = window.setTimeout(() => {
      void startVerificationProcessing(session.id).then(() => {
        setProcessing(false);
      });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [processing, session, startVerificationProcessing]);

  if (!session) {
    return (
      <div className="page-shell verification-shell">
        <EmptyState icon={<Icon name="alert" />} title="Session not found" description="Use one of the sample verification sessions from the dashboard." action={<Button onClick={() => navigate("/app")}>Open dashboard</Button>} />
      </div>
    );
  }

  const resultStatus = session.status === "verified" || session.status === "needs_review" || session.status === "rejected" || session.status === "resubmission_requested" ? session.status : null;

  return (
    <div className="page-shell verification-shell">
      <header className="public-header verification-header">
        <button className="brand" onClick={() => navigate("/app")}>
          <span className="brand-mark">
            <Icon name="shield" />
          </span>
          <span>
            <strong>OpenVerify</strong>
            <small>Hosted verification</small>
          </span>
        </button>
        <button className="help-link" onClick={() => navigate("/legal/privacy")}>
          <Icon name="help" />
          Need help?
        </button>
      </header>

      <main className="verification-grid">
        <section className="verification-copy">
          <h1>Confirm your identification</h1>
          <div className="lead-divider" />
          <p className="requester-line">{session.requesterName} is requesting verification</p>
          <p className="purpose-line">Purpose: {session.purpose}</p>

          <div className="info-block">
            <h2>What we collect</h2>
            <p>To verify your identity, we will collect the following information and share it with {session.requesterName}:</p>
            <ul>
              <li>Information from your Trinidad and Tobago ID card (front)</li>
              <li>Your selfie</li>
              <li>Name, date of birth, and ID number</li>
              <li>Verification result and time of verification</li>
            </ul>
          </div>

          <div className="privacy-panel">
            <Icon name="shield" />
            <p>Your information is protected and used only for identity verification. We do not use it for anything else.</p>
          </div>

          <label className="checkbox-row consent-row">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>I understand and consent to this identity verification</span>
          </label>

          <div className="leave-row">
            <Icon name="lock" />
            <button onClick={() => navigate("/app")}>You can leave and come back later</button>
          </div>
        </section>

        <section className="verification-form">
          <div className="stepper">
            <div className={classNames("step", idFront ? "is-complete" : "is-active")}>
              <span>1</span>
              <div>
                <strong>Front of ID card</strong>
                <small>{idFront ? "Uploaded" : "Not started"}</small>
              </div>
            </div>
            <div className={classNames("step", selfie ? "is-complete" : "is-muted")}>
              <span>2</span>
              <div>
                <strong>Selfie</strong>
                <small>{selfie ? "Uploaded" : "Not started"}</small>
              </div>
            </div>
          </div>

          <div className="capture-columns">
            <CaptureCard
              title="Front of ID card"
              description="Upload a clear photo of the front of your Trinidad and Tobago ID card."
              icon="file"
              asset={idFront}
              onPick={() => idFrontInput.current?.click()}
              onClear={() => clearCapture(session.id, "id_front")}
              checks={checks.idChecks}
            />
            <CaptureCard
              title="Selfie"
              description="Take a clear selfie. Your face should be clearly visible."
              icon="user"
              asset={selfie}
              onPick={() => selfieInput.current?.click()}
              onClear={() => clearCapture(session.id, "selfie")}
              checks={checks.selfieChecks}
            />
          </div>

          <div className="verification-footer">
            <div className="verification-tips">
              <div>
                <Icon name="alert" />
                All corners must be visible
              </div>
              <div>
                <Icon name="check" />
                Text must be legible
              </div>
              <div>
                <Icon name="camera" />
                Face clearly visible and centered
              </div>
            </div>
            <div className="verification-actions">
              <Button variant="secondary" onClick={() => loadSampleCaptures(session.id)}>Load sample captures</Button>
              <Button
                disabled={!canContinue}
                onClick={() => {
                  if (!session) {
                    return;
                  }
                  setProcessing(true);
                  void startVerificationProcessing(session.id).then(() => setProcessing(false));
                }}
              >
                {processing ? "Processing..." : "Continue"}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <input
        ref={idFrontInput}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) {
            await saveCaptureFile(session.id, "id_front", file);
          }
          event.currentTarget.value = "";
        }}
      />
      <input
        ref={selfieInput}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) {
            await saveCaptureFile(session.id, "selfie", file);
          }
          event.currentTarget.value = "";
        }}
      />

      {processing && (
        <Dialog title="Processing verification" onClose={() => setProcessing(false)}>
          <div className="processing-card">
            <p>Running image checks, OCR validation, face comparison, register matching, and score calculation.</p>
            <div className="processing-grid">
              <div>
                <span>Layout</span>
                <strong>{checks.idChecks[2].pass ? "Passing" : "Review"}</strong>
              </div>
              <div>
                <span>Face</span>
                <strong>{checks.selfieChecks[0].pass ? "Passing" : "Review"}</strong>
              </div>
              <div>
                <span>Register</span>
                <strong>{checks.idChecks[5].pass ? "Passing" : "Review"}</strong>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {resultStatus && (
        <Dialog title={resultLabel(resultStatus)} onClose={() => navigate("/app")}>
          <div className="result-stack">
            <Badge tone={resultTone(resultStatus)}>{resultStatus.replace("_", " ")}</Badge>
            <p>{session.decisionReason}</p>
            <div className="result-score">
              <span>Overall score</span>
              <strong>{formatNumber(session.score)} / 100</strong>
            </div>
            <div className="result-actions">
              <Button onClick={() => navigate("/app")}>Return to dashboard</Button>
              <Button variant="secondary" onClick={() => navigate(`/app/verifications?session=${session.id}`)}>Open session detail</Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function CaptureCard({
  title,
  description,
  icon,
  asset,
  onPick,
  onClear,
  checks,
}: {
  title: string;
  description: string;
  icon: "file" | "user" | "camera";
  asset?: VerificationAsset;
  onPick: () => void;
  onClear: () => void;
  checks: Array<{ pass: boolean; label: string; helper: string }>;
}) {
  return (
    <div className="capture-card">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="capture-dropzone">
        {asset?.previewDataUrl ? (
          <img src={asset.previewDataUrl} alt={title} />
        ) : (
          <div className="capture-placeholder">
            <Icon name={icon} />
            <strong>No file yet</strong>
            <span>Click to upload or drag and drop</span>
          </div>
        )}
        <div className="capture-actions">
          <Button variant="secondary" size="sm" onClick={onPick}>
            {asset ? "Replace" : "Upload"}
          </Button>
          {asset ? (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <div className="capture-status">
        <div className="capture-status-row">
          <Icon name={asset ? "check" : "alert"} />
          <span>{asset ? `${asset.name} · ${formatBytes(asset.sizeBytes)}` : "Waiting for upload"}</span>
        </div>
        <div className="capture-checks">
          {checks.map((check) => (
            <div key={check.label} className={classNames("capture-check", check.pass ? "is-pass" : "is-fail")}>
              <Icon name={check.pass ? "check" : "alert"} />
              <div>
                <strong>{check.label}</strong>
                <p>{check.helper}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function resultLabel(status: SessionStatus) {
  if (status === "verified") return "Verified successfully";
  if (status === "needs_review") return "Manual review required";
  if (status === "rejected") return "Verification rejected";
  return "Resubmission requested";
}

function resultTone(status: SessionStatus) {
  if (status === "verified") return "success" as const;
  if (status === "rejected") return "danger" as const;
  return "warning" as const;
}

function captureChecks(idFront?: VerificationAsset, selfie?: VerificationAsset) {
  const idAspect = idFront ? idFront.width / idFront.height : 0;
  const selfieAspect = selfie ? selfie.width / selfie.height : 0;
  return {
    idChecks: [
      checkItem(Boolean(idFront), "File type", "Image uploaded."),
      checkItem(Boolean(idFront && idFront.sizeBytes < 10_000_000), "File size", "Under the 10MB limit."),
      checkItem(Boolean(idFront && idAspect > 1.35 && idAspect < 1.85), "Image sharpness", "Looks crisp enough for review."),
      checkItem(Boolean(idFront && idFront.quality !== "poor"), "Lighting", "Not too dark or washed out."),
      checkItem(Boolean(idFront && idAspect > 1.45 && idAspect < 1.75), "Card boundary visible", "Frame appears complete."),
      checkItem(Boolean(idFront && idFront.width >= 900), "Likely TT layout", "Matches the expected TT ID proportions."),
      checkItem(Boolean(idFront && idFront.width >= 900 && idFront.height >= 600), "Required visual zones", "Name, photo, and ID zones are likely present."),
    ],
    selfieChecks: [
      checkItem(Boolean(selfie && selfie.width > 700), "Face visible", "A face-sized capture is present."),
      checkItem(Boolean(selfie && selfie.sizeBytes < 10_000_000), "File size", "Under the 10MB limit."),
      checkItem(Boolean(selfie && selfie.quality !== "poor"), "Image quality", "Not overly blurry or dark."),
      checkItem(Boolean(selfie && selfieAspect > 0.75 && selfieAspect < 1.2), "Face centered", "The crop looks like a normal portrait frame."),
      checkItem(Boolean(selfie && selfie.width >= 800), "Lighting", "Enough detail to compare."),
    ],
  };
}

function checkItem(pass: boolean, label: string, helper: string) {
  return { pass, label, helper };
}

function SessionTable({
  sessionList,
  navigate,
  compact = false,
}: {
  sessionList: VerificationSession[];
  navigate: (path: string) => void;
  compact?: boolean;
}) {
  const showDetailColumns = !compact;

  return (
    <div className={classNames("session-table-wrapper", compact && "is-compact")}>
      <table className="table session-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>External reference</th>
            <th>Deployment</th>
            <th>Status</th>
            <th>Score</th>
            {showDetailColumns ? <th>Name extracted</th> : null}
            {showDetailColumns ? <th>Review flag</th> : null}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessionList.map((session) => (
            <tr key={session.id}>
              <td>{formatRelativeTime(session.createdAt)}</td>
              <td>{session.externalReference}</td>
              <td>{session.requesterName}</td>
              <td>
                <Badge tone={statusTone(session.status)}>{session.status.replace("_", " ")}</Badge>
              </td>
              <td>{session.score}</td>
              {showDetailColumns ? <td>{session.extractedData.fullName}</td> : null}
              {showDetailColumns ? <td>{session.riskFlags.length ? session.riskFlags[0].replaceAll("-", " ") : "None"}</td> : null}
              <td>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/app/verifications?session=${session.id}`)}>
                  Open
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {compact ? (
        <div className="session-cards">
          {sessionList.map((session) => (
            <article key={session.id} className="session-card">
              <div className="session-card-header">
                <div>
                  <span className="session-card-kicker">External reference</span>
                  <strong>{session.externalReference}</strong>
                  <p>
                    {formatRelativeTime(session.createdAt)} · {session.requesterName}
                  </p>
                </div>
                <Badge tone={statusTone(session.status)}>{session.status.replace("_", " ")}</Badge>
              </div>
              <div className="session-card-grid">
                <div>
                  <span>Date</span>
                  <strong>{formatRelativeTime(session.createdAt)}</strong>
                </div>
                <div>
                  <span>Deployment</span>
                  <strong>{session.requesterName}</strong>
                </div>
                <div>
                  <span>Score</span>
                  <strong>{session.score}</strong>
                </div>
                <div>
                  <span>Review flag</span>
                  <strong>{session.riskFlags.length ? session.riskFlags[0].replaceAll("-", " ") : "None"}</strong>
                </div>
                <div>
                  <span>Name extracted</span>
                  <strong>{session.extractedData.fullName}</strong>
                </div>
              </div>
              <div className="session-card-actions">
                <Button variant="secondary" size="sm" onClick={() => navigate(`/app/verifications?session=${session.id}`)}>
                  Open
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SessionDetailPanel({ session, compact = false, showDecisionButtons = false }: { session: VerificationSession; compact?: boolean; showDecisionButtons?: boolean }) {
  const { applyDecision } = useWorkspace();
  const [reason, setReason] = React.useState(
    session.decisionReason || "Manual review confirmed the ID data and selfie were acceptable.",
  );

  React.useEffect(() => {
    setReason(session.decisionReason || "Manual review confirmed the ID data and selfie were acceptable.");
  }, [session.id, session.decisionReason]);

  return (
    <Card className={classNames("detail-shell", compact && "is-compact")} title={`Verification #${session.id}`} subtitle={session.requesterName}>
      <div className="detail-meta-grid">
        <div>
          <span>Deployment</span>
          <strong>{session.requesterName}</strong>
        </div>
        <div>
          <span>Submitted</span>
          <strong>{formatDateTime(session.createdAt)}</strong>
        </div>
        <div>
          <span>Applicant</span>
          <strong>{session.subjectName}</strong>
        </div>
        <div>
          <span>Date of birth</span>
          <strong>{session.extractedData.dateOfBirth}</strong>
        </div>
        <div>
          <span>Document</span>
          <strong>Trinidad and Tobago ID Card</strong>
        </div>
      </div>

      <div className="asset-stack">
        <div className="asset-frame">
          <div className="asset-label">ID card</div>
          {session.assets.id_front?.previewDataUrl ? (
            <img src={session.assets.id_front.previewDataUrl} alt="ID card preview" />
          ) : (
            <div className="asset-placeholder"><Icon name="file" /></div>
          )}
        </div>
        <div className="asset-frame">
          <div className="asset-label">Selfie</div>
          {session.assets.selfie?.previewDataUrl ? (
            <img src={session.assets.selfie.previewDataUrl} alt="Selfie preview" />
          ) : (
            <div className="asset-placeholder"><Icon name="camera" /></div>
          )}
        </div>
      </div>

      <div className="score-panel">
        <div className="score-header">
          <strong>Score</strong>
          <span>{session.score}/100</span>
        </div>
        {[
          ["Overall", session.score],
          ["Document authenticity", session.scoreBreakdown.idLayoutConfidence],
          ["Face match", session.scoreBreakdown.faceMatchScore],
          ["OCR confidence", session.scoreBreakdown.ocrConfidence],
          ["Register match", session.scoreBreakdown.electoralRegisterMatch],
          ["Geo proximity", session.scoreBreakdown.ipGeolocationProximity],
        ].map(([label, value]) => (
          <div key={label as string} className="score-row">
            <span>{label as string}</span>
            <ProgressBar value={value as number} tone={scoreTone(value as number)} />
            <strong>{value as number}/100</strong>
          </div>
        ))}
      </div>

      <div className="score-breakdown">
        <div>
          <span>Extracted name</span>
          <strong>{session.extractedData.fullName}</strong>
        </div>
        <div>
          <span>ID number</span>
          <strong>{session.extractedData.idNumber}</strong>
        </div>
        <div>
          <span>Address</span>
          <strong>{session.extractedData.addressText}</strong>
        </div>
        <div>
          <span>Electoral register</span>
          <strong>{session.electoralMatch.matched ? "Matched" : "No automatic match"}</strong>
        </div>
        <div>
          <span>Face compare</span>
          <strong>{session.faceMatch.matchScore}/100</strong>
        </div>
        <div>
          <span>Geo IP result</span>
          <strong>{session.geoResult.city}, {session.geoResult.country}</strong>
        </div>
      </div>

      <div className="timeline">
        <div className="timeline-header">
          <strong>Timeline</strong>
          <span>{session.timeline.length} entries</span>
        </div>
        {session.timeline.slice(0, compact ? 4 : 8).map((item) => (
          <div key={item.id} className={classNames("timeline-item", `tone-${item.tone}`)}>
            <span className="timeline-dot" />
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
              <small>{formatRelativeTime(item.createdAt)}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="webhook-history">
        <div className="timeline-header">
          <strong>Webhook history</strong>
          <span>{session.webhookEvents.length} events</span>
        </div>
        {session.webhookEvents.slice(0, 4).map((event) => (
          <div key={event.id} className="webhook-row">
            <div>
              <strong>{event.eventType}</strong>
              <p>{event.status}</p>
            </div>
            <span>{event.attemptCount} attempts</span>
          </div>
        ))}
      </div>

      <div className="decision-panel">
        <textarea className="input textarea" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
        <div className="decision-actions">
          {showDecisionButtons ? (
            <>
              <Button onClick={() => applyDecision(session.id, "verified", reason)}>Approve</Button>
              <Button variant="danger" onClick={() => applyDecision(session.id, "rejected", reason)}>Reject</Button>
              <Button variant="secondary" onClick={() => applyDecision(session.id, "resubmission_requested", reason)}>Request resubmission</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => applyDecision(session.id, "verified", reason)}>Mark verified</Button>
              <Button variant="secondary" onClick={() => applyDecision(session.id, "needs_review", reason)}>Keep pending</Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function MiniSparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const width = 180;
  const height = 54;
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * width;
    const y = height - ((value - min) / Math.max(1, max - min)) * (height - 8) - 4;
    return [x, y] as const;
  });
  const path = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x},${y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="dialog-card" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-header">
          <strong>{title}</strong>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function publicNavigate(event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, navigate: (path: string) => void, path: string) {
  event.preventDefault();
  navigate(path);
}

function dashboardSectionsForRole(role: "super_admin" | "admin" | "reviewer") {
  const base = [
    { key: "overview", label: "Overview", icon: "home", path: "/app" },
    { key: "verifications", label: "Verifications", icon: "review", path: "/app/verifications" },
    { key: "deployments", label: "Deployments", icon: "stack", path: "/app/deployments" },
    { key: "integration", label: "Integration", icon: "code", path: "/app/integration" },
    { key: "review", label: "Review Queue", icon: "review", path: "/app/review" },
    { key: "webhooks", label: "Webhooks", icon: "webhook", path: "/app/webhooks" },
    { key: "settings", label: "Settings", icon: "settings", path: "/app/settings" },
  ] as const;
  const platform = [
    { key: "platform", label: "Platform", icon: "globe", path: "/app/platform" },
    { key: "audit", label: "Audit logs", icon: "clock", path: "/app/audit" },
  ] as const;
  if (role === "super_admin") {
    return [...base, ...platform];
  }
  if (role === "reviewer") {
    return base.filter((item) => ["overview", "verifications", "review", "webhooks"].includes(item.key));
  }
  return base;
}

function sectionFromRoute(route: string) {
  const mapping: Record<string, { key: string; path: string }> = {
    "/app": { key: "overview", path: "/app" },
    "/app/verifications": { key: "verifications", path: "/app/verifications" },
    "/app/deployments": { key: "deployments", path: "/app/deployments" },
    "/app/integration": { key: "integration", path: "/app/integration" },
    "/app/review": { key: "review", path: "/app/review" },
    "/app/webhooks": { key: "webhooks", path: "/app/webhooks" },
    "/app/settings": { key: "settings", path: "/app/settings" },
    "/app/platform": { key: "platform", path: "/app/platform" },
    "/app/audit": { key: "audit", path: "/app/audit" },
    "/app/logs": { key: "logs", path: "/app/logs" },
  };
  return mapping[route] ?? mapping["/app"];
}

function statusTone(status: SessionStatus) {
  if (status === "verified") return "success" as const;
  if (status === "needs_review" || status === "resubmission_requested" || status === "processing") return "warning" as const;
  if (status === "rejected" || status === "error") return "danger" as const;
  return "neutral" as const;
}

function scoreTone(score: number) {
  if (score >= 85) return "success" as const;
  if (score >= 60) return "warning" as const;
  return "danger" as const;
}
