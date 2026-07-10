"use client";

import { motion } from "framer-motion";
import styles from "./Welcome.module.css";

/**
 * The single serif welcome line. Fades and rises once on load.
 */
export default function Welcome() {
  return (
    <motion.h1
      className={`serif ${styles.welcome}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      What&rsquo;s stirring tonight?
    </motion.h1>
  );
}
