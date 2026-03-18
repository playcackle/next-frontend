"use client";

import { usePathname, useRouter } from "next/navigation";
import styles from "./layout.module.css";

const navItems = [
  { path: "/admin/collections", label: "COLLECTIONS" },
  { path: "/admin/topics", label: "TOPICS" },
  { path: "/admin/lobbies", label: "GAMEROOMS" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className={styles.tabNav}>
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`${styles.tab} ${pathname.startsWith(item.path) ? styles.active : ""}`}
          onClick={() => router.push(item.path)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
