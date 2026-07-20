/**
 * Nine month path: eight journey stages.
 * Only the first stage (Tell Your Story) is active in the current product.
 * Later stages stay visible but locked until Story work is complete.
 */

export const JOURNEY_STAGES = [
  {
    id: "tell_your_story",
    title: "Tell Your Story",
    shortTitle: "Story",
    summary: "Name what shaped you, and what this next chapter asks of you.",
  },
  {
    id: "see_yourself_clearly",
    title: "See Yourself Clearly",
    shortTitle: "Clarity",
    summary: "See the pattern in your judgment, strengths, and tensions.",
  },
  {
    id: "set_your_target",
    title: "Set Your Target",
    shortTitle: "Target",
    summary: "Choose a direction worth carrying, not a title to chase.",
  },
  {
    id: "reconnect_your_people",
    title: "Reconnect Your People",
    shortTitle: "People",
    summary: "Return to the relationships that open doors and steady you.",
  },
  {
    id: "build_your_ai_edge",
    title: "Build Your AI Edge",
    shortTitle: "AI Edge",
    summary: "Put your judgment to work with tools that multiply it.",
  },
  {
    id: "get_seen",
    title: "Get Seen",
    shortTitle: "Seen",
    summary: "Make your value visible to the rooms that matter.",
  },
  {
    id: "your_daily_edge",
    title: "Your Daily Edge",
    shortTitle: "Daily",
    summary: "Build the rhythm that keeps you sharp every week.",
  },
  {
    id: "land_it_and_keep_it",
    title: "Land It and Keep It",
    shortTitle: "Land It",
    summary: "Arrive well, and stay true once you are there.",
  },
] as const;

export type JourneyStageId = (typeof JOURNEY_STAGES)[number]["id"];

/** First stage is the only active product surface today. */
export const ACTIVE_JOURNEY_STAGE_ID: JourneyStageId = "tell_your_story";

export function journeyStageIndex(id: JourneyStageId): number {
  return JOURNEY_STAGES.findIndex((s) => s.id === id);
}
