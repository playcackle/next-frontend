"use client"

import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import styles from "./layout.module.css"
import SynthwaveBackground from "@/components/synthwave-background"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { path: "/admin/collections", label: "COLLECTIONS" },
    { path: "/admin/topics", label: "TOPICS" },
    { path: "/admin/lobbies", label: "GAMEROOMS" },
  ]

  return (
    <div className={styles.container}>
      <SynthwaveBackground />

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

      <main className={styles.mainContent}>{children}</main>
    </div>
  )
}
