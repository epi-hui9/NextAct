You are the principal engineer responsible for shipping Round 1 of the NextAct Client Instrument MVP.

This is an execution task, not a planning exercise. Inspect the repository, make a short internal plan, then implement, test, and deploy the complete vertical slice. Do not stop after describing an approach. Do not wait for follow-up unless a missing external credential makes a live integration literally impossible.

Assume this is the only build attempt. The result must be testable on a real iPhone immediately after you finish.

==================================================
1. PRODUCT NORTH STAR
==================================================

Client Instrument is a fully private space that belongs to each executive. The interface must stay simple and avoid information overload. Inside it, clients turn forty years of judgment into a visible living legacy and turn a difficult transition into a new chapter worth anticipating.

The MVP must feel like a trusted, warm, highly attentive companion. It must not feel like enterprise software, a school course, a questionnaire, or a technical AI demo.

The first test should prove this loop:

1. The client opens the app on an iPhone.
2. The client types or speaks naturally.
3. The AI responds briefly, warmly, and intelligently.
4. The AI remembers both a fact and an emotional state from an earlier exchange.
5. The AI uses that memory naturally later.
6. The Story stage advances in the background.
7. A verified insight enters the client’s Living Legacy database.
8. The Home screen reflects progress without exposing an internal checklist.
9. The app is deployed to an HTTPS URL that can be opened on an iPhone.

Prioritize this loop above every secondary feature.

==================================================
2. EXECUTION RULES
==================================================

Start by inspecting the current repository, package.json, existing routes, components, AI integration, environment variables, tests, Git status, and deployment configuration.

Preserve useful existing code. Do not create a new repository. Do not rewrite stable working functionality without a concrete reason.

Create a new branch named:

cursor/client-instrument-round-1

Before editing:

1. Run the existing install, typecheck, test, and build commands.
2. Record the baseline failures so pre-existing failures are distinguishable from new ones.
3. Identify the currently working AI provider and model IDs from the code and environment.
4. Reuse valid existing integrations. Do not invent unsupported model names.
5. Inspect whether Supabase, Deepgram, Vercel, and Git remotes are already configured.

Then implement. Do not stop after making a plan.

Use strict TypeScript. Use Zod at all external and model-generated boundaries. Prefer direct, readable code over a new abstraction framework.

Do not add Temporal, LangGraph, GraphRAG, a multi-agent framework, a separate microservice, or a new state-management framework.

Do not add analytics, session replay, third-party behavioral tracking, or logging that captures private message content.

Do not expose secrets to the browser.

Do not use placeholder buttons that pretend to work.

If a credential is unavailable:

1. Complete the adapter and UI.
2. Use a clearly defined local demo adapter only where required to keep the test path alive.
3. Never claim a live integration succeeded when it did not.
4. List the exact missing environment variable in the final report.
5. Do not let one missing optional service prevent the rest of the app from building and deploying.

==================================================
3. ROUND 1 SCOPE
==================================================

Build one complete Story-stage vertical slice.

Required user-facing surfaces:

1. Home
2. Conversation
3. Living Legacy Map
4. File upload inside Conversation

Do not build Strategy, Brand, Marketing, Firm OS, Operations Console, Review Capsule, facilitator tools, payment, email ingestion, full export, GraphRAG, social comparison, leaderboards, streaks, TTS, phone calls, or a general settings dashboard.

Do not build a visible questionnaire or visible Story requirements checklist.

Do not show the client “you still need to answer these 12 questions.”

The system may track Story evidence internally, but the client must experience one natural conversation.

==================================================
4. BRAND AND VISUAL RULES
==================================================

Use only Brand Color 4:

--brand-navy: #10192B
--brand-mist: #A9AFB8
--brand-cashmere: #FAF9F7
--brand-gray: #7A7D85

White may be used only if already implicit in an image asset. Do not introduce red, green, yellow, gold, purple, or any other UI color.

Use opacity, borders, texture, scale, and motion to create hierarchy instead of additional colors.

The visual feeling should be:

1. Elegant and restrained
2. Soft, human, and warm
3. More personable than Claude or ChatGPT
4. Inspired by Character AI’s sense of presence, without becoming playful or childish
5. Comfortable for a 50 to 70-year-old executive using only an iPhone

Mobile is the primary layout. Design at 390 x 844 first.

Requirements:

