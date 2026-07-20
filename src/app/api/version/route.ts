import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Privacy-safe build identity. Never includes secrets, client data, or keys.
 */
export async function GET() {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_BUILD_SHA ||
    process.env.GIT_COMMIT_SHA ||
    "local";
  const env =
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "unknown";

  return NextResponse.json({
    service: "nextact",
    version: process.env.npm_package_version || "0.1.0",
    sha: sha.slice(0, 40),
    shortSha: sha.slice(0, 7),
    builtAt:
      process.env.VERCEL_GIT_COMMIT_AUTHOR_DATE ||
      process.env.BUILD_TIMESTAMP ||
      null,
    environment: env,
    demoMode:
      process.env.NEXTACT_ALLOW_DEMO === "1" &&
      process.env.VERCEL_ENV !== "production",
  });
}
