import Link from "next/link";

type DemoBannerProps = {
  bookDemoHref?: string;
  planName?: string | null;
};

export function DemoBanner({
  bookDemoHref = "mailto:hello@trustledger.co.za?subject=TrustLedger%20enquiry",
  planName,
}: DemoBannerProps) {
  return (
    <div className="bg-tl-demo text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
        <p>
          <span className="font-semibold">14-day trial</span>
          {planName ? (
            <>
              <span className="mx-2 opacity-70">·</span>
              {planName}
            </>
          ) : null}
          <span className="mx-2 opacity-70">·</span>
          Sample data — email only to print or save
        </p>
        <Link
          href={bookDemoHref}
          className="font-medium underline underline-offset-2 hover:opacity-90"
        >
          Talk to us
        </Link>
      </div>
    </div>
  );
}
