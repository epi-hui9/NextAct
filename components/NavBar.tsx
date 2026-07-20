"use client";

import styles from "./NavBar.module.css";

/** Primary destinations only. Talk opens from Home, never from the tab bar. */
export type NavTab = "home" | "journey" | "legacy";
export type Tab = NavTab | "conversation";

const ITEMS: { tab: NavTab; label: string; icon: React.ReactNode }[] = [
  {
    tab: "home",
    label: "Home",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 11.5 12 5l8 6.5M6 10.5V19h12v-8.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    tab: "journey",
    label: "Path",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 19V9M12 19V5M18 19v-7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="6" cy="7" r="2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="18" cy="10" r="2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    tab: "legacy",
    label: "Legacy",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 20v-7M12 13c-3.2-1.2-5.2-3.4-5.5-6.2.9 1.1 2.2 1.8 3.6 2M12 13c3.2-1.2 5.2-3.4 5.5-6.2-.9 1.1-2.2 1.8-3.6 2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 9.5c-1.4-2.2-1.6-4.2-.8-6.2.4 1.4 1.2 2.4 2.2 3.1"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 20h8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function NavBar({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (tab: NavTab) => void;
}) {
  return (
    <nav className={styles.nav} aria-label="Primary">
      {ITEMS.map((item) => {
        const active = item.tab === tab;
        return (
          <button
            key={item.tab}
            type="button"
            className={`${styles.item} ${active ? styles.active : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(item.tab)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
