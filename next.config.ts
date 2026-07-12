import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Every image on the site is already hand-encoded WebP at its final display
    // size (project stills, before/after, sequence posters). Serving them
    // directly skips Next's on-demand optimizer — which otherwise flakes under
    // the showcase grid's burst of concurrent requests ("internal image
    // response is empty" → 400) for no visual gain.
    unoptimized: true,
  },
};

export default nextConfig;
