import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VIP showcase",
  robots: { index: false, follow: false },
};

export default function VipShowcaseLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
