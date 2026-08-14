import { NavLink } from "@/components/NavLink";
import { LogoutButton } from "@/components/LogoutButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const nomeTerreiro = process.env.TERREIRO_NAME || "Terreiro";

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <div className="band">
        <div className="band-top">
          <div className="bmark">
            <svg width="20" height="15" viewBox="0 0 34 26" fill="none" aria-hidden="true">
              <path d="M2 22C6 11 14 3.5 24 1c-3 9-9.5 16.5-18 21z" fill="#7AC143" />
              <path d="M9 25C13.5 13 21 5.5 32 2c-2.5 11-9.5 19.5-19.5 23z" fill="#1B7FA8" />
            </svg>
            {nomeTerreiro.toUpperCase()}
          </div>
          <nav className="bnav">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/membros">Membros</NavLink>
            <NavLink href="/pagamentos">Mensalidades</NavLink>
            <NavLink href="/doacoes">Doações</NavLink>
            <NavLink href="/despesas">Despesas</NavLink>
            <NavLink href="/relatorios">Relatórios</NavLink>
          </nav>
          <div className="bright">
            <LogoutButton />
          </div>
        </div>
      </div>
      <div className="horizon" />
      <main className="wrap flex-1">{children}</main>
    </div>
  );
}
