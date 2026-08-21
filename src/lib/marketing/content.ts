import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type {
  ContentDoc,
  MarketingBrand,
  MarketingChannel,
  MarketingKind,
} from "@/lib/marketing/types";

function contentRoot(...parts: string[]): string {
  return path.join(process.cwd(), "content", ...parts);
}

function parseScalar(raw: string): string {
  const v = raw.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1);
  }
  return v;
}

function parseFrontMatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: raw.trim() };
  }
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = parseScalar(line.slice(idx + 1));
    if (key) meta[key] = value;
  }
  return { meta, body: match[2].trim() };
}

function asBrand(value: string | undefined): MarketingBrand {
  return value === "chibase" ? "chibase" : "trustledger";
}

function asKind(value: string | undefined): MarketingKind {
  if (value === "saas-spotlight" || value === "trial-outreach") return value;
  return "thought-leadership";
}

function asChannel(value: string | undefined): MarketingChannel {
  return value === "outreach" ? "outreach" : "social";
}

function loadDir(rel: string): ContentDoc[] {
  const dir = contentRoot(rel);
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort();
  const docs: ContentDoc[] = [];
  for (const file of files) {
    const filePath = path.join(dir, file);
    const raw = readFileSync(filePath, "utf8");
    const { meta, body } = parseFrontMatter(raw);
    const slug = meta.slug || file.replace(/\.md$/, "");
    docs.push({
      slug,
      title: meta.title || slug,
      brand: asBrand(meta.brand),
      kind: asKind(meta.kind),
      channel: asChannel(meta.channel),
      ctaLabel: meta.cta_label || "Learn more",
      ctaUrl: meta.cta_url || "https://trustledger.co.za/",
      platforms: (meta.platforms || "linkedin")
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      source: meta.source,
      body,
      filePath,
    });
  }
  return docs;
}

export function loadChibasePapers(): ContentDoc[] {
  return loadDir("chibase-papers").filter((d) => d.brand === "chibase");
}

export function loadTrustLedgerCampaigns(): ContentDoc[] {
  return loadDir("trustledger-campaigns").filter((d) => d.brand === "trustledger");
}

export function loadContentForBrand(brand: MarketingBrand): ContentDoc[] {
  return brand === "chibase" ? loadChibasePapers() : loadTrustLedgerCampaigns();
}

/** Rotate by ISO week so the same slug is not redrawn every Monday. */
export function pickContentDoc(
  docs: ContentDoc[],
  weekKey: string,
  usedSlugs: Set<string>,
): ContentDoc | null {
  if (docs.length === 0) return null;
  const unused = docs.filter((d) => !usedSlugs.has(d.slug));
  const pool = unused.length > 0 ? unused : docs;
  const weekNum = Number(weekKey.split("-W")[1] || "1") || 1;
  return pool[(weekNum - 1) % pool.length] ?? pool[0];
}
