"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  AUDIENCE_OPTIONS,
  BUDGET_OPTIONS,
  CONSULT_OPTIONS,
  DESIGN_SERVICE_OPTIONS,
  LOOKING_TO_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  SERVICE_OPTIONS,
  STAGE_OPTIONS,
  TIMELINE_OPTIONS,
  YES_NO_OPTIONS,
  showCoaching,
  showDesign,
} from "@/lib/inquiry";
import { ChipGroup, Field, TextArea, TextInput } from "./fields";

type Errors = Record<string, string>;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initial = {
  services: [] as string[],
  name: "",
  email: "",
  phone: "",
  propertyAddress: "",
  audience: [] as string[],
  projectDescription: "",
  stage: "",
  biggestGoal: "",
  challenges: "",
  budget: "",
  timeline: "",
  referral: "",
  anythingElse: "",
  coaching: {
    ownProperty: "",
    hasLLC: "",
    lookingTo: [] as string[],
    hostedBefore: "",
    biggestQuestion: "",
  },
  design: { propertyType: [] as string[], designServices: [] as string[] },
  scheduleConsultation: "",
  acknowledgment: false,
  company: "", // honeypot
};

type FormState = typeof initial;

const reveal = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.4, ease: [0.65, 0.05, 0, 1] as const },
};