1. Minimum 44 x 44 pixel touch targets.
2. Respect iPhone safe areas with env(safe-area-inset-*).
3. No horizontal scrolling.
4. No tiny secondary text.
5. No dense dashboard layout.
6. No technical labels such as RAG, vector, agent, memory layer, skill, confidence score, or verifier.
7. Avoid excessive cards. The interface should feel like a steady space, not a dashboard of boxes.
8. Use subtle motion only. Respect prefers-reduced-motion.
9. The keyboard must not cover the active input or send controls.
10. The Conversation screen must remain usable in iOS Safari and standalone PWA mode.

Use the latest existing visual system if it already matches these rules. Remove older colors from user-facing UI.

==================================================
5. PWA AND IPHONE TESTABILITY
==================================================

The app must be installable and testable from an iPhone after this run.

Implement:

1. app/manifest.ts or the correct equivalent for the current App Router structure.
2. name: NextAct
3. short_name: NextAct
4. display: standalone
5. start_url: /
6. theme_color: #10192B
7. background_color: #FAF9F7
8. Correct 192 x 192 and 512 x 512 icons.
9. apple-mobile-web-app-capable metadata.
10. Apple touch icon.
11. Viewport and safe-area support.
12. A lightweight service worker only if it can be added without destabilizing the existing build.
13. A graceful offline shell. Do not attempt offline AI conversation.

Prevent stale service-worker caching from hiding new builds. In development, service-worker caching should be disabled or easy to invalidate.

Run a production build before deployment.

Deployment priority:

1. If the Git repository is already connected to Vercel, push the branch and obtain its Preview URL.
2. Otherwise, if Vercel CLI authentication exists, run a preview deployment using `vercel --yes`.
3. If deployment authentication is unavailable, run the app on 0.0.0.0 and print the exact LAN URL for same-WiFi iPhone testing.
4. Do not deploy over an existing production environment unless the repository is already configured to do that safely.
5. Final output must prominently show the real iPhone test URL or the single blocking deployment step.

==================================================
6. NAVIGATION AND USER EXPERIENCE
==================================================

Use a simple mobile navigation pattern with three destinations:

Home
Conversation
Legacy

Do not add a separate Journey screen in Round 1.

The Story stage is the only active stage. Strategy, Brand, and Marketing must not appear as functional destinations.

HOME

Home should contain only:

1. A warm greeting that can use the client’s preferred name if known.
2. A steady Story progress indicator.
3. “One small thing for today.”
4. One primary action that opens Conversation.
5. A short Living Legacy map update linking to the map.

The Story progress indicator may show a percentage, but must not reveal the hidden requirements or a remaining-items checklist.

“One small thing for today” must be derived from the next missing Story evidence area and phrased as a natural invitation that feels possible in about ten minutes.

Example tone:

“Tell me about a decision you made when the obvious answer felt wrong.”

Do not use course language such as assignment, module, lesson, homework, required field, incomplete, or overdue.

CONVERSATION

The Conversation screen is the center of the product.

Requirements:

1. Streaming AI response.
2. Large readable message text.
3. One clear composer.
4. Send button.
5. Microphone button.
6. File upload button.
7. Visible but subtle recording state.
8. Visible file-processing state.
9. Graceful retry for network or model errors.
10. Preserve unsent text if the request fails.
11. Keep focus and scroll behavior reliable on iPhone.
12. Do not show internal tool calls, retrieved memories, source spans, or reasoning.

Conversation behavior:

1. Default response length is one to three short sentences.
2. Ask at most one question at a time.
3. First acknowledge what the client actually expressed.
4. Use Socratic questions and mindfulness principles.
5. Do not judge, lecture, diagnose, or treat the client as a student.
6. Help the client recover confidence in their own judgment.
7. Use gender-neutral language unless the client explicitly provides pronouns.
8. Never claim an action was completed unless the action succeeded.
9. Do not expose validation failures.
10. Do not use stale memory as if it were current.
11. Prefer plain language over consultant or AI language.
12. Simple questions receive simple answers.

The first assistant message must feel specific and human, not like a generic onboarding bot. It should invite natural reflection without asking several questions.

Do not start with a form.

==================================================
7. STORY STAGE BACKSTAGE MODEL
==================================================

Implement an internal Story Evidence Model. It is never displayed as a checklist.

Use these fixed evidence areas:

1. transition_context
   What changed, why now, and what feels uncertain.

