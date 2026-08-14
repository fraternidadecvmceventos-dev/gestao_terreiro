"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function handleLogout() {
    setCarregando(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} disabled={carregando} className="blogout">
      {carregando ? "Saindo..." : "Sair"}
    </button>
  );
}
