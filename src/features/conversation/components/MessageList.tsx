"use client";

import { motion } from "framer-motion";
import type { UIMessage } from "ai";
import StreamingDot from "./StreamingDot";
import styles from "./MessageList.module.css";

/** Flatten a UIMessage's parts into plain text. */
function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

export default function MessageList({
  messages,
  status,
}: {
  messages: UIMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
}) {
  // Show the breathing dot after sending, until the first token arrives.
  const awaitingReply =
    status === "submitted" &&
    (messages.length === 0 || messages[messages.length - 1]?.role === "user");

  return (
    <div className={styles.list}>
      {messages.map((message) => {
        const text = messageText(message);
        if (!text) return null;
        const isUser = message.role === "user";
        return (
          <motion.div
            key={message.id}
            className={`${styles.row} ${isUser ? styles.user : styles.assistant}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <p className={styles.text}>{text}</p>
          </motion.div>
        );
      })}

      {awaitingReply && (
        <div className={`${styles.row} ${styles.assistant}`}>
          <StreamingDot />
        </div>
      )}
    </div>
  );
}