2. identity_beyond_title
   How the client understands themselves beyond a role or organization.

3. career_chapters
   Important chapters, transitions, and patterns across the client’s career.

4. defining_moments
   Specific moments that changed how the client leads or decides.

5. challenges_and_recovery
   Difficult experiences, scars, resilience, and what was learned.

6. judgment_and_strengths
   Signature judgment, unusual abilities, and decisions only the client could make.

7. values_and_non_negotiables
   Principles, boundaries, and what the client will not trade away.

8. impact_and_proof
   People, organizations, or outcomes changed by the client’s work.

9. relationships_and_influences
   Important people, mentors, communities, traditions, and sources of wisdom.

10. future_direction
    What the client wants the next chapter to make possible.

11. voice_and_language
    Repeated phrases, rhythm, vocabulary, metaphors, and style signals from the client’s own words and uploaded writing.

12. tensions_and_contradictions
    Conflicting goals, changed beliefs, unresolved questions, and stale prior assumptions.

For each area store:

status: empty | emerging | supported | verified
coverage_score: 0 to 1
evidence_count
last_updated_at

Rules:

1. “emerging” requires at least one relevant source.
2. “supported” requires at least two distinct source spans or one detailed first-person account.
3. “verified” requires clear first-person evidence without an unresolved contradiction.
4. Story progress is calculated deterministically from these statuses.
5. The model must not invent evidence to increase progress.
6. The next conversation invitation is selected from the highest-value missing area, but phrased naturally.
7. Do not force the conversation to follow the list in order.
8. Preserve unrelated details. Do not discard information merely because it is not immediately useful to Story generation.

A reasonable deterministic progress formula is:

empty = 0
emerging = 0.35
supported = 0.7
verified = 1

Story progress = weighted average of all areas, rounded to the nearest whole number.

Use higher weight for:

transition_context
identity_beyond_title
defining_moments
judgment_and_strengths
values_and_non_negotiables
impact_and_proof
future_direction

Keep the weights in one configuration file with tests.

==================================================
8. FOUR-LAYER MEMORY
==================================================

Implement all four layers.

WORKING MEMORY

Current request, recent conversation messages, current tool result, and current open question.

It may live in the request/session context. It must not become the long-term source of truth.

EPISODIC MEMORY

Append-only records of what happened and when.

Each record should include:

id
client_id
occurred_at
summary
emotional_state
source_message_ids
source_file_ids
created_at

Do not silently rewrite prior episodes.

SEMANTIC MEMORY

Current higher-level conclusions such as values, long-term goals, preferred direction, relationships, and stable facts.

Each record should include:

id
client_id
category
statement
confidence
status: candidate | active | stale | superseded
valid_from
valid_to
source_ids
supersedes_id
last_confirmed_at
created_at
updated_at

When a new statement conflicts with an active semantic memory:

1. Do not silently choose.
2. Ask one natural clarification question.
3. After confirmation, mark the old record stale or superseded.
4. Keep the old record for historical traceability.

PROCEDURAL MEMORY

This is a separate rule library for mistakes the AI made and how it should behave next time. It must not be mixed with the client’s semantic memories.

Each record should include:

id
client_id
trigger
mistake
correction
rule
source_message_id
status: active | retired
created_at
updated_at

Examples:

Client correction:
“That is too long.”

Procedural rule:
“For this client, answer ordinary questions in no more than two sentences unless more detail is requested.”

Client correction:
“That does not sound like me.”

Procedural rule:
“Avoid the phrase pattern identified in the corrected output and prioritize the client’s first-person writing samples.”

Only create a procedural rule when the client explicitly corrects the AI or when a deterministic validation failure identifies a repeatable system mistake.

Retrieve active procedural rules before generating future responses.

Do not let one client’s procedural memory affect another client.

==================================================
9. WRITING STYLE LEARNING
==================================================

Implement an initial per-client style profile that learns from:

1. The client’s conversation messages.
2. Uploaded first-person writing samples.
3. Explicit client corrections.
4. Accepted generated text, if acceptance can be observed.

Do not train LoRA in Round 1.

Do not copy one static Elizabeth voice sample into every account.

Store interpretable style signals such as:

sentence_length
formality
directness
warmth
use_of_metaphor
preferred_vocabulary
avoided_phrases
rhythm_notes
sample_source_ids
last_updated_at

The profile is per client.

