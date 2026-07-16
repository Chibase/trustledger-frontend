/**
 * Optional operator ping when quote/payment events land.
 * Set OPS_ALERT_WEBHOOK_URL (Slack/Discord/Make.com) on Vercel.
 * CRM Lead remains the system of record even if webhook is unset.
 */

export type OpsAlertPayload = {
  title: string;
  summary: string;
  href?: string;
  kind: "quote_request" | "eft_payment" | "paystack_payment";
};

export async function notifyOpsAlert(
  payload: OpsAlertPayload,
): Promise<{ sent: boolean; detail?: string }> {
  const url = process.env.OPS_ALERT_WEBHOOK_URL?.trim();
  if (!url) {
    return { sent: false, detail: "OPS_ALERT_WEBHOOK_URL not set" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${payload.title}\n${payload.summary}${payload.href ? `\n${payload.href}` : ""}`,
        ...payload,
      }),
    });
    if (!res.ok) {
      return { sent: false, detail: `webhook HTTP ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      detail: err instanceof Error ? err.message : "webhook failed",
    };
  }
}
