/**
 * Inquiry persistence adapter.
 *
 * Priority: Google Sheets (Apps Script web app) → Supabase → local-file
 * fallback. Every path is env-gated, so the form works with no backend at all
 * (submissions log + append to .data/inquiries.jsonl in dev) and "turns on" a
 * real store via env only — no code change.
 */
import type { Inquiry, LeadTier } from "@/lib/inquiry";

export type StoredInquiry = {
  id: string;
  tier: LeadTier;
};

/**
 * Flattens an inquiry into a label→value object. Key order defines the Google
 * Sheet column order; the Apps Script materializes these as the header row.
 */
export function buildSheetRow(
  data: Inquiry,
  tier: LeadTier,
  id: string,
): Record<string, string> {
  const join = (a?: string[]) => (a ?? []).join(", ");
  return {
    Received: new Date().toISOString(),
    Lead: tier.toUpperCase(),
    Name: data.name,
    Email: data.email,
    Phone: data.phone,
    Services: join(data.services),
    "Are you a(n)": join(data.audience),
    "Property address": data.propertyAddress || "",
    Stage: data.stage,
    Budget: data.budget,
    Timeline: data.timeline || "",
    "Wants consultation": data.scheduleConsultation,
    "Project details": data.projectDescription,
    "Biggest goal": data.biggestGoal || "",
    Challenges: data.challenges || "",
    "How they heard": data.referral || "",
    "Anything else": data.anythingElse || "",
    "Coaching · Owns property": data.coaching?.ownProperty || "",
    "Coaching · Has LLC": data.coaching?.hasLLC || "",
    "Coaching · Looking to": join(data.coaching?.lookingTo),
    "Coaching · Hosted before": data.coaching?.hostedBefore || "",
    "Coaching · Biggest question": data.coaching?.biggestQuestion || "",
    "Property type": join(data.design?.propertyType),
    "Services interested in": join(data.design?.designServices),
    "Ref ID": id,
  };
}

async function appendLocal(id: string, tier: LeadTier, data: Inquiry): Promise<void> {
  const line = JSON.stringify({ id, created_at: new Date().toISOString(), tier, ...data });
  try {
    const { mkdir, appendFile } = await import("node:fs/promises");
    await mkdir(".data", { recursive: true });
    await appendFile(".data/inquiries.jsonl", line + "\n");
  } catch {
    // read-only FS (e.g. serverless) — the console log is the record.
  }
  console.log(`[inquiry] stored locally ${id} — ${data.name} <${data.email}> [${tier}]`);
}

export async function storeInquiry(
  data: Inquiry,
  tier: LeadTier,
): Promise<StoredInquiry> {
  const id = `inq_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)
    .toString(36)
    .padStart(3, "0")}`;

  // 1) Google Sheets via Apps Script web app.
  const sheetsUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (sheetsUrl) {
    try {
      const res = await fetch(sheetsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.SHEETS_SHARED_SECRET,
          values: buildSheetRow(data, tier, id),
        }),
        redirect: "follow",
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out?.ok !== true) {
        throw new Error(`Sheets webhook responded ${res.status} ${JSON.stringify(out)}`);
      }
      return { id, tier };
    } catch (err) {
      // Never lose a lead on a Sheets hiccup: capture locally and still succeed.
      console.error("[inquiry] Sheets write failed, falling back to local:", err);
      await appendLocal(id, tier, data);
      return { id, tier };
    }
  }

  // 2) Supabase.
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data: row, error } = await supabase
      .from("inquiries")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        services: data.services,
        audience: data.audience,
        stage: data.stage,
        budget: data.budget,
        timeline: data.timeline || null,
        schedule_consultation: data.scheduleConsultation,
        lead_tier: tier,
        payload: data,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: String(row.id), tier };
  }

  // 3) Local fallback.
  await appendLocal(id, tier, data);
  return { id, tier };
}
