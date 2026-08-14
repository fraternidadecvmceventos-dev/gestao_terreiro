"use client";

import { useEffect, useState, useCallback } from "react";
import { formatarMoeda, formatarMesReferencia, mesReferenciaAtual, dataHojeISO } from "@/lib/format";

type LinhaPagamento = {
  id: number;
  mesReferencia: string;
  valor: string;
  status: "pendente" | "pago" | "atrasado";
  dataPagamento: string | null;
  formaPagamento: string | null;
  observacao: string | null;
  consulenteId: number;
  consulenteNome: string;
  consulenteWhatsapp: string;
  diaVencimento: number;
};

const STATUS_LABEL: Record<string, string> = { pendente: "Pendente", pago: "Pago", atrasado: "Atrasado" };
const STATUS_CLASSE: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800",
  pago: "bg-emerald-100 text-emerald-800",
  atrasado: "bg-red-100 text-red-800",
};

export default function PagamentosPage() {
  const [mes, setMes] = useState(mesReferenciaAtual());
  const [linhas, setLinhas] = useState<LinhaPagamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [enviandoId, setEnviandoId] = useState<number | null>(null);
  const [enviandoLote, setEnviandoLote] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const resposta = await fetch(`/api/pagamentos?mes=${mes}`);
    const dados = await resposta.json();
    setLinhas(dados.pagamentos);
    setCarregando(false);
  }, [mes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function gerarCobrancas() {
    setMensagem(null);
    const resposta = await fetch("/api/pagamentos/gerar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mes }),
    });
    const dados = await resposta.json();
    setMensagem(
      `Cobranças geradas: ${dados.criados} nova(s) de ${dados.totalAtivos} consulente(s) ativo(s).`
    );
    carregar();
  }

  async function marcarComoPago(linha: LinhaPagamento) {
    await fetch(`/api/pagamentos/${linha.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "pago",
        dataPagamento: dataHojeISO(),
        formaPagamento: linha.formaPagamento || "PIX",
      }),
    });
    carregar();
  }

  async function reabrirPagamento(linha: LinhaPagamento) {
    await fetch(`/api/pagamentos/${linha.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pendente", dataPagamento: null }),
    });
    carregar();
  }

  async function enviarLembrete(linha: LinhaPagamento) {
    setEnviandoId(linha.id);
    setMensagem(null);
    const resposta = await fetch("/api/whatsapp/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pagamentoId: linha.id }),
    });
    const dados = await resposta.json();
    setMensagem(resposta.ok ? `Mensagem enviada para ${linha.consulenteNome}.` : `Erro: ${dados.erro}`);
    setEnviandoId(null);
  }

  async function enviarParaTodos() {
    setEnviandoLote(true);
    setMensagem(null);
    const resposta = await fetch("/api/whatsapp/enviar-lote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mes }),
    });
    const dados = await resposta.json();
    setMensagem(
      `Envio em lote concluído: ${dados.enviadosComSucesso} com sucesso, ${dados.falhas} falha(s), de ${dados.total} pendente(s)/atrasado(s).`
    );
    setEnviandoLote(false);
    carregar();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Mensalidades</h1>
          <p className="text-sm text-zinc-500">{formatarMesReferencia(mes)}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            className="input w-auto"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
          />
          <button className="btn-secondary" onClick={gerarCobrancas}>
            Gerar cobranças do mês
          </button>
          <button className="btn-primary" onClick={enviarParaTodos} disabled={enviandoLote}>
            {enviandoLote ? "Enviando..." : "Enviar WhatsApp p/ pendentes"}
          </button>
        </div>
      </div>

      {mensagem && (
        <p className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700">{mensagem}</p>
      )}

      <div className="card overflow-x-auto">
        {carregando ? (
          <p className="text-sm text-zinc-500">Carregando...</p>
        ) : linhas.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhuma cobrança gerada para este mês ainda. Clique em &quot;Gerar cobranças do
            mês&quot;.
          </p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Consulente</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Data pagamento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <tr key={linha.id}>
                  <td className="font-medium text-zinc-900">{linha.consulenteNome}</td>
                  <td>{formatarMoeda(linha.valor)}</td>
                  <td>Dia {linha.diaVencimento}</td>
                  <td>
                    <span className={`badge ${STATUS_CLASSE[linha.status]}`}>
                      {STATUS_LABEL[linha.status]}
                    </span>
                  </td>
                  <td>{linha.dataPagamento || "—"}</td>
                  <td className="space-x-2 text-right whitespace-nowrap">
                    {linha.status === "pago" ? (
                      <button className="btn-secondary" onClick={() => reabrirPagamento(linha)}>
                        Reabrir
                      </button>
                    ) : (
                      <>
                        <button className="btn-secondary" onClick={() => marcarComoPago(linha)}>
                          Marcar pago
                        </button>
                        <button
                          className="btn-primary"
                          onClick={() => enviarLembrete(linha)}
                          disabled={enviandoId === linha.id}
                        >
                          {enviandoId === linha.id ? "Enviando..." : "Enviar WhatsApp"}
                        </button>
                      </>
                    )}
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
