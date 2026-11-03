"use client";
import Recovery from "@/components/ui/Recovery";
export default function GlobalError({ reset }: { reset: () => void }) {
  return <html lang="en"><body style={{ margin: 0 }}><Recovery reset={reset} /></body></html>;
}
