import { redirect } from "next/navigation";

/** Legacy sample-demo entry — permanently retired (ADR-033). */
export default function DemoRedirectPage() {
  redirect("/product");
}
