"use client";

import type { ReactNode } from "react";

/** Labelled field wrapper with number, required marker, and error slot. */
export function Field({
  id,
  index,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  index?: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <fieldset data-field={id} className="scroll-mt-28 border-0 p-0">
      <legend className="mb-4 flex items-baseline gap-3">
        {index && <span className="mono-caps text-oak">{index}</span>}
        <span className="font-display text-xl font-light text-ink md:text-2xl">
          {label}
          {required && <span className="ml-1 text-ember">*</span>}
        </span>
      </legend>
      {hint && <p className="mb-4 -mt-1 text-sm text-ink/55">{hint}</p>}
      {children}
      {error && (
        <p role="alert" className="mono-caps mt-3 text-ember">
          {error}
        </p>
      )}
    </fieldset>
  );
}

const inputBase =
  "w-full rounded-xl border bg-ivory/70 px-4 py-3.5 text-ink placeholder:text-ink/35 outline-none transition focus:border-oak focus:ring-2 focus:ring-oak/20";

export function TextInput({
  value,
  onChange,
  error,
  ...props
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error || undefined}
      className={`${inputBase} ${error ? "border-ember/60" : "border-ink/15"}`}
    />
  );
}

export function TextArea({
  value,
  onChange,
  error,
  ...props
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  return (
    <textarea
      {...props}
      rows={props.rows ?? 5}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error || undefined}
      className={`${inputBase} resize-y ${error ? "border-ember/60" : "border-ink/15"}`}
    />
  );
}

/** Selectable chips. `multiple` → checkbox semantics; otherwise single-select. */
export function ChipGroup({
  options,
  value,
  onChange,
  multiple = false,
  error,
}: {
  options: readonly string[];
  value: string[] | string;
  onChange: (v: string[] | string) => void;
  multiple?: boolean;
  error?: boolean;
}) {
  const selected = new Set(Array.isArray(value) ? value : value ? [value] : []);

  const toggle = (opt: string) => {
    if (multiple) {
      const next = new Set(selected);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      onChange([...next]);
    } else {
      onChange(opt);
    }
  };

  return (
    <div role="group" className={`flex flex-wrap gap-2.5 ${error ? "rounded-xl ring-2 ring-ember/30 ring-offset-4 ring-offset-ivory" : ""}`}>
      {options.map((opt) => {
        const isSel = selected.has(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={isSel}
            onClick={() => toggle(opt)}
            className={`mono-caps rounded-full border px-4 py-2.5 !normal-case !tracking-normal !text-sm transition select-none ${
              isSel
                ? "border-ink bg-ink text-ivory"
                : "border-ink/15 bg-ivory/40 text-ink/80 hover:border-ink/45"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
