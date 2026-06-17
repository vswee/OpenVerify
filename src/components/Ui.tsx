import React from "react";
import { classNames } from "../lib/utils";
import { Icon } from "./Icon";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={classNames("button", `button-${variant}`, `button-${size}`, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  tone = "neutral",
  children,
  className,
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return (
    <span className={classNames("badge", `badge-${tone}`, className)}>
      {children}
    </span>
  );
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={classNames("card", className)}>
      {(title || subtitle || action) && (
        <header className="card-header">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="card-action">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={classNames("field", className)}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="input" {...props} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="input textarea" {...props} />;
}

export function Split({
  left,
  right,
  className,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
}) {
  return <div className={classNames("split", className)}>{left}{right}</div>;
}

export function StatCard({
  title,
  value,
  subtext,
  tone = "neutral",
  sparkline,
}: {
  title: string;
  value: string;
  subtext: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  sparkline?: React.ReactNode;
}) {
  return (
    <div className={classNames("metric-card", `metric-card-${tone}`)}>
      <div className="metric-card-copy">
        <div className="metric-card-title">{title}</div>
        <div className="metric-card-value">{value}</div>
        <div className="metric-card-subtext">{subtext}</div>
      </div>
      {sparkline && <div className="metric-card-chart">{sparkline}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
    >
      <Icon name="copy" className="icon icon-inline" />
      {copied ? "Copied" : label}
    </Button>
  );
}

export function LinkButton({
  href,
  children,
  className,
  onClick,
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { onClick?: React.MouseEventHandler<HTMLAnchorElement> }) {
  return (
    <a href={href} className={classNames("link-button", className)} onClick={onClick}>
      {children}
    </a>
  );
}

export function ProgressBar({ value, tone = "neutral" }: { value: number; tone?: "neutral" | "success" | "warning" | "danger" }) {
  return (
    <div className={classNames("progress", `progress-${tone}`)} aria-label={`Progress ${value}%`}>
      <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

