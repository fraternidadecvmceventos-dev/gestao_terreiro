"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatarMoeda } from "@/lib/format";

type Consulente = {
  id: number;
  nome: string;
  whatsapp: string;
  valorMensalidade: string;
  diaVencimento: number;
  ativo: boolean;
};

export default function ConsulentesPage() {
  const [lista, setLista] = useState<Consulente[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const resposta = await fetch("/api/consulentes");
    const dados = await resposta.json();
    setLista(dados);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternarAtivo(consulente: Consulente) {
    await fetch(`/api/consulentes/${consulente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !consulente.ativo }),
    });
    carregar();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Consulentes</h1>
        <Link href="/consulentes/novo" className="btn-primary">
          + Novo consulente
        </Link>
      </div>

      <div className="card overflow-x-auto">
        {carregando ? (
          <p className="text-sm text-zinc-500">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhum consulente cadastrado ainda. Clique em &quot;Novo consulente&quot; para começar.
          </p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Nome</th>
                <th>WhatsApp</th>
                <th>Mensalidade</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium text-zinc-900">{c.nome}</td>
                  <td>{c.whatsapp}</td>
                  <td>{formatarMoeda(c.valorMensalidade)}</td>
                  <td>Dia {c.diaVencimento}</td>
                  <td>
                    <span
                      className={`badge ${
                        c.ativo ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {c.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="space-x-2 text-right">
                    <Link href={`/consulentes/${c.id}`} className="btn-secondary">
                      Editar
                    </Link>
                    <button className="btn-secondary" onClick={() => alternarAtivo(c)}>
                      {c.ativo ? "Inativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
