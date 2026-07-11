import Link from "next/link";

type DemoBannerProps = {
  bookDemoHref?: string;
};

export function DemoBanner({ bookDemoHref = "/demo#book" }: DemoBannerProps) {
  return (
    <div className="animate-[tl-banner-in_280ms_ease-out] bg-tl-demo text-white">
      <div className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6 sm:text-sm">
        <p>
          <span className="font-semibold">Demo mode</span>
          <span className="mx-2 opacity-60">·</span>
          Sample data only — not a live project record
        </p>
        <Link
          href={bookDemoHref}
          className="font-medium underline underline-offset-2 hover:opacity-90"
        >
          Book a live demo
        </Link>
      </div>
    </div>
  );
}
