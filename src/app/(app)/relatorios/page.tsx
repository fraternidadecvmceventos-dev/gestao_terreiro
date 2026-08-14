"use client";

import { useState } from "react";
import { mesReferenciaAtual, formatarMesReferencia } from "@/lib/format";

export default function RelatoriosPage() {
  const [mes, setMes] = useState(mesReferenciaAtual());

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">Relatórios</h1>

      <div className="card max-w-md space-y-4">
        <div>
          <label className="label" htmlFor="mes">Mês de referência</label>
          <input
            id="mes"
            type="month"
            className="input"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
          />
        </div>
        <p className="text-sm text-zinc-500">
          Gera a planilha de prestação de contas de {formatarMesReferencia(mes)} com as abas de
          Mensalidades, Doações, Despesas e Resumo e Balanço, já com os dados lançados no sistema.
        </p>
        <a
          className="btn-primary"
          href={`/api/relatorios/export?mes=${mes}`}
          download={`prestacao-de-contas-${mes}.xlsx`}
        >
          Baixar planilha (.xlsx)
        </a>
      </div>
    </div>
  );
}
