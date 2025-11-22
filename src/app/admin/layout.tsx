"use client";

import { usePathname, useRouter } from "next/navigation";
import styles from "./layout.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { path: "/admin/collections", label: "COLLECTIONS", icon: "📚" },
    { path: "/admin/topics", label: "TOPICS", icon: "🎯" },
    { path: "/admin/lobbies", label: "LOBBIES", icon: "🎮" },
  ];

  return (
    <div className={styles.adminContainer}>
      <nav className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.adminTitle}>
            <span className={styles.neonText}>ADMIN</span>
            <span className={styles.neonTextPink}>PANEL</span>
          </h1>
        </div>

        <div className={styles.navItems}>
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`${styles.navItem} ${
                pathname.startsWith(item.path) ? styles.active : ""
              }`}
              onClick={() => router.push(item.path)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.backButton}
            onClick={() => router.push("/")}
          >
            ← BACK TO GAME
          </button>
        </div>
      </nav>

      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
