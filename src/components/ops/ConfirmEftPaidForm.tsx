"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PaystackPlanId } from "@/lib/paystackPlans";

const PLANS: PaystackPlanId[] = ["practitioner", "project", "institutional"];

export function ConfirmEftPaidForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [plan, setPlan] = useState<PaystackPlanId>("practitioner");
  const [amountZar, setAmountZar] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);

    const amount =
      amountZar.trim() === "" ? undefined : Number(amountZar.replace(",", "."));

    try {
      const res = await fetch("/api/ops/eft-confirm", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          organization: organization.trim() || undefined,
          plan,
          amountZar: Number.isFinite(amount) ? amount : undefined,
          reference: reference.trim(),
          note: note.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        amountLabel?: string;
        plan?: string;
        reference?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not confirm EFT payment.");
        return;
      }
      setSuccess(
        `Logged ${data.plan || plan} · ${data.amountLabel || ""} · ref ${data.reference || reference}. Provision Plan Owner manually when lockdown allows.`,
      );
      setReference("");
      setNote("");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-tl-line bg-tl-paper/40 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="eft-name" className="mb-1 block text-xs font-medium">
            Buyer name
          </label>
          <input
            id="eft-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="eft-email" className="mb-1 block text-xs font-medium">
            Buyer work email
          </label>
          <input
            id="eft-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="eft-org" className="mb-1 block text-xs font-medium">
            Organization{" "}
            <span className="font-normal text-tl-ink-muted">(optional)</span>
          </label>
          <input
            id="eft-org"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="eft-plan" className="mb-1 block text-xs font-medium">
            Plan
          </label>
          <select
            id="eft-plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value as PaystackPlanId)}
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
          >
            {PLANS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="eft-amount" className="mb-1 block text-xs font-medium">
            Amount (ZAR){" "}
            <span className="font-normal text-tl-ink-muted">
              (blank = list price)
            </span>
          </label>
          <input
            id="eft-amount"
            inputMode="decimal"
            placeholder="e.g. 500"
            value={amountZar}
            onChange={(e) => setAmountZar(e.target.value)}
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="eft-ref" className="mb-1 block text-xs font-medium">
            Bank / EFT reference
          </label>
          <input
            id="eft-ref"
            required
            minLength={3}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="eft-note" className="mb-1 block text-xs font-medium">
          Note{" "}
          <span className="font-normal text-tl-ink-muted">(optional)</span>
        </label>
        <input
          id="eft-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
          placeholder="Invoice number, bank used, …"
        />
      </div>

      {error ? (
        <p className="text-sm text-tl-danger" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-tl-trust" role="status">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
      >
        {pending ? "Logging…" : "Confirm EFT paid"}
      </button>
    </form>
  );
}
