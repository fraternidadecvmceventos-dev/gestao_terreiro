"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export type ConsulenteFormValues = {
  nome: string;
  whatsapp: string;
  valorMensalidade: string;
  diaVencimento: string;
  ativo: boolean;
  observacao: string;
};

const VAZIO: ConsulenteFormValues = {
  nome: "",
  whatsapp: "",
  valorMensalidade: "",
  diaVencimento: "5",
  ativo: true,
  observacao: "",
};

export function ConsulenteForm({
  valoresIniciais,
  modo,
  consulenteId,
}: {
  valoresIniciais?: Partial<ConsulenteFormValues>;
  modo: "criar" | "editar";
  consulenteId?: number;
}) {
  const router = useRouter();
  const [valores, setValores] = useState<ConsulenteFormValues>({ ...VAZIO, ...valoresIniciais });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function atualizar<K extends keyof ConsulenteFormValues>(campo: K, valor: ConsulenteFormValues[K]) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const payload = {
      nome: valores.nome,
      whatsapp: valores.whatsapp,
      valorMensalidade: valores.valorMensalidade,
      diaVencimento: valores.diaVencimento,
      ativo: valores.ativo,
      observacao: valores.observacao || null,
    };

    try {
      const url = modo === "criar" ? "/api/consulentes" : `/api/consulentes/${consulenteId}`;
      const method = modo === "criar" ? "POST" : "PATCH";
      const resposta = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados?.erro ?? "Não foi possível salvar.");
        return;
      }
      router.push("/consulentes");
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-lg space-y-4">
      <div>
        <label className="label" htmlFor="nome">Nome completo</label>
        <input
          id="nome"
          className="input"
          value={valores.nome}
          onChange={(e) => atualizar("nome", e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="whatsapp">WhatsApp</label>
        <input
          id="whatsapp"
          className="input"
          placeholder="(11) 91234-5678"
          value={valores.whatsapp}
          onChange={(e) => atualizar("whatsapp", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="valor">Valor da mensalidade (R$)</label>
          <input
            id="valor"
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={valores.valorMensalidade}
            onChange={(e) => atualizar("valorMensalidade", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="vencimento">Dia de vencimento</label>
          <input
            id="vencimento"
            type="number"
            min="1"
            max="28"
            className="input"
            value={valores.diaVencimento}
            onChange={(e) => atualizar("diaVencimento", e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="observacao">Observação (opcional)</label>
        <textarea
          id="observacao"
          className="input"
          rows={2}
          value={valores.observacao}
          onChange={(e) => atualizar("observacao", e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={valores.ativo}
          onChange={(e) => atualizar("ativo", e.target.checked)}
        />
        Consulente ativo (recebe cobranças)
      </label>

      {erro && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.push("/consulentes")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
