/**
 * Knight & Ember inquiry form — single source of truth for options, types,
 * validation, conditional-section logic, and lead scoring. Shared by the
 * client form (`components/inquiry/*`) and the API route (`app/api/inquiry`).
 */
import { z } from "zod";

export const SERVICE_OPTIONS = [
  "Interior Design",
  "Airbnb Design & Setup",
  "Property Management",
  "Airbnb Co-Hosting",
  "Listing Optimization",
  "Hospitality Business Coaching",
  "Other",
] as const;

export const AUDIENCE_OPTIONS = [
  "Homeowner",
  "Property Owner",
  "Investor",
  "Airbnb Host",
  "New Host",
  "Business Owner",
  "Other",
] as const;

export const STAGE_OPTIONS = [
  "Just exploring ideas",
  "Planning",
  "Ready to get started",
  "Already have a property",
  "Already operating",
] as const;

export const BUDGET_OPTIONS = [
  "Under $5,000",
  "$5,000–$10,000",
  "$10,000–$20,000",
  "$20,000+",
  "I’d rather discuss it",
] as const;

export const TIMELINE_OPTIONS = [
  "ASAP",
  "Within 30 days",
  "1–3 months",
  "Just gathering information",
] as const;

export const CONSULT_OPTIONS = [
  "Yes",
  "Not yet — I just have a few questions",
] as const;

// Coaching intake — shown for coaching / Airbnb setup leads.
export const LOOKING_TO_OPTIONS = [
  "Purchase a property",
  "Rental arbitrage",
  "Co-host",
  "Property management",
  "Learn the Airbnb business",
] as const;

// Design / management intake.
export const PROPERTY_TYPE_OPTIONS = [
  "Residential",
  "Commercial",
  "Short-term rental",
  "Long-term rental",
] as const;

export const DESIGN_SERVICE_OPTIONS = [
  "Space planning",
  "Furnishing",
  "Decorating",
  "Renovation consultation",
  "Full-service design",
  "Property management",
  "Turnover management",
  "Maintenance coordination",
  "Listing optimization",
] as const;

export const YES_NO_OPTIONS = ["Yes", "No", "Not sure"] as const;

/** Services that reveal the coaching / Airbnb-setup intake block. */
export const COACHING_TRIGGERS = [
  "Hospitality Business Coaching",
  "Airbnb Design & Setup",
] as const;

/** Services that reveal the design / property-management intake block. */
export const DESIGN_TRIGGERS = [
  "Interior Design",
  "Property Management",
  "Airbnb Co-Hosting",
  "Listing Optimization",
] as const;

export function showCoaching(services: string[]): boolean {
  return services.some((s) => (COACHING_TRIGGERS as readonly string[]).includes(s));
}

export function showDesign(services: string[]): boolean {
  return services.some((s) => (DESIGN_TRIGGERS as readonly string[]).includes(s));
}

const nonEmpty = (label: string) => z.string().trim().min(1, `${label} is required`);

export const InquirySchema = z.object({
  services: z.array(z.string()).min(1, "Select at least one service"),
  name: nonEmpty("Name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .refine((v) => (v.match(/\d/g)?.length ?? 0) >= 7, "Enter a valid phone number"),
  propertyAddress: z.string().trim().optional().default(""),
  audience: z.array(z.string()).min(1, "Select at least one"),
  projectDescription: nonEmpty("Project description"),
  stage: z.enum(STAGE_OPTIONS),
  biggestGoal: z.string().trim().optional().default(""),
  challenges: z.string().trim().optional().default(""),
  budget: z.enum(BUDGET_OPTIONS),
  timeline: z.union([z.enum(TIMELINE_OPTIONS), z.literal("")]).optional().default(""),
  referral: z.string().trim().optional().default(""),
  anythingElse: z.string().trim().optional().default(""),
  coaching: z
    .object({
      ownProperty: z.string().optional().default(""),
      hasLLC: z.string().optional().default(""),
      lookingTo: z.array(z.string()).optional().default([]),
      hostedBefore: z.string().optional().default(""),
      biggestQuestion: z.string().trim().optional().default(""),
    })
    .optional(),
  design: z
    .object({
      propertyType: z.array(z.string()).optional().default([]),
      designServices: z.array(z.string()).optional().default([]),
    })
    .optional(),
  scheduleConsultation: z.enum(CONSULT_OPTIONS),
  acknowledgment: z.literal(true, { message: "Please acknowledge before submitting" }),
  // Honeypot — must stay empty. Bots fill it; we silently drop those.
  company: z.string().optional().default(""),
});

export type Inquiry = z.infer<typeof InquirySchema>;

export type LeadTier = "hot" | "warm" | "cold";

/**
 * Separates serious leads from browsers using the scheduling answer, budget,
 * and project stage. Surfaced in the owner-notification subject line.
 */
export function scoreLead(data: Inquiry): { tier: LeadTier; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (data.scheduleConsultation === "Yes") {
    score += 2;
    reasons.push("Wants a consultation");
  }
  if (data.budget === "$20,000+") {
    score += 2;
    reasons.push("Budget $20k+");
  } else if (data.budget === "$10,000–$20,000") {
    score += 1;
    reasons.push("Budget $10–20k");
  }
  if (data.stage === "Ready to get started") {
    score += 2;
    reasons.push("Ready to start");
  } else if (data.stage === "Already operating" || data.stage === "Already have a property") {
    score += 1;
    reasons.push(data.stage);
  }
  if (data.timeline === "ASAP" || data.timeline === "Within 30 days") {
    score += 1;
    reasons.push(`Timeline: ${data.timeline}`);
  }

  const tier: LeadTier = score >= 4 ? "hot" : score >= 2 ? "warm" : "cold";
  return { tier, reasons };
}
