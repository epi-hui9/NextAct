import { NextResponse } from "next/server";
import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/server";
import { getVapidCredentials, isVapidConfigured } from "@/lib/push/vapid";
import { localDateAndHour, shouldSendReminder } from "@/lib/push/scheduler";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Invoked by Supabase Cron / external scheduler with CRON_SECRET.
 * Idempotent per user local date. Notification body never includes private text.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!isSupabaseConfigured() || !isVapidConfigured()) {
    return NextResponse.json(
      { error: "Scheduler prerequisites missing" },
      { status: 503 },
    );
  }

  const { publicKey, privateKey, subject } = getVapidCredentials();
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const supabase = createServiceClient();
  const now = new Date();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "user_id, timezone, reminder_enabled, reminder_last_sent_local_date",
    )
    .eq("reminder_enabled", true);
  if (error) {
    return NextResponse.json({ error: "profile_query_failed" }, { status: 500 });
  }

  let attempted = 0;
  let sent = 0;

  for (const profile of profiles ?? []) {
    const enabled = Boolean(profile.reminder_enabled);
    const timeZone = String(profile.timezone || "America/Chicago");
    const last = profile.reminder_last_sent_local_date as string | null;
    if (
      !shouldSendReminder({
        now,
        timeZone,
        reminderEnabled: enabled,
        lastSentLocalDate: last,
      })
    ) {
      continue;
    }

    attempted += 1;
    const { localDate } = localDateAndHour(now, timeZone);
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", profile.user_id);

    let delivered = false;
    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: "A moment for what comes next",
            body: "Your quiet reflection is ready whenever you are.",
          }),
        );
        delivered = true;
      } catch (err) {
        const statusCode =
          err && typeof err === "object" && "statusCode" in err
            ? Number((err as { statusCode?: number }).statusCode)
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", profile.user_id)
            .eq("endpoint", sub.endpoint);
        }
      }
    }

    await supabase.from("reminder_deliveries").upsert(
      {
        user_id: profile.user_id,
        local_date: localDate,
        status: delivered ? "sent" : "failed",
        error_category: delivered ? null : "no_delivery",
      },
      { onConflict: "user_id,local_date" },
    );

    if (delivered) {
      sent += 1;
      await supabase
        .from("profiles")
        .update({
          reminder_last_sent_local_date: localDate,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user_id);
    }
  }

  return NextResponse.json({ ok: true, attempted, sent });
}
