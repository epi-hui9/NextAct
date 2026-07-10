import { NextResponse } from "next/server";
import { AUTH_COOKIE, createSessionToken, isPasswordCorrect } from "@/lib/auth";

// 7 days. The gate is a soft door for two viewers, not a security boundary.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(req: Request) {
  let password: unknown;
  try {
    const body = await req.json();
    password = body?.password;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isPasswordCorrect(password)) {
    // Restrained, generic message — no hint about why it failed.
    return NextResponse.json(
      { error: "That isn't the word." },
      { status: 401 },
    );
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}
