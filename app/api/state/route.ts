import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveSession } from "@/lib/session";
import { getStoryState } from "@/lib/story/service";
import { getLegacyUpdate } from "@/lib/legacy/service";
import { treeStageFromProgress, TREE_STAGE_LABELS } from "@/lib/story/tree";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await resolveSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const [client, story, legacyUpdate] = await Promise.all([
    db.getClient(session.clientId),
    getStoryState(session.clientId),
    getLegacyUpdate(session.clientId),
  ]);

  const treeStage = treeStageFromProgress(story.progress);

  return NextResponse.json({
    preferredName: client?.preferred_name ?? session.preferredName,
    storyProgress: story.progress,
    oneSmallThing: story.invitation,
    legacyUpdate,
    treeStage,
    treeSummary: TREE_STAGE_LABELS[treeStage],
    journeyStage: "Story",
    onboardingComplete: session.onboardingComplete,
  });
}
