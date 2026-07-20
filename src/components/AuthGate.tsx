"use client";

import { useState, type FormEvent } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import styles from "./AuthGate.module.css";

/**
 * Invited-pilot sign-in. Email and password only.
 * Public signup is disabled in the Supabase project settings.
 */
export default function AuthGate({ demoMode = false }: { demoMode?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [demoWord, setDemoWord] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (demoMode) {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ password: demoWord }),
        });
        if (!res.ok) {
          setError("That word did not work. Please try again.");
          return;
        }
        window.location.reload();
        return;
      }

      const supabase = createBrowserSupabase();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signError) {
        setError("I could not sign you in. Please check your details.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Something interrupted that for a moment. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.gate}>
      <div className={styles.card}>
        <p className={`serif ${styles.brand}`}>NextAct</p>
        <h1 className={styles.title}>Your private space</h1>
        <p className={styles.lead}>
          This belongs to you alone. Sign in with the invitation you received.
        </p>

        <form className={styles.form} onSubmit={onSubmit}>
          {demoMode ? (
            <label className={styles.label}>
              Access word
              <input
                className={styles.input}
                type="password"
                autoComplete="current-password"
                value={demoWord}
                onChange={(e) => setDemoWord(e.target.value)}
                required
              />
            </label>
          ) : (
            <>
              <label className={styles.label}>
                Email
                <input
                  className={styles.input}
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className={styles.label}>
                Password
                <input
                  className={styles.input}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
            </>
          )}

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <button className={styles.submit} type="submit" disabled={pending}>
            {pending ? "Opening…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
