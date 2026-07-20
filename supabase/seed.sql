-- Seed a single Round 1 test client. No real person's private content is
-- hard-coded here; story evidence starts empty and fills only from sourced,
-- first-person conversation.
insert into clients (id, preferred_name)
values ('client_demo_nextact', null)
on conflict (id) do nothing;

-- Story evidence rows start empty for all twelve areas.
insert into story_evidence (client_id, area, status, coverage_score, evidence_count)
select 'client_demo_nextact', area, 'empty', 0, 0
from unnest(array[
  'transition_context','identity_beyond_title','career_chapters',
  'defining_moments','challenges_and_recovery','judgment_and_strengths',
  'values_and_non_negotiables','impact_and_proof','relationships_and_influences',
  'future_direction','voice_and_language','tensions_and_contradictions'
]) as area
on conflict (client_id, area) do nothing;
