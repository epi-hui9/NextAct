import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { resolveSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  timezone: z.string().min(1).max(80),
});

export async function POST(req: Request) {
  const session = await resolveSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  await db.upsertPushSubscription({
    user_id: session.userId,
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
    user_agent: req.headers.get("user-agent"),
  });
  await db.setReminderPrefs(session.userId, {
    enabled: true,
    timezone: body.timezone,
  });

  return NextResponse.json({ ok: true });
}
