/**
 * Inquiry persistence adapter.
 *
 * If Supabase env vars are set, inquiries are inserted into the `inquiries`
 * table (see supabase/migrations). Otherwise the submission is logged and
 * appended to a local JSONL file so the form works end-to-end in development
 * without any backend — swapping in the real store is env-only, no code change.
 */
import type { Inquiry, LeadTier } from "@/lib/inquiry";

export type StoredInquiry = {
  id: string;
  tier: LeadTier;
};

export async function storeInquiry(
  data: Inquiry,
  tier: LeadTier,
): Promise<StoredInquiry> {
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

  // Fallback (dev / not-yet-configured): log + best-effort local file.
  const id = `local_${Date.now().toString(36)}`;
  const line = JSON.stringify({ id, created_at: new Date().toISOString(), tier, ...data });
  try {
    const { mkdir, appendFile } = await import("node:fs/promises");
    await mkdir(".data", { recursive: true });
    await appendFile(".data/inquiries.jsonl", line + "\n");
  } catch {
    // read-only FS (e.g. serverless) — the console log below is the record.
  }
  console.log(`[inquiry] stored (no DB configured) ${id} — ${data.name} <${data.email}> [${tier}]`);
  return { id, tier };
}
