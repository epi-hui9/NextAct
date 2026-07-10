"use client";

import { motion } from "framer-motion";
import styles from "./StreamingDot.module.css";

/**
 * A slow "breathing" amber dot — the only typing/streaming indicator.
 * No spinner, no bouncing.
 */
export default function StreamingDot() {
  return (
    <motion.span
      className={styles.dot}
      aria-label="Thinking"
      role="status"
      animate={{ opacity: [0.25, 1, 0.25] }}
      transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
    />
  );
}
