import { toDataUrl } from "./utils";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function makeSampleIdCardSvg(options: {
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  addressText: string;
}) {
  const name = escapeXml(options.fullName);
  const idNumber = escapeXml(options.idNumber);
  const dob = escapeXml(options.dateOfBirth);
  const address = escapeXml(options.addressText);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f4f7f8" />
        <stop offset="100%" stop-color="#ebf0f3" />
      </linearGradient>
      <linearGradient id="chip" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f4c04d" />
        <stop offset="100%" stop-color="#cf9e25" />
      </linearGradient>
      <linearGradient id="portrait" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3c4a59" />
        <stop offset="100%" stop-color="#102131" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="14" stdDeviation="20" flood-color="#7f8c95" flood-opacity=".18"/>
      </filter>
    </defs>
    <rect width="1200" height="760" fill="url(#bg)"/>
    <rect x="54" y="52" rx="34" ry="34" width="1092" height="656" fill="#fff" filter="url(#shadow)"/>
    <rect x="78" y="76" rx="28" ry="28" width="1044" height="608" fill="#f8fbfc" stroke="#d7e1e7"/>
    <path d="M88 176 C 280 96, 380 76, 590 104 S 982 152, 1112 96 L 1112 684 L 88 684 Z" fill="#f1f5f7"/>
    <circle cx="1002" cy="146" r="92" fill="#ead9cb" opacity=".55"/>
    <path d="M0 0 L 0 0" fill="none"/>
    <text x="112" y="130" font-size="28" font-family="Manrope, Arial, sans-serif" font-weight="800" fill="#17313c">Republic of Trinidad and Tobago</text>
    <text x="112" y="162" font-size="20" font-family="Manrope, Arial, sans-serif" font-weight="700" fill="#47616d">National Identification Card</text>
    <text x="112" y="232" font-size="18" font-family="IBM Plex Mono, monospace" fill="#6b7f87">NAME</text>
    <text x="112" y="274" font-size="42" font-family="Manrope, Arial, sans-serif" font-weight="800" fill="#17313c">${name}</text>
    <text x="112" y="332" font-size="18" font-family="IBM Plex Mono, monospace" fill="#6b7f87">DATE OF BIRTH</text>
    <text x="112" y="366" font-size="30" font-family="Manrope, Arial, sans-serif" font-weight="700" fill="#17313c">${dob}</text>
    <text x="112" y="424" font-size="18" font-family="IBM Plex Mono, monospace" fill="#6b7f87">ID NUMBER</text>
    <text x="112" y="458" font-size="34" font-family="Manrope, Arial, sans-serif" font-weight="800" fill="#17313c">${idNumber}</text>
    <text x="112" y="520" font-size="18" font-family="IBM Plex Mono, monospace" fill="#6b7f87">ADDRESS</text>
    <text x="112" y="554" font-size="27" font-family="Manrope, Arial, sans-serif" font-weight="700" fill="#17313c">${address}</text>
    <rect x="872" y="304" width="196" height="228" rx="24" fill="url(#portrait)"/>
    <path d="M 942 382 c 0 -38 29 -68 66 -68 s 66 30 66 68 -29 68 -66 68 -66 -30 -66 -68z" fill="#d7b59e"/>
    <path d="M 894 512 c 24 -58 67 -86 114 -86 s 90 28 114 86" fill="none" stroke="#d7b59e" stroke-width="44" stroke-linecap="round"/>
    <circle cx="1008" cy="390" r="48" fill="#0f1f2a" opacity=".18"/>
    <rect x="100" y="608" width="300" height="24" rx="12" fill="#d6e1e6"/>
    <rect x="100" y="608" width="186" height="24" rx="12" fill="#159b96"/>
    <rect x="702" y="146" width="150" height="104" rx="18" fill="url(#chip)"/>
    <path d="M 745 170 h 64 v 58 h -64 z" fill="#f4e1a4" opacity=".7"/>
    <path d="M 763 182 h 28 M 763 198 h 42 M 763 214 h 34" stroke="#5e4811" stroke-width="6" stroke-linecap="round" fill="none"/>
    <text x="711" y="278" font-size="16" font-family="IBM Plex Mono, monospace" fill="#7d8f97">TT ID CARD</text>
    <text x="711" y="306" font-size="16" font-family="IBM Plex Mono, monospace" fill="#7d8f97">SECURE / HOSTED REVIEW</text>
  </svg>`;
  return toDataUrl(svg);
}

export function makeSampleSelfieSvg(options: { initials: string; accent?: string }) {
  const initials = escapeXml(options.initials);
  const accent = options.accent ?? "#0f7e82";
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f5f7f8" />
        <stop offset="100%" stop-color="#e9eff2" />
      </linearGradient>
      <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#112231" />
        <stop offset="100%" stop-color="#182f42" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="14" stdDeviation="20" flood-color="#7f8c95" flood-opacity=".18"/>
      </filter>
    </defs>
    <rect width="1200" height="1200" fill="url(#bg)"/>
    <rect x="140" y="120" rx="92" ry="92" width="920" height="960" fill="#ffffff" filter="url(#shadow)"/>
    <circle cx="600" cy="420" r="154" fill="#d7b59e"/>
    <path d="M 394 894 c 0 -164 104 -260 206 -260 s 206 96 206 260" fill="url(#shirt)"/>
    <path d="M 462 430 c 0 -82 61 -144 138 -144 s 138 62 138 144 -61 144 -138 144 -138 -62 -138 -144z" fill="#0f1822" opacity=".26"/>
    <path d="M 486 426 c 12 -98 66 -154 114 -154 s 102 56 114 154" fill="#3d4a57"/>
    <circle cx="540" cy="418" r="14" fill="#0f1f2a"/>
    <circle cx="660" cy="418" r="14" fill="#0f1f2a"/>
    <path d="M 548 482 c 20 22 82 22 104 0" fill="none" stroke="#0f1f2a" stroke-width="10" stroke-linecap="round"/>
    <circle cx="600" cy="980" r="126" fill="${accent}" opacity=".16"/>
    <text x="600" y="1006" text-anchor="middle" font-size="76" font-family="Manrope, Arial, sans-serif" font-weight="800" fill="#17313c">${initials}</text>
    <circle cx="876" cy="282" r="22" fill="${accent}"/>
    <rect x="854" y="612" width="112" height="14" rx="7" fill="#d6e1e6"/>
    <rect x="854" y="648" width="192" height="14" rx="7" fill="#d6e1e6"/>
    <rect x="854" y="684" width="140" height="14" rx="7" fill="#d6e1e6"/>
  </svg>`;
  return toDataUrl(svg);
}
