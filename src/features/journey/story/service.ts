import "server-only";
import { db } from "@/server/db";
import { STORY_AREAS } from "@/server/db/types";
import {
  AREA_INVITATION,
  nextInvitationArea,
  storyProgress,
  type StoryAreaState,
} from "./config";

export interface StoryState {
  progress: number;
  invitation: string;
}

/** Deterministic Story state for the Home screen. No checklist is exposed. */
export async function getStoryState(clientId: string): Promise<StoryState> {
  const recs = await db.getStoryEvidence(clientId);
  const areas: StoryAreaState[] = STORY_AREAS.map((area) => ({
    area,
    status: recs.find((r) => r.area === area)?.status ?? "empty",
  }));
  const progress = storyProgress(areas);
  const invitation = AREA_INVITATION[nextInvitationArea(areas)];
  return { progress, invitation };
}
