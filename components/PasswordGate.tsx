"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import styles from "./PasswordGate.module.css";

export default function PasswordGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Reload so the server re-renders the page with the chat.
        window.location.reload();
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "That isn't the word.");
      setPassword("");
    } catch {
      setError("Something went quiet. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.screen}>
      <motion.form
        className={styles.form}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <input
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Enter the word"
          autoFocus
          autoComplete="current-password"
          aria-label="Access password"
          aria-invalid={error ? true : undefined}
        />
        <motion.p
          className={styles.error}
          aria-live="polite"
          initial={false}
          animate={{ opacity: error ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {error ?? "\u00a0"}
        </motion.p>
      </motion.form>
    </main>
  );
}