For ordinary dialogue, use the client’s communication preferences without impersonating the client.

For Story or content generation, use the client’s own style evidence more strongly.

Never claim that generated writing is “exactly the client’s voice.”

If insufficient style evidence exists, use a warm, plain default and continue learning.

==================================================
10. MEMORY CAPTURE AND RETRIEVAL LOOP
==================================================

After each successful user and assistant exchange:

1. Save the raw messages.
2. Extract episodic facts.
3. Extract emotional state separately.
4. Generate semantic memory candidates.
5. Update Story evidence coverage using source IDs.
6. Add verified insights to the Living Legacy database when appropriate.
7. Update the style profile.
8. Detect explicit client corrections that may create procedural memory.
9. Never overwrite raw source material.

Use a small or inexpensive model for structured extraction if the current provider supports a reliable lower-cost model. If only one valid model is configured, use it rather than inventing a model ID.

Use Zod schemas for all extraction outputs.

Retrieval:

1. Always filter by client_id before ranking.
2. Search active semantic memory, episodic memory, uploaded document chunks, procedural rules, and Living Legacy sources.
3. Use Postgres full-text search plus pgvector when available.
4. Fuse lexical and semantic rankings with RRF.
5. Prefer active current memory over stale memory.
6. Stale memory may be returned only as historical contrast and must be labeled internally.
7. Return no more than six high-value context items to the conversation model.
8. Include exact source IDs in internal context.
9. Never expose another client’s data.
10. If embeddings are temporarily unavailable, fall back to tenant-filtered full-text and recency retrieval without breaking chat.

Do not add GraphRAG.

==================================================
11. LIVING LEGACY DATABASE AND MAP
==================================================

Living Legacy is a persistent database, not a set of temporary cards.

Create legacy_entries with at least:

id
client_id
section
title
content
source_ids
evidence_status: emerging | supported | verified
created_at
updated_at

Use these fixed map sections for Round 1:

1. Personal Philosophy
2. Defining Stories
3. Judgment and Decisions
4. Courage and Turning Points
5. Work and Contribution
6. People and Relationships
7. Places and Experiences
8. Future Legacy

The map must look like one coherent landscape or puzzle, not eight dashboard cards.

Each section starts visually transparent or outlined.

Fill uses only #10192B or #A9AFB8 with opacity changes.

Suggested deterministic fill levels:

0 verified entries = 0 percent
1 verified entry = 35 percent
2 verified entries = 65 percent
3 or more verified entries = 100 percent

Supported but unverified entries may add a small amount of fill but cannot complete a section.

The Home screen should show one short map update, for example:

“Your Personal Philosophy is beginning to take shape.”

Do not fabricate an update when no section has changed.

Selecting a map section may open a simple detail view showing accumulated entries and their dates. Do not present entries as collectible achievement cards.

Prepare the data layer so full database export can be added later, but do not build a complete export system in this round.

==================================================
12. AUTOMATIC VALIDATION
==================================================

There is no human review fallback.

For generated Story or Legacy claims, every factual sentence must have supporting source IDs.

Validation has only two failure outcomes:

1. If a sentence lacks evidence, remove the sentence.
2. If essential information can only come from the client, convert the gap into one natural future question.

Do not show:

validation failed
verifier blocked
missing evidence
confidence too low
human review required

Do not send uncertain drafts to the client.

Implement a validation result such as:

{
  supportedStatements: [...],
  removedStatements: [...],
  followUpQuestion: string | null
}

The client receives only the supported result and, when appropriate, one natural follow-up question.

Ordinary conversation should use deterministic guards instead of a second model call on every message.

Required ordinary-response guards:

1. Authorization succeeded.
2. Retrieved context belongs to the current client.
3. Stale memory is not presented as current.
4. Output is non-empty.
5. Default answer is concise.
6. No unsupported “I completed/sent/saved/updated” claim.
7. At most one question unless the client asks for a list.
8. Tool results are represented accurately.

==================================================
13. FILE UPLOAD
==================================================

Support authenticated private uploads for:

PDF
PNG
JPG or JPEG
TXT
MD

Requirements:

