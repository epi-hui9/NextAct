import { NextResponse } from "next/server";
import webpush from "web-push";
import { db } from "@/server/db";
import { resolveSession } from "@/features/auth/server/session";
import { getVapidCredentials, isVapidConfigured } from "@/features/reminders/vapid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await resolveSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  if (!isVapidConfigured()) {
    return NextResponse.json(
      { error: "Web Push credentials are missing" },
      { status: 503 },
    );
  }

  const { publicKey, privateKey, subject } = getVapidCredentials();
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const subs = await db.listPushSubscriptions(session.userId);
  if (subs.length === 0) {
    return NextResponse.json(
      { error: "No subscription on this account" },
      { status: 400 },
    );
  }

  const payload = JSON.stringify({
    title: "A moment for what comes next",
    body: "Your reflection is ready whenever you are.",
  });

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      );
      sent += 1;
    } catch (err) {
      const statusCode =
        err && typeof err === "object" && "statusCode" in err
          ? Number((err as { statusCode?: number }).statusCode)
          : 0;
      if (statusCode === 404 || statusCode === 410) {
        await db.deletePushSubscription(session.userId, sub.endpoint);
      }
    }
  }

  return NextResponse.json({ ok: sent > 0, sent });
}
