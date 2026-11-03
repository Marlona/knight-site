"use client";

export default function Recovery({ reset }: { reset: () => void }) {
  return <main style={{ minHeight: "100vh", padding: "48px 24px", background: "#faf7f1", color: "#17130f", display: "grid", placeContent: "center", fontFamily: "Arial, sans-serif" }}>
    <p>Knight &amp; Ember · Andrea Knight</p>
    <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, maxWidth: 640 }}>We’re making room for something beautiful.</h1>
    <p>This page couldn’t load. Please try again, or get in touch.</p>
    <p><a href="mailto:hello@knightandember.com">hello@knightandember.com</a></p>
    <p><a href="tel:4045908940">(404) 590-8940</a></p>
    <button onClick={reset} style={{ padding: 16, cursor: "pointer" }}>Try again</button>
    {/* A full document reload must bypass the failed client router. */}
    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
    <p><a href="/">Reload the website</a></p>
  </main>;
}
