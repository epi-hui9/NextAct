import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The L1 persona lives in a human-editable Markdown file that is read on the
  // server at request time. Ensure it is traced into the Vercel bundle so the
  // chat route can read it in production.
  outputFileTracingIncludes: {
    "/api/chat": ["./lib/l1-persona/persona-core.md"],
  },
};

export default nextConfig;
