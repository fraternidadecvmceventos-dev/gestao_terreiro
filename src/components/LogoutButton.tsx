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
    <button
      onClick={handleLogout}
      disabled={carregando}
      className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
    >
      {carregando ? "Saindo..." : "Sair"}
    </button>
  );
}
