"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to collections by default
    router.replace("/admin/collections");
  }, [router]);

  return (
    <div style={{ padding: "2rem", color: "white", fontFamily: "Orbitron" }}>
      <p>Redirecting to Collections...</p>
    </div>
  );
}