1. Use a private Supabase Storage bucket if Supabase is configured.
2. Store objects under a client-scoped path.
3. Enforce RLS on storage objects.
4. Maximum Round 1 file size: 10 MB.
5. Validate MIME type and extension server-side.
6. Do not make uploaded files public.
7. Show upload and processing status.
8. TXT and MD must be extracted and indexed.
9. PDFs with extractable text must be parsed and indexed.
10. Images must be stored and passed through an existing configured multimodal model or OCR route if one is available.
11. If image extraction cannot run because a credential is missing, preserve the file, mark processing as pending, and state the missing integration in the final engineering report.
12. Chunk extracted text with structural context and source metadata.
13. Keep page number or section metadata when available.
14. Never place the Supabase service-role key in client code.

Uploaded first-person writing can contribute to voice_and_language Story evidence and the client style profile.

Uploaded content must never cross client boundaries.

==================================================
14. VOICE INPUT
==================================================

The microphone must work on iPhone over HTTPS.

Optimize for reliability rather than a fragile realtime demo.

Preferred Round 1 behavior:

1. Tap to start recording.
2. Tap to stop.
3. Upload the recorded audio.
4. Transcribe with Deepgram.
5. Put the transcript into the text composer.
6. Let the client edit it.
7. The client explicitly sends it.

Do not auto-send a transcript.

If the existing repository already has a stable streaming Deepgram implementation, preserve it. Otherwise use recorded-audio transcription for Round 1 because it is more reliable on iOS Safari.

Use a server route or temporary Deepgram token. Never expose a permanent Deepgram API key in browser code.

Handle:

microphone permission denied
empty recording
unsupported MIME type
network interruption
transcription timeout
very long recording
component unmount while recording

Provide a 5-minute maximum for Round 1 and show elapsed time.

No TTS and no AI voice playback.

==================================================
15. TOOL CALLING
==================================================

Use the existing AI SDK’s tool-calling mechanism.

Implement one safe deterministic calculator tool supporting:

addition
subtraction
multiplication
division
percentages
basic parentheses

Validate input. Do not evaluate arbitrary JavaScript.

Maximum tool loop depth: 3.

Do not display raw tool JSON to the client.

Structure the code so additional tools can be added later, but do not build browsing, email, calendar, payment, or destructive tools.

==================================================
16. MODEL GATEWAY
==================================================

Create or refine one model gateway.

Use environment-configured model IDs.

Roles:

small:
Structured extraction, memory capture, classification, style signal extraction.

workhorse:
All client-visible ordinary conversation. This must be a fast, high-quality model with strong human conversational ability. Do not use the cheapest low-quality model for client-visible conversation.

frontier:
Explicit strategic synthesis or formal Story generation.

verifier:
Formal artifact validation only. Not every conversation.

If separate valid models are not configured, use the existing working model for all roles and preserve the routing interface.

Do not invent model names.

Do not make an additional LLM call merely to select a model. Use deterministic routing.

==================================================
17. DATA ISOLATION AND DATABASE
==================================================

Use the existing Supabase project if configured.

For this Round 1 test, one Supabase project may contain one test client. The schema must still enforce client_id everywhere so it is safe to provision isolated projects per client later.

Every client-owned table must include client_id.

Enable RLS on all exposed client-owned tables.

Policies must require the authenticated user to belong to that client.

Required entities:

clients
client_memberships
conversations
messages
events
episodic_memories
semantic_memories
procedural_memories
style_profiles
uploaded_files
document_chunks
story_evidence
legacy_entries
ai_runs

Do not log raw prompt, raw response, transcript, uploaded document text, or private memory in ai_runs.

ai_runs may store only:

client_id
skill
model
token counts
latency
status
error category
created_at

Use migrations checked into the repository.

Add a seed path for one test client without hard-coding a real person’s private content.

If Supabase is not configured, implement a StorageAdapter interface and a local demo adapter so the app remains testable. The final report must clearly distinguish demo persistence from live Supabase persistence.

Never describe demo persistence as production privacy.

==================================================
18. ERROR HANDLING
==================================================

The client-facing error style must be calm and brief.

Examples:

“I lost the connection for a moment. Your words are still here.”

“I could not finish that upload. Please try it once more.”

Do not show stack traces, provider names, status codes, JSON, or database terminology.

Preserve user input on failure.

Use error boundaries where appropriate.

Add timeouts to external calls.

Avoid unlimited retries.

One retry is acceptable for safe idempotent operations.

==================================================
19. IMPLEMENTATION ORDER
==================================================

Execute in this order to protect the vertical slice:

