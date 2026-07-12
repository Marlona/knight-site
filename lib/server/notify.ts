/**
 * Inquiry notifications — client auto-response + owner alert, via Resend.
 *
 * Env-gated: without RESEND_API_KEY the emails are logged instead of sent, so
 * the submission flow never fails on missing config. Turning email on is
 * env-only (RESEND_API_KEY, INQUIRY_FROM_EMAIL, INQUIRY_OWNER_EMAIL,
 * optional CONSULT_BOOKING_URL).
 */
import { scoreLead, type Inquiry, type LeadTier } from "@/lib/inquiry";

const STUDIO = "Knight & Ember";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function resendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INQUIRY_FROM_EMAIL;
  if (!apiKey || !from) return null;
  const { Resend } = await import("resend");
  return { resend: new Resend(apiKey), from };
}

/** Warm confirmation to the person who submitted. */
export async function sendAutoResponse(data: Inquiry): Promise<void> {
  const client = await resendClient();
  if (!client) {
    console.log(`[inquiry] auto-response skipped (email not configured) → ${data.email}`);
    return;
  }

  const bookingUrl = process.env.CONSULT_BOOKING_URL;
  const wantsCall = data.scheduleConsultation === "Yes";
  const cta =
    wantsCall && bookingUrl
      ? `<p style="margin:24px 0"><a href="${bookingUrl}" style="background:#17130f;color:#faf7f1;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;letter-spacing:.04em">Book your consultation →</a></p>`
      : "";

  const html = `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#17130f">
    <p style="font-size:22px;margin:0 0 8px">Thank you, ${esc(data.name.split(" ")[0])}.</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#3a342c">
      We've received your inquiry and someone from ${STUDIO} will personally
      reach out within one business day. Great spaces start with a great
      conversation — we're looking forward to yours.
    </p>
    ${cta}
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#8a8172;border-top:1px solid #e9e3d5;padding-top:16px;margin-top:24px">
      ${STUDIO} · Interior Design &amp; Hospitality
    </p>
  </div>`;

  await client.resend.emails.send({
    from: client.from,
    to: data.email,
    subject: `We received your inquiry — ${STUDIO}`,
    html,
  });
}

/** Full submission + triage flag to the studio inbox. */
export async function notifyOwner(data: Inquiry, id: string, tier: LeadTier): Promise<void> {
  const to = process.env.INQUIRY_OWNER_EMAIL;
  const client = await resendClient();
  if (!client || !to) {
    console.log(`[inquiry] owner notification skipped (email not configured) → ${id}`);
    return;
  }

  const { reasons } = scoreLead(data);
  const rows: Array<[string, string]> = [
    ["Services", data.services.join(", ")],
    ["Name", data.name],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Property address", data.propertyAddress || "—"],
    ["They are", data.audience.join(", ")],
    ["Stage", data.stage],
    ["Budget", data.budget],
    ["Timeline", data.timeline || "—"],
    ["Wants consultation", data.scheduleConsultation],
    ["Project", data.projectDescription],
    ["Biggest goal", data.biggestGoal || "—"],
    ["Challenges", data.challenges || "—"],
    ["Heard about us", data.referral || "—"],
    ["Anything else", data.anythingElse || "—"],
  ];
  if (data.coaching) {
    rows.push(["— Coaching: owns property", data.coaching.ownProperty || "—"]);
    rows.push(["— Coaching: has LLC", data.coaching.hasLLC || "—"]);
    rows.push(["— Coaching: looking to", (data.coaching.lookingTo ?? []).join(", ") || "—"]);
    rows.push(["— Coaching: hosted before", data.coaching.hostedBefore || "—"]);
    rows.push(["— Coaching: biggest question", data.coaching.biggestQuestion || "—"]);
  }
  if (data.design) {
    rows.push(["— Property type", (data.design.propertyType ?? []).join(", ") || "—"]);
    rows.push(["— Design services", (data.design.designServices ?? []).join(", ") || "—"]);
  }

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#17130f">
    <p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#b45e2d;margin:0">
      ${tier.toUpperCase()} lead${reasons.length ? " · " + esc(reasons.join(" · ")) : ""}
    </p>
    <h2 style="margin:6px 0 16px;font-size:20px">New inquiry — ${esc(data.name)}</h2>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      ${rows
        .map(
          ([k, v]) =>
            `<tr>
              <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#8a8172;white-space:nowrap;vertical-align:top">${esc(k)}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #eee">${esc(v)}</td>
            </tr>`,
        )
        .join("")}
    </table>
    <p style="font-size:12px;color:#8a8172;margin-top:16px">Ref ${esc(id)}</p>
  </div>`;

  await client.resend.emails.send({
    from: client.from,
    to,
    replyTo: data.email,
    subject: `[${tier.toUpperCase()}] New inquiry — ${data.name} (${data.services[0] ?? "general"})`,
    html,
  });
}
