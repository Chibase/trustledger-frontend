import Link from "next/link";

type DemoBannerProps = {
  planName?: string | null;
};

export function DemoBanner({ planName }: DemoBannerProps) {
  return (
    <div className="animate-[tl-banner-in_280ms_ease-out] bg-tl-demo text-white">
      <div className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6 sm:text-sm">
        <p>
          <span className="font-semibold">14-day trial</span>
          {planName ? (
            <>
              <span className="mx-2 opacity-60">·</span>
              {planName}
            </>
          ) : null}
          <span className="mx-2 opacity-60">·</span>
          Sample data — email only to print or save
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/quote?utm_source=demo_banner&utm_medium=cta&utm_campaign=upgrade"
            className="font-medium underline underline-offset-2 hover:opacity-90"
          >
            Request quote
          </Link>
          <Link
            href="/trial?utm_source=demo_banner&utm_medium=cta&utm_campaign=trial"
            className="font-medium underline underline-offset-2 hover:opacity-90"
          >
            Subscribe options
          </Link>
        </div>
      </div>
    </div>
  );
}
