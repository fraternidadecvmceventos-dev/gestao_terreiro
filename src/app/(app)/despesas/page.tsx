"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import { formatarMoeda, mesReferenciaAtual, formatarMesReferencia, dataHojeISO } from "@/lib/format";

type Despesa = {
  id: number;
  data: string;
  categoria: string;
  descricao: string;
  valor: string;
  formaPagamento: string | null;
};

const VAZIO = {
  data: dataHojeISO(),
  categoria: "",
  descricao: "",
  valor: "",
  formaPagamento: "PIX",
};

export default function DespesasPage() {
  const [mes, setMes] = useState(mesReferenciaAtual());
  const [lista, setLista] = useState<Despesa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const resposta = await fetch(`/api/despesas?mes=${mes}`);
    const dados = await resposta.json();
    setLista(dados.despesas);
    setCarregando(false);
  }, [mes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const resposta = await fetch("/api/despesas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados?.erro ?? "Não foi possível salvar.");
        return;
      }
      setForm(VAZIO);
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: number) {
    await fetch(`/api/despesas/${id}`, { method: "DELETE" });
    carregar();
  }

  const total = lista.reduce((soma, d) => soma + Number(d.valor), 0);

  return (
    <div className="space-y-4">
      <div className="head">
        <div>
          <h1>Despesas</h1>
          <p className="hsub">{formatarMesReferencia(mes)}</p>
        </div>
        <input
          type="month"
          className="input w-auto"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
        />
      </div>

      <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-3 sm:grid-cols-6">
        <input
          type="date"
          className="input"
          value={form.data}
          onChange={(e) => setForm({ ...form, data: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Categoria (ex.: Aluguel)"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          required
        />
        <input
          className="input sm:col-span-2"
          placeholder="Descrição"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          required
        />
        <input
          type="number"
          step="0.01"
          min="0.01"
          className="input"
          placeholder="Valor"
          value={form.valor}
          onChange={(e) => setForm({ ...form, valor: e.target.value })}
          required
        />
        <select
          className="input"
          value={form.formaPagamento}
          onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })}
        >
          <option>PIX</option>
          <option>Dinheiro</option>
          <option>Cartão</option>
          <option>Transferência</option>
          <option>Outro</option>
        </select>
        <div className="sm:col-span-6">
          <button className="btn-primary" disabled={salvando}>
            {salvando ? "Salvando..." : "Lançar despesa"}
          </button>
        </div>
        {erro && <p className="sm:col-span-6 text-sm text-red-700">{erro}</p>}
      </form>

      <div className="card overflow-x-auto">
        {carregando ? (
          <p className="text-sm text-zinc-500">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma despesa lançada neste mês.</p>
        ) : (
          <>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Categoria</th>
                  <th>Descrição</th>
                  <th>Forma</th>
                  <th>Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((d) => (
                  <tr key={d.id}>
                    <td>{d.data}</td>
                    <td>{d.categoria}</td>
                    <td>{d.descricao}</td>
                    <td>{d.formaPagamento || "—"}</td>
                    <td>{formatarMoeda(d.valor)}</td>
                    <td className="text-right">
                      <button className="btn-danger" onClick={() => remover(d.id)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-right text-sm font-semibold" style={{ color: "var(--txt2)" }}>
              Total do mês: {formatarMoeda(total)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
