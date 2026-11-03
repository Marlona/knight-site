// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore OpenNext generates this module during the deployment build.
import handler from "./.open-next/worker.js";
import { withMaintenance } from "./worker/maintenance";

export default {
  fetch(request, env, ctx) {
    return withMaintenance(request, String(env.MAINTENANCE_MODE) === "true", () => handler.fetch(request, env, ctx));
  },
} satisfies ExportedHandler<CloudflareEnv>;
