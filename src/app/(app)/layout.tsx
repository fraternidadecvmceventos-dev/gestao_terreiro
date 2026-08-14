import { NavLink } from "@/components/NavLink";
import { LogoutButton } from "@/components/LogoutButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const nomeTerreiro = process.env.TERREIRO_NAME || "Terreiro";

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-60 shrink-0 flex-col bg-zinc-800 px-3 py-5">
        <div className="mb-6 px-2">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Gestão do</p>
          <h2 className="text-lg font-bold text-white">{nomeTerreiro}</h2>
        </div>
        <nav className="flex-1 space-y-1">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/consulentes">Consulentes</NavLink>
          <NavLink href="/pagamentos">Mensalidades</NavLink>
          <NavLink href="/doacoes">Doações</NavLink>
          <NavLink href="/despesas">Despesas</NavLink>
          <NavLink href="/relatorios">Relatórios</NavLink>
        </nav>
        <div className="border-t border-zinc-700 pt-3">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
