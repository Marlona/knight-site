export const maintenanceHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>We'll be back shortly — Knight &amp; Ember</title>
<style>*{box-sizing:border-box}body{margin:0;background:#faf7f1;color:#17130f;font-family:Arial,sans-serif;min-height:100vh;display:grid;place-items:center;padding:32px}main{width:100%;max-width:700px;border-top:1px solid #b3a68e;padding:40px 0}.brand{letter-spacing:.16em;text-transform:uppercase;font-size:13px}.mark{color:#b45e2d;font-size:40px;margin:56px 0 24px}h1{font:400 clamp(36px,7vw,64px)/1.08 Georgia,serif;letter-spacing:-.03em;margin:0 0 24px}p{line-height:1.7;max-width:520px}.links{display:flex;gap:20px;flex-wrap:wrap;margin-top:32px}a{color:#713b1c;text-underline-offset:5px}a:focus-visible{outline:2px solid #b45e2d;outline-offset:6px}.retry{display:inline-block;margin-top:32px;padding:14px 24px;background:#211c16;color:#faf7f1;text-decoration:none}</style></head>
<body><main><p class="brand">Knight &amp; Ember · Andrea Knight</p><div class="mark" aria-hidden="true">✳</div><h1>We’re making room for something beautiful.</h1><p>Our website is temporarily unavailable. We’ll be back shortly. In the meantime, we’d love to hear about your space.</p><div class="links"><a href="mailto:hello@knightandember.com">hello@knightandember.com</a><a href="tel:4045908940">(404) 590-8940</a></div><a class="retry" href="/">Try again</a></main></body></html>`;

export function isDocumentRequest(request: Request) {
  const path = new URL(request.url).pathname;
  return ["GET", "HEAD"].includes(request.method)
    && path !== "/api" && !path.startsWith("/api/") && !path.startsWith("/_next/")
    && request.headers.get("rsc") !== "1"
    && (request.headers.get("accept") ?? "").includes("text/html");
}

export function maintenanceResponse(request: Request) {
  return new Response(request.method === "HEAD" ? null : maintenanceHtml, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store, max-age=0", "Retry-After": "300", "X-Robots-Tag": "noindex" },
  });
}

export async function withMaintenance(request: Request, enabled: boolean, next: () => Promise<Response>) {
  const document = isDocumentRequest(request);
  if (document && enabled) return maintenanceResponse(request);
  try {
    const response = await next();
    if (document && response.status >= 500) {
      await response.body?.cancel();
      console.error(JSON.stringify({ event: "document_server_error", status: response.status }));
      return maintenanceResponse(request);
    }
    return response;
  } catch (error) {
    if (!document) throw error;
    console.error(JSON.stringify({ event: "document_handler_exception" }));
    return maintenanceResponse(request);
  }
}