export default function InquiryForm() {
  const [data, setData] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const set = (patch: Partial<FormState>) => setData((d) => ({ ...d, ...patch }));
  const setCoaching = (patch: Partial<FormState["coaching"]>) =>
    setData((d) => ({ ...d, coaching: { ...d.coaching, ...patch } }));
  const setDesign = (patch: Partial<FormState["design"]>) =>
    setData((d) => ({ ...d, design: { ...d.design, ...patch } }));

  const coaching = showCoaching(data.services);
  const design = showDesign(data.services);

  function validate(): Errors {
    const e: Errors = {};
    if (data.services.length === 0) e.services = "Select at least one service";
    if (!data.name.trim()) e.name = "Name is required";
    if (!emailRe.test(data.email.trim())) e.email = "Enter a valid email";
    if ((data.phone.match(/\d/g)?.length ?? 0) < 7) e.phone = "Enter a valid phone number";
    if (data.audience.length === 0) e.audience = "Select at least one";
    if (!data.projectDescription.trim()) e.projectDescription = "Tell us a little about the project";
    if (!data.stage) e.stage = "Select your current stage";
    if (!data.budget) e.budget = "Select a budget range";
    if (!data.scheduleConsultation) e.scheduleConsultation = "Let us know";
    if (!data.acknowledgment) e.acknowledgment = "Please acknowledge before submitting";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError("");
    const e = validate();
    setErrors(e);
    const firstKey = Object.keys(e)[0];
    if (firstKey) {
      const el = formRef.current?.querySelector(`[data-field="${firstKey}"]`);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 120;
        if (window.__lenis) window.__lenis.scrollTo(y);
        else window.scrollTo({ top: y, behavior: "smooth" });
      }
      return;
    }

    const payload: Record<string, unknown> = { ...data };
    if (!coaching) delete payload.coaching;
    if (!design) delete payload.design;

    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setSubmitted(true);
        if (window.__lenis) window.__lenis.scrollTo(0);
        else window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSubmitError(json.error || "Something went wrong. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please try again, or email hello@knightandember.com.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    const wantsCall = data.scheduleConsultation === "Yes";
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.65, 0.05, 0, 1] }}
        className="glass mx-auto max-w-2xl rounded-3xl p-10 text-center md:p-14"
      >
        <p className="mono-caps text-oak">Inquiry received</p>
        <h2 className="font-display text-editorial mt-5 text-4xl font-light text-ink md:text-5xl">
          Thank you, {data.name.split(" ")[0] || "friend"}.
        </h2>
        <p className="mx-auto mt-6 max-w-md leading-relaxed text-ink/70">
          {wantsCall
            ? "We've got your details and we'll reach out within one business day to schedule your consultation."
            : "We've got your details and we'll be in touch within one business day. No rush — reach out any time if more questions come up."}
        </p>
        <Link
          href="/"
          className="mono-caps mt-10 inline-flex items-center gap-3 rounded-full bg-ink px-8 py-4 text-ivory transition-colors hover:bg-charcoal"
        >
          Back to home <span aria-hidden>→</span>
        </Link>
      </motion.div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="mx-auto max-w-2xl">
      {/* Honeypot */}
      <div aria-hidden className="hidden">
        <label>
          Company
          <input
            tabIndex={-1}
            autoComplete="off"
            value={data.company}
            onChange={(e) => set({ company: e.target.value })}
          />
        </label>
      </div>

      <div className="space-y-14">
        <Field id="services" index="01" label="What can we help you with?" required error={errors.services}>
          <ChipGroup
            options={SERVICE_OPTIONS}
            value={data.services}
            onChange={(v) => set({ services: v as string[] })}
            multiple
            error={!!errors.services}
          />
        </Field>

        <div className="grid gap-8 sm:grid-cols-2">
          <Field id="name" index="02" label="Name" required error={errors.name}>
            <TextInput
              value={data.name}
              onChange={(v) => set({ name: v })}
              placeholder="Your name"
              autoComplete="name"
              error={!!errors.name}
            />
          </Field>
          <Field id="email" index="03" label="Email" required error={errors.email}>
            <TextInput
              type="email"
              value={data.email}
              onChange={(v) => set({ email: v })}
              placeholder="you@email.com"
              autoComplete="email"
              error={!!errors.email}
            />
          </Field>
          <Field id="phone" index="04" label="Phone" required error={errors.phone}>
            <TextInput
              type="tel"
              value={data.phone}
              onChange={(v) => set({ phone: v })}
              placeholder="(000) 000-0000"
              autoComplete="tel"
              error={!!errors.phone}
            />
          </Field>
          <Field id="propertyAddress" index="05" label="Property address" hint="If applicable">
            <TextInput
              value={data.propertyAddress}
              onChange={(v) => set({ propertyAddress: v })}
              placeholder="Street, city, state"
              autoComplete="street-address"
            />
          </Field>
        </div>

        <Field id="audience" index="06" label="Are you an…" required error={errors.audience}>
          <ChipGroup
            options={AUDIENCE_OPTIONS}
            value={data.audience}
            onChange={(v) => set({ audience: v as string[] })}
            multiple
            error={!!errors.audience}
          />
        </Field>

        <Field
          id="projectDescription"
          index="07"
          label="Tell us about your project."
          required
          error={errors.projectDescription}
        >
          <TextArea
            value={data.projectDescription}
            onChange={(v) => set({ projectDescription: v })}
            placeholder="The space, the vision, what success looks like…"
            error={!!errors.projectDescription}
          />
        </Field>

        <Field id="stage" index="08" label="What stage are you currently in?" required error={errors.stage}>
          <ChipGroup options={STAGE_OPTIONS} value={data.stage} onChange={(v) => set({ stage: v as string })} error={!!errors.stage} />
        </Field>

        <div className="grid gap-8 sm:grid-cols-2">
          <Field id="biggestGoal" index="09" label="What's your biggest goal?">
            <TextArea rows={3} value={data.biggestGoal} onChange={(v) => set({ biggestGoal: v })} placeholder="Optional" />
          </Field>
          <Field id="challenges" index="10" label="What challenges are you facing?">
            <TextArea rows={3} value={data.challenges} onChange={(v) => set({ challenges: v })} placeholder="Optional" />
          </Field>
        </div>

        <Field id="budget" index="11" label="Do you have a budget in mind?" required error={errors.budget}>
          <ChipGroup options={BUDGET_OPTIONS} value={data.budget} onChange={(v) => set({ budget: v as string })} error={!!errors.budget} />
        </Field>

        <Field id="timeline" index="12" label="When are you hoping to start?">
          <ChipGroup options={TIMELINE_OPTIONS} value={data.timeline} onChange={(v) => set({ timeline: v as string })} />
        </Field>

        <div className="grid gap-8 sm:grid-cols-2">
          <Field id="referral" index="13" label="How did you hear about us?">
            <TextInput value={data.referral} onChange={(v) => set({ referral: v })} placeholder="Optional" />
          </Field>
          <Field id="anythingElse" index="14" label="Anything else?">
            <TextInput
              value={data.anythingElse}
              onChange={(v) => set({ anythingElse: v })}
              placeholder="Optional"
            />
          </Field>
        </div>

        {/* Conditional — coaching / Airbnb setup */}
        <AnimatePresence initial={false}>
          {coaching && (
            <motion.div key="coaching" {...reveal} className="overflow-hidden">
              <div className="space-y-10 rounded-2xl border border-oak/25 bg-parchment/50 p-6 md:p-8">
                <p className="mono-caps text-oak">Coaching &amp; Airbnb setup</p>
                <div className="grid gap-8 sm:grid-cols-2">
                  <Field id="c-own" label="Do you own a property?">
                    <ChipGroup options={YES_NO_OPTIONS} value={data.coaching.ownProperty} onChange={(v) => setCoaching({ ownProperty: v as string })} />
                  </Field>
                  <Field id="c-llc" label="Do you have an LLC?">
                    <ChipGroup options={YES_NO_OPTIONS} value={data.coaching.hasLLC} onChange={(v) => setCoaching({ hasLLC: v as string })} />
                  </Field>
                </div>
                <Field id="c-looking" label="Are you looking to…">
                  <ChipGroup
                    options={LOOKING_TO_OPTIONS}
                    value={data.coaching.lookingTo}
                    onChange={(v) => setCoaching({ lookingTo: v as string[] })}
                    multiple
                  />
                </Field>
                <Field id="c-hosted" label="Have you hosted before?">
                  <ChipGroup options={YES_NO_OPTIONS} value={data.coaching.hostedBefore} onChange={(v) => setCoaching({ hostedBefore: v as string })} />
                </Field>
                <Field id="c-question" label="What's your biggest question right now?">
                  <TextArea rows={3} value={data.coaching.biggestQuestion} onChange={(v) => setCoaching({ biggestQuestion: v })} placeholder="Optional" />
                </Field>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conditional — design / property management */}
        <AnimatePresence initial={false}>
          {design && (
            <motion.div key="design" {...reveal} className="overflow-hidden">
              <div className="space-y-10 rounded-2xl border border-oak/25 bg-parchment/50 p-6 md:p-8">
                <p className="mono-caps text-oak">Design &amp; property management</p>
                <Field id="d-type" label="Is the property…">
                  <ChipGroup
                    options={PROPERTY_TYPE_OPTIONS}
                    value={data.design.propertyType}
                    onChange={(v) => setDesign({ propertyType: v as string[] })}
                    multiple
                  />
                </Field>
                <Field id="d-services" label="What services are you interested in?">
                  <ChipGroup
                    options={DESIGN_SERVICE_OPTIONS}
                    value={data.design.designServices}
                    onChange={(v) => setDesign({ designServices: v as string[] })}
                    multiple
                  />
                </Field>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Field
          id="scheduleConsultation"
          index="15"
          label="Would you like to schedule a consultation?"
          required
          error={errors.scheduleConsultation}
        >
          <ChipGroup
            options={CONSULT_OPTIONS}
            value={data.scheduleConsultation}
            onChange={(v) => set({ scheduleConsultation: v as string })}
            error={!!errors.scheduleConsultation}
          />
        </Field>

        {/* Acknowledgment */}
        <fieldset data-field="acknowledgment" className="scroll-mt-28 border-0 p-0">
          <label className="flex cursor-pointer items-start gap-4">
            <input
              type="checkbox"
              checked={data.acknowledgment}
              onChange={(e) => set({ acknowledgment: e.target.checked })}
              className="mt-1 h-5 w-5 shrink-0 accent-ink"
              aria-invalid={!!errors.acknowledgment || undefined}
            />
            <span className="text-sm leading-relaxed text-ink/75">
              I understand this is an inquiry — not a confirmed booking — and I consent to
              Knight &amp; Ember contacting me about my project.
              <span className="text-ember"> *</span>
            </span>
          </label>
          {errors.acknowledgment && (
            <p role="alert" className="mono-caps mt-3 text-ember">
              {errors.acknowledgment}
            </p>
          )}
        </fieldset>

        {submitError && (
          <p role="alert" className="rounded-xl border border-ember/40 bg-ember/5 px-4 py-3 text-sm text-ember">
            {submitError}
          </p>
        )}

        <div className="flex flex-col items-start gap-4 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="mono-caps inline-flex items-center gap-3 rounded-full bg-ink px-9 py-4 text-ivory transition-colors hover:bg-charcoal disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send inquiry"}
            <span aria-hidden>→</span>
          </button>
          <p className="text-xs text-ink/45">We reply within one business day. Fields marked * are required.</p>
        </div>
      </div>
    </form>
  );
}
