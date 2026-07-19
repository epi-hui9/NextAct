import { NextResponse } from "next/server";
import { resolveClientId } from "@/lib/session";
import { db } from "@/lib/db";
import { getStoryState } from "@/lib/story/service";
import { getLegacyUpdate } from "@/lib/legacy/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Home data: greeting, quiet progress, one small thing, one map update. */
export async function GET() {
  const clientId = await resolveClientId();
  if (!clientId) return new NextResponse("Unauthorized", { status: 401 });

  const [client, story, legacyUpdate] = await Promise.all([
    db.getClient(clientId),
    getStoryState(clientId),
    getLegacyUpdate(clientId),
  ]);

  return NextResponse.json({
    preferredName: client?.preferred_name ?? null,
    storyProgress: story.progress,
    oneSmallThing: story.invitation,
    legacyUpdate,
  });
}
