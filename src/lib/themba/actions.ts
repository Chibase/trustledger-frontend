import type { ThembaLink } from "@/lib/themba/knowledge";
import type { ThembaProfile } from "@/lib/themba/profile";

export type ThembaAction = ThembaLink & {
  kind?: "primary" | "secondary";
};

export type ThembaChip = {
  id: string;
  label: string;
  prompt: string;
};

/** Always-on conversion bar inside the chat window. */
export const THEMBA_CONVERSION_ACTIONS: ThembaAction[] = [
  { href: "/trial", label: "Start 14-day trial", kind: "primary" },
  { href: "/contact", label: "Book live demo", kind: "secondary" },
  { href: "/contact", label: "Contact advisory team", kind: "secondary" },
];

export const THEMBA_PROFILE_CHIPS: ThembaChip[] = [
  {
    id: "funder",
    label: "I'm a funder",
    prompt: "I'm a funder — how does TrustLedger help with risk and reporting?",
  },
  {
    id: "engineer",
    label: "I'm an engineer",
    prompt:
      "I'm a civil engineer — how does TrustLedger help keep delivery on track?",
  },
  {
    id: "project_manager",
    label: "I'm a project manager",
    prompt:
      "I'm a project manager — how do I log grievances and keep commitments visible?",
  },
  {
    id: "municipal",
    label: "I work in a municipality",
    prompt:
      "I'm a municipal leader — how does TrustLedger support public-sector SRM?",
  },
];

export const THEMBA_STARTER_CHIPS: ThembaChip[] = [
  {
    id: "features",
    label: "Explore SRM features",
    prompt: "What are the features of this product?",
  },
  {
    id: "framework",
    label: "Social licence framework",
    prompt: "What is the Social Licence to Build framework?",
  },
  {
    id: "readiness",
    label: "Is it a fit?",
    prompt: "How do I know if TrustLedger is suitable for us?",
  },
];

const PROFILE_ACTIONS: Record<ThembaProfile, ThembaAction[]> = {
  funder: [
    { href: "/product", label: "Explore funder reporting", kind: "secondary" },
    { href: "/resources", label: "Compliance checklists", kind: "secondary" },
  ],
  engineer: [
    { href: "/product", label: "SRM feature overview", kind: "secondary" },
    {
      href: "/resources/grievance-checklist",
      label: "Grievance checklist",
      kind: "secondary",
    },
  ],
  project_manager: [
    { href: "/product", label: "Case desk & commitments", kind: "secondary" },
    { href: "/assessment", label: "Readiness check", kind: "secondary" },
  ],
  municipal: [
    { href: "/assessment", label: "Public-sector readiness", kind: "secondary" },
    { href: "/product", label: "ZA place context", kind: "secondary" },
  ],
  other: [
    { href: "/product", label: "Product overview", kind: "secondary" },
    { href: "/assessment", label: "Readiness check", kind: "secondary" },
  ],
};

export function conversionActionsFor(
  profile: ThembaProfile | null,
): ThembaAction[] {
  const extra = profile ? PROFILE_ACTIONS[profile] : [];
  const seen = new Set<string>();
  const out: ThembaAction[] = [];
  for (const a of [...THEMBA_CONVERSION_ACTIONS, ...extra]) {
    const key = `${a.href}:${a.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

export function followUpChipsFor(
  profile: ThembaProfile | null,
  topicId?: string,
): ThembaChip[] {
  const common: ThembaChip[] = [
    {
      id: "trial",
      label: "Start a trial",
      prompt: "How do I start a 14-day trial?",
    },
    {
      id: "demo",
      label: "Book a demo",
      prompt: "I want to book a live demo with the advisory team.",
    },
  ];

  if (topicId === "features" || topicId === "srm-guide") {
    return [
      {
        id: "grievance",
        label: "Grievance logging",
        prompt: "How does grievance logging and rapid-response workflow work?",
      },
      {
        id: "dashboards",
        label: "Impact dashboards",
        prompt: "How do impact dashboards and reports work for boards and funders?",
      },
      ...common,
    ];
  }

  if (profile === "funder") {
    return [
      {
        id: "roi",
        label: "ROI & risk",
        prompt: "What ROI and risk-mitigation case should a funder expect?",
      },
      {
        id: "packs",
        label: "Download a checklist",
        prompt: "Can I download a compliance checklist or framework blueprint?",
      },
      ...common,
    ];
  }

  if (profile === "municipal") {
    return [
      {
        id: "za",
        label: "Municipal fit",
        prompt: "Is TrustLedger suitable for South African municipalities?",
      },
      {
        id: "assess",
        label: "Readiness diagnostic",
        prompt: "How do I assess SRM readiness before buying?",
      },
      ...common,
    ];
  }

  if (profile === "engineer" || profile === "project_manager") {
    return [
      {
        id: "rapid",
        label: "Rapid-response desk",
        prompt: "How does the rapid-response grievance workflow work on site?",
      },
      {
        id: "commitments",
        label: "Commitments",
        prompt: "How do engagements and commitments stay visible to the project team?",
      },
      ...common,
    ];
  }

  return [...THEMBA_STARTER_CHIPS, ...common].slice(0, 4);
}
