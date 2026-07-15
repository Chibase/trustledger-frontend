import Link from "next/link";

export function DemoBanner() {
  return (
    <div className="animate-[tl-banner-in_280ms_ease-out] bg-tl-demo text-white">
      <div className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6 sm:text-sm">
        <p>
          <span className="font-semibold">Demo mode</span>
          <span className="mx-2 opacity-60">·</span>
          Sample data only — not a live project record
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/pay?utm_source=demo_banner&utm_medium=cta&utm_campaign=upgrade"
            className="font-medium underline underline-offset-2 hover:opacity-90"
          >
            Subscribe / upgrade
          </Link>
          <Link
            href="/trial?utm_source=demo_banner&utm_medium=cta&utm_campaign=trial"
            className="font-medium underline underline-offset-2 hover:opacity-90"
          >
            Start trial options
          </Link>
        </div>
      </div>
    </div>
  );
}
