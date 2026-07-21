import Link from "next/link";

type DemoBannerProps = {
  planName?: string | null;
};

/** Sample-data preview banner (not the product trial). */
export function DemoBanner({ planName }: DemoBannerProps) {
  return (
    <div className="animate-[tl-banner-in_280ms_ease-out] bg-tl-ink text-white">
      <div className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6 sm:text-sm">
        <p>
          <span className="font-semibold">Sample preview</span>
          {planName ? (
            <>
              <span className="mx-2 opacity-60">·</span>
              {planName}
            </>
          ) : null}
          <span className="mx-2 opacity-60">·</span>
          Fictional data — not your workspace
        </p>
        <Link
          href="/trial?utm_source=demo_banner&utm_medium=cta&utm_campaign=start_trial"
          className="font-semibold underline underline-offset-2 hover:opacity-90"
        >
          Start 14-day trial
        </Link>
      </div>
    </div>
  );
}
