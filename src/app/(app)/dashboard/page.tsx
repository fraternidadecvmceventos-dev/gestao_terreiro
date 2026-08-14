import { db } from "@/db";
import { membros, pagamentos, doacoes, despesas } from "@/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { formatarMoeda, formatarMesReferencia, mesReferenciaAtual } from "@/lib/format";
import Link from "next/link";

// Este dashboard consulta o banco a cada carregamento (saldo, pendências
// etc. mudam o tempo todo) — nunca deve ser pré-renderizado estaticamente
// no build, senão os visitantes veriam sempre os números do momento do
// deploy.
export const dynamic = "force-dynamic";

function limitesDoMes(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const inicio = `${mes}-01`;
  const proximoMes =
    mesNum === 12 ? `${ano + 1}-01` : `${ano}-${String(mesNum + 1).padStart(2, "0")}`;
  return { inicio, fim: `${proximoMes}-01` };
}

export default async function DashboardPage() {
  const mes = mesReferenciaAtual();
  const { inicio, fim } = limitesDoMes(mes);

  const [{ totalAtivos }] = await db
    .select({ totalAtivos: sql<number>`count(*)::int` })
    .from(membros)
    .where(eq(membros.ativo, true));

  const pagamentosMes = await db
    .select()
    .from(pagamentos)
    .where(eq(pagamentos.mesReferencia, mes));

  const totalRecebidoMensalidades = pagamentosMes
    .filter((p) => p.status === "pago")
    .reduce((soma, p) => soma + Number(p.valor), 0);
  const pagas = pagamentosMes.filter((p) => p.status === "pago").length;
  const pendentes = pagamentosMes.filter((p) => p.status === "pendente").length;
  const atrasados = pagamentosMes.filter((p) => p.status === "atrasado").length;

  const doacoesMes = await db
    .select()
    .from(doacoes)
    .where(and(gte(doacoes.data, inicio), lt(doacoes.data, fim)));
  const totalDoacoes = doacoesMes.reduce((soma, d) => soma + Number(d.valor), 0);

  const despesasMes = await db
    .select()
    .from(despesas)
    .where(and(gte(despesas.data, inicio), lt(despesas.data, fim)));
  const totalDespesas = despesasMes.reduce((soma, d) => soma + Number(d.valor), 0);

  const totalEntradas = totalRecebidoMensalidades + totalDoacoes;
  const saldoMes = totalEntradas - totalDespesas;

  return (
    <div className="space-y-6">
      <div className="head">
        <div>
          <h1>Dashboard</h1>
          <p className="hsub">Resumo de {formatarMesReferencia(mes)}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/relatorios" className="btn-secondary">
            Gerar prestação de contas
          </Link>
          <Link href="/pagamentos" className="btn-primary">
            Ver mensalidades
          </Link>
        </div>
      </div>

      <div className="rail">
        <div className="rl">
          <div className="rl-l">Membros ativos</div>
          <div className="rl-v num">{totalAtivos}</div>
        </div>
        <div className="rl">
          <div className="rl-l">Mensalidades recebidas</div>
          <div className="rl-v num">{formatarMoeda(totalRecebidoMensalidades)}</div>
        </div>
        <div className="rl">
          <div className="rl-l">Doações recebidas</div>
          <div className="rl-v num">{formatarMoeda(totalDoacoes)}</div>
        </div>
        <div className="rl">
          <div className="rl-l">Despesas do mês</div>
          <div className="rl-v num">{formatarMoeda(totalDespesas)}</div>
        </div>
        <div className="rl">
          <div className="rl-l">Saldo do mês</div>
          <div className="rl-v num" style={{ color: saldoMes >= 0 ? "var(--ok)" : "var(--risk)" }}>
            {formatarMoeda(saldoMes)}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--txt)" }}>
          Mensalidades de {formatarMesReferencia(mes)}
        </h2>
        <div className="flex flex-wrap gap-2">
          <span className="badge badge-ok">Pagas: {pagas}</span>
          <span className="badge badge-att">Pendentes: {pendentes}</span>
          <span className="badge badge-risk">Atrasadas: {atrasados}</span>
        </div>
      </div>
    </div>
  );
}
