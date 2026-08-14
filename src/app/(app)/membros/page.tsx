"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatarMoeda } from "@/lib/format";

type Membro = {
  id: number;
  nome: string;
  whatsapp: string;
  valorMensalidade: string;
  diaVencimento: number;
  ativo: boolean;
};

export default function MembrosPage() {
  const [lista, setLista] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const resposta = await fetch("/api/membros");
    const dados = await resposta.json();
    setLista(dados);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternarAtivo(membro: Membro) {
    await fetch(`/api/membros/${membro.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !membro.ativo }),
    });
    carregar();
  }

  async function excluir(membro: Membro) {
    const confirmado = window.confirm(
      `Excluir "${membro.nome}" definitivamente? Isso também apaga o histórico de mensalidades e mensagens desse membro. Se for só uma pausa, prefira "Inativar".`
    );
    if (!confirmado) return;
    await fetch(`/api/membros/${membro.id}`, { method: "DELETE" });
    carregar();
  }

  return (
    <div className="space-y-4">
      <div className="head">
        <h1>Membros</h1>
        <Link href="/membros/novo" className="btn-primary">
          + Novo membro
        </Link>
      </div>

      <div className="card overflow-x-auto">
        {carregando ? (
          <p className="text-sm text-zinc-500">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhum membro cadastrado ainda. Clique em &quot;Novo membro&quot; para começar.
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
              {lista.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium" style={{ color: "var(--txt)" }}>{m.nome}</td>
                  <td>{m.whatsapp}</td>
                  <td>{formatarMoeda(m.valorMensalidade)}</td>
                  <td>Dia {m.diaVencimento}</td>
                  <td>
                    <span className={`badge ${m.ativo ? "badge-ok" : "badge-wait"}`}>
                      {m.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="space-x-2 text-right">
                    <Link href={`/membros/${m.id}`} className="btn-secondary">
                      Editar
                    </Link>
                    <button className="btn-secondary" onClick={() => alternarAtivo(m)}>
                      {m.ativo ? "Inativar" : "Ativar"}
                    </button>
                    <button className="btn-danger" onClick={() => excluir(m)}>
                      Excluir
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
