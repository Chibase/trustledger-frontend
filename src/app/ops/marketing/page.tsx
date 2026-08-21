import Link from "next/link";
import { MarketingEnginePanel } from "@/components/ops/MarketingEnginePanel";
import { PillarBanner } from "@/components/ops/PillarBanner";
import { buildMarketingDesk } from "@/lib/marketing/desk";

export const dynamic = "force-dynamic";

export default async function OpsMarketingPage() {
  const data = await buildMarketingDesk();
  const ready =
    data.status.clickup && data.status.webhookSecret && data.status.zernio;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-tl-trust">Command control</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Marketing review
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          All marketing drafts that still need your review and publishing live
          here. Published or skipped pieces move to Archive. Compose a topic
          below; this is not the customer product dashboard and never sends
          bulk email.
        </p>
      </header>

      <PillarBanner status={ready ? "live" : data.status.clickup ? "partial" : "planned"}>
        {ready
          ? "Engine keys are present. Humans still approve every post."
          : data.error ||
            "Connect ClickUp, webhook HMAC, and Zernio accounts to publish from this desk."}
      </PillarBanner>

      <MarketingEnginePanel initial={data} />

      <p className="text-sm">
        <Link
          href="/ops/executive"
          className="font-medium text-tl-trust-ink underline"
        >
          Back to Executive Board
        </Link>
      </p>
    </div>
  );
}
