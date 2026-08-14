import { db } from "@/db";
import { consulentes, pagamentos, doacoes, despesas } from "@/db/schema";
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
    .from(consulentes)
    .where(eq(consulentes.ativo, true));

  const pagamentosMes = await db
    .select()
    .from(pagamentos)
    .where(eq(pagamentos.mesReferencia, mes));

  const totalRecebidoMensalidades = pagamentosMes
    .filter((p) => p.status === "pago")
    .reduce((soma, p) => soma + Number(p.valor), 0);
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

  const cartoes = [
    { titulo: "Consulentes ativos", valor: String(totalAtivos), destaque: false },
    { titulo: "Mensalidades recebidas", valor: formatarMoeda(totalRecebidoMensalidades), destaque: false },
    { titulo: "Doações recebidas", valor: formatarMoeda(totalDoacoes), destaque: false },
    { titulo: "Despesas do mês", valor: formatarMoeda(totalDespesas), destaque: false },
    {
      titulo: "Saldo do mês",
      valor: formatarMoeda(saldoMes),
      destaque: true,
      positivo: saldoMes >= 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500">Resumo de {formatarMesReferencia(mes)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cartoes.map((c) => (
          <div key={c.titulo} className="card">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {c.titulo}
            </p>
            <p
              className={`mt-2 text-xl font-bold ${
                c.destaque ? (c.positivo ? "text-emerald-700" : "text-red-700") : "text-zinc-900"
              }`}
            >
              {c.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Mensalidades de {formatarMesReferencia(mes)}</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="badge bg-emerald-100 text-emerald-800">
            Pagas: {pagamentosMes.filter((p) => p.status === "pago").length}
          </span>
          <span className="badge bg-amber-100 text-amber-800">Pendentes: {pendentes}</span>
          <span className="badge bg-red-100 text-red-800">Atrasadas: {atrasados}</span>
        </div>
        <div className="mt-4 flex gap-3">
          <Link href="/pagamentos" className="btn-primary">
            Ver mensalidades do mês
          </Link>
          <Link href="/relatorios" className="btn-secondary">
            Gerar prestação de contas
          </Link>
        </div>
      </div>
    </div>
  );
}
