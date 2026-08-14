/**
 * Chibase Consulting engagement catalogue (ADR-048).
 * Independent of TrustLedger PaystackPlanId. Amounts are ZAR cents.
 * 0 = request a package (quote) until CHIBASE_AMOUNT_*_CENTS is set.
 */

export const CHIBASE_PACKAGE_IDS = [
  "facilitation",
  "mel",
  "iks",
  "field",
] as const;

export type ChibasePackageId = (typeof CHIBASE_PACKAGE_IDS)[number];

export type ChibasePackageCopy = {
  id: ChibasePackageId;
  label: string;
  summary: string;
  /** What the client is buying — people and method, not software seats. */
  includes: readonly string[];
};

/** Public copy only — safe in client components (no env amounts). */
export const CHIBASE_PACKAGE_COPY: readonly ChibasePackageCopy[] = [
  {
    id: "facilitation",
    label: "Social facilitation sprint",
    summary:
      "Consultations that do not vanish after the meeting: named counterparts, traditional authorities, and a commitment log with owners.",
    includes: [
      "Time-boxed facilitation on one programme or site",
      "Named community and customary counterparts",
      "Commitment log the client can keep after we leave",
    ],
  },
  {
    id: "mel",
    label: "MEL & evidence",
    summary:
      "Monitoring that cites the trail — grievances, engagements, promises — not a reconstructed month-end pack.",
    includes: [
      "Evidence spine beside your results framework",
      "Intake, ownership, and assurance scoring",
      "Board-ready trail, not a memory brief",
    ],
  },
  {
    id: "iks",
    label: "IKS method embed",
    summary:
      "Indigenous Knowledge Systems as method for participation and M&E, not a courtesy paragraph in the ESIA.",
    includes: [
      "Place, customary structures, and community-defined outcomes in the register",
      "Facilitation and MEL design that treats IKS as input",
      "Practice frame for the team who will keep the trail",
    ],
  },
  {
    id: "field",
    label: "Short-cycle field intervention",
    summary:
      "When a site is already in friction, we diagnose and de-escalate with people on the ground. A consulting deployment, not a software division.",
    includes: [
      "Human deployment on a live site",
      "Diagnosis, de-escalation, and a written trail of what was agreed",
      "Optional TrustLedger desk for the operator to keep after we leave",
    ],
  },
] as const;

export type ChibasePackage = ChibasePackageCopy & {
  /** Amount in ZAR cents (Paystack subunit). 0 = request a package. */
  amountCents: number;
  currency: "ZAR";
  billing: "engagement";
  selfServe: boolean;
};

const AMOUNT_ENV: Record<ChibasePackageId, string> = {
  facilitation: "CHIBASE_AMOUNT_FACILITATION_CENTS",
  mel: "CHIBASE_AMOUNT_MEL_CENTS",
  iks: "CHIBASE_AMOUNT_IKS_CENTS",
  field: "CHIBASE_AMOUNT_FIELD_CENTS",
};

function envCents(key: string, fallback = 0): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

export function isChibasePackageId(id: string | null | undefined): id is ChibasePackageId {
  return Boolean(id && (CHIBASE_PACKAGE_IDS as readonly string[]).includes(id));
}

export function getChibasePackages(): ChibasePackage[] {
  return CHIBASE_PACKAGE_COPY.map((copy) => {
    const amountCents = envCents(AMOUNT_ENV[copy.id], 0);
    return {
      ...copy,
      amountCents,
      currency: "ZAR" as const,
      billing: "engagement" as const,
      selfServe: amountCents > 0,
    };
  });
}

export function getChibasePackage(
  id: string | null | undefined,
): ChibasePackage | null {
  if (!isChibasePackageId(id)) return null;
  return getChibasePackages().find((p) => p.id === id) || null;
}

export function chibasePackageCopy(
  id: string | null | undefined,
): ChibasePackageCopy | null {
  if (!isChibasePackageId(id)) return null;
  return CHIBASE_PACKAGE_COPY.find((p) => p.id === id) || null;
}

export function formatChibasePackagePrice(pkg: Pick<ChibasePackage, "amountCents">): string {
  if (!pkg.amountCents) return "Request a package";
  return `R ${(pkg.amountCents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
