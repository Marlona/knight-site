import { NextResponse } from "next/server";
import { InquirySchema, scoreLead } from "@/lib/inquiry";
import { storeInquiry } from "@/lib/server/store";
import { notifyOwner, sendAutoResponse } from "@/lib/server/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: bots fill the hidden `company` field. Silently accept + drop.
  if (
    body &&
    typeof (body as Record<string, unknown>).company === "string" &&
    ((body as Record<string, string>).company).trim() !== ""
  ) {
    return NextResponse.json({ ok: true, id: "ignored" });
  }

  const parsed = InquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please check the highlighted fields.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const { tier } = scoreLead(data);

  try {
    const { id } = await storeInquiry(data, tier);
    // Email must never block the confirmation — run both, ignore individual failures.
    const results = await Promise.allSettled([
      sendAutoResponse(data),
      notifyOwner(data, id, tier),
    ]);
    results.forEach((r) => {
      if (r.status === "rejected") console.error("[inquiry] notification error:", r.reason);
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[inquiry] store error:", err);
    return NextResponse.json(
      { ok: false, error: "We couldn't save your inquiry. Please email hello@knightandember.com." },
      { status: 500 },
    );
  }
}
