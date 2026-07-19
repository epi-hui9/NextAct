import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do not let stale service-worker or CDN caching hide a new build. The SW is
  // registered network-first; these headers keep the app shell fresh too.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
