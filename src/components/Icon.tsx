import type { ReactNode, SVGProps } from "react";

type IconName =
  | "shield"
  | "home"
  | "stack"
  | "code"
  | "review"
  | "webhook"
  | "settings"
  | "bell"
  | "help"
  | "search"
  | "copy"
  | "check"
  | "alert"
  | "clock"
  | "camera"
  | "user"
  | "file"
  | "key"
  | "chart"
  | "globe"
  | "lock"
  | "plus"
  | "logout"
  | "chevron-right"
  | "chevron-down"
  | "arrow-right"
  | "external"
  | "info"
  | "spark"
  | "x";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

const paths: Record<IconName, ReactNode> = {
  shield: (
    <path d="M12 3 20 6.5v5.1c0 4.5-3 8.6-8 9.9-5-1.3-8-5.4-8-9.9V6.5L12 3Z" />
  ),
  home: (
    <>
      <path d="m4 11 8-7 8 7" />
      <path d="M6 10.5V20h12v-9.5" />
    </>
  ),
  stack: (
    <>
      <path d="M12 4 3 8l9 4 9-4-9-4Z" />
      <path d="m3 12 9 4 9-4" />
      <path d="m3 16 9 4 9-4" />
    </>
  ),
  code: (
    <>
      <path d="m9 18-6-6 6-6" />
      <path d="m15 6 6 6-6 6" />
    </>
  ),
  review: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2.5" />
      <path d="M8 9h8M8 13h5" />
      <path d="M8 17h8" />
    </>
  ),
  webhook: (
    <>
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 11.2 16 7.2" />
      <path d="M8 12.8 16 16.8" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="m19 12-2.2-.6.2-2.2-2-1.2-1.5 1.7-2.5-1-1.5-2-2.4 1 .3 2.2L5 12l2.2.6-.2 2.2 2 1.2 1.5-1.7 2.5 1 1.5 2 2.4-1-.3-2.2L19 12Z" />
    </>
  ),
  bell: (
    <>
      <path d="M15 17.5a3 3 0 0 1-6 0" />
      <path d="M18 16H6c1.8-2 2.5-4.5 2.5-7.5a3.5 3.5 0 1 1 7 0c0 3 .7 5.5 2.5 7.5Z" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.7 9.2a2.5 2.5 0 1 1 4.6 1.3c-.8 1.2-1.9 1.4-1.9 3.1" />
      <path d="M12 17h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="5.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="10" height="10" rx="2" />
      <rect x="5" y="5" width="10" height="10" rx="2" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  alert: (
    <>
      <path d="M12 4 3.6 18h16.8L12 4Z" />
      <path d="M12 9v4" />
      <path d="M12 16h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  camera: (
    <>
      <rect x="4" y="7" width="16" height="10" rx="2.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M8 7 9.5 5h5L16 7" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 19c1.5-3 4.1-4.5 6.5-4.5s5 1.5 6.5 4.5" />
    </>
  ),
  file: (
    <>
      <path d="M8 3h5l5 5v13H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M13 3v5h5" />
    </>
  ),
  key: (
    <>
      <circle cx="8.5" cy="11.5" r="3.5" />
      <path d="M11.5 11.5H19l-2 2 2 2" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19h16" />
      <path d="M6 17V11" />
      <path d="M12 17V7" />
      <path d="M18 17V13" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.5 2.3 4 5.5 4 8.5s-1.5 6.2-4 8.5" />
      <path d="M12 3.5c-2.5 2.3-4 5.5-4 8.5s1.5 6.2 4 8.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="10" width="13" height="9" rx="2.5" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  logout: (
    <>
      <path d="M10 17H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </>
  ),
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "arrow-right": <path d="M5 12h14m-6-6 6 6-6 6" />,
  external: (
    <>
      <path d="M14 5h5v5" />
      <path d="M10 14 19 5" />
      <path d="M5 7v12h12" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>
  ),
  spark: (
    <path d="M4 15c2.4 0 3.1-5 5.1-5s2.4 3.8 4.1 3.8S15.8 8 18 8" />
  ),
  x: (
    <>
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </>
  ),
};

export function Icon({ name, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
