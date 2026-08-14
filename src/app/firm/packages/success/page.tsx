import type { Metadata } from "next";
import { headers } from "next/headers";
import { FirmPackageSuccess } from "@/components/chibase/FirmPackageSuccess";
import { isChibaseHost } from "@/lib/security/hosts";

export const metadata: Metadata = {
  title: "Package payment",
  robots: { index: false, follow: false },
};

export default async function FirmPackageSuccessPage() {
  const chibaseHost = isChibaseHost((await headers()).get("host"));
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <FirmPackageSuccess chibaseHost={chibaseHost} />
    </div>
  );
}
