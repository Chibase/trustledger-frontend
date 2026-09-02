import Link from "next/link";

/**
 * Banner for the complimentary VIP illustrative programme.
 * Distinct from the 14-day trial billing strip.
 */
export function VipShowcaseBanner() {
  return (
    <div className="border-b border-tl-trust/30 bg-tl-trust/10 px-4 py-2 text-sm text-tl-ink">
      <p>
        <span className="font-semibold">VIP · Institutional</span>
        {" — "}
        Illustrative programme{" "}
        <span className="font-medium">NCGR-B Corridor &amp; Access</span>. Not a
        customer matter.{" "}
        <Link href="/app/projects" className="font-medium text-tl-trust-ink underline">
          Open project
        </Link>
      </p>
    </div>
  );
}