1. Repository inspection and baseline checks.
2. Branch creation.
3. Brand tokens and mobile shell.
4. PWA manifest, icons, metadata, and safe-area behavior.
5. Navigation and the three surfaces.
6. Storage adapter and database migrations.
7. Client isolation and RLS policies.
8. Conversation persistence and streaming chat.
9. Model gateway and calculator tool.
10. Voice recording and transcription.
11. File upload and text extraction.
12. Four-layer memory capture.
13. Tenant-filtered retrieval.
14. Story Evidence Model and deterministic progress.
15. Living Legacy persistence and map.
16. Automatic evidence validation.
17. Unit, integration, security, and mobile tests.
18. Production build.
19. Preview deployment.
20. Final iPhone test instructions and engineering report.

If a later feature threatens the working conversation loop, preserve the loop and report the incomplete secondary feature honestly.

==================================================
20. REQUIRED TESTS
==================================================

Add tests before calling the work complete.

At minimum test:

1. Story progress math.
2. No Story progress from unsupported evidence.
3. Legacy map fill math.
4. Stale semantic memory is not treated as current.
5. Semantic supersession keeps historical data.
6. Procedural memory is separate from semantic memory.
7. Procedural memory is client-scoped.
8. Retrieved records are client-scoped.
9. RRF combines lexical and semantic results deterministically.
10. Calculator rejects arbitrary JavaScript.
11. Default assistant response contract permits no more than one question.
12. Validation removes unsupported statements.
13. Validation converts client-only missing information into one follow-up question.
14. File MIME and size validation.
15. Private file paths are client-scoped.
16. Model gateway falls back safely when only one valid model is configured.
17. Home does not expose the hidden Story checklist.
18. The client never sees internal statuses such as verifier failure.
19. All user-facing colors come from Brand Color 4.
20. Production build succeeds.

Add Playwright coverage using an iPhone-sized viewport for:

1. Home loads without horizontal overflow.
2. Home opens Conversation.
3. Text remains in the composer after a simulated failed request.
4. Conversation composer remains reachable at mobile height.
5. Legacy Map opens.
6. File picker accepts required types.
7. Navigation touch targets meet minimum size.
8. App manifest is reachable.

Where RLS testing is possible, prove that Client A cannot read Client B messages, memories, chunks, legacy entries, or files.

==================================================
21. DEFINITION OF DONE
==================================================

Do not declare completion until all applicable checks have been run.

Round 1 is done only when:

1. The production build passes.
2. The app opens from a real HTTPS URL or an explicitly reported LAN fallback.
3. The 390 x 844 viewport has no horizontal scrolling.
4. A user can send a text message and receive a streamed response.
5. A user can record voice, receive a transcript, edit it, and send it.
6. A user can upload at least TXT, MD, and a text-based PDF.
7. A later message can naturally reference one earlier fact and one earlier emotional state.
8. Story progress changes only from sourced evidence.
9. The Home screen shows progress without exposing the hidden checklist.
10. A verified insight can enter the Living Legacy database.
11. The Legacy Map fill changes deterministically.
12. Client-scoped data access is enforced.
13. The calculator tool works.
14. No permanent API key appears in browser bundles.
15. Tests and typecheck pass.
16. The branch is committed with a clear commit message.
17. A Preview URL is produced whenever deployment access exists.

==================================================
22. FINAL RESPONSE FORMAT
==================================================

After implementation, give me a concise engineering handoff with exactly these sections:

1. IPHONE TEST URL
   The actual Preview URL, production URL, or LAN URL.

2. HOW TO TEST ON IPHONE
   Exact steps, beginning with opening Safari.
   Include Add to Home Screen steps if the manifest is working.
   Include microphone permission steps.
   Include the recommended first three test messages.

3. WHAT WAS BUILT
   Brief list of completed user-visible and backend capabilities.

4. LIVE INTEGRATIONS
   Supabase:
   AI provider:
   Deepgram:
   Vercel:
   State whether each is live, demo, or blocked.

5. VERIFICATION
   List every command run and whether it passed.
   Include typecheck, tests, production build, and deployment.

6. KNOWN LIMITATIONS
   Only real limitations. Do not hide failures.

7. FILES CHANGED
   Concise grouped list.

8. NEXT HIGHEST-LEVERAGE FIX
   Exactly one recommendation based on the completed build.

Do not give me another architecture essay. Build the product, verify it, deploy it, and return the iPhone test URL.