"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { formatarMoeda, formatarMesReferencia, mesReferenciaAtual, dataHojeISO } from "@/lib/format";

type LinhaPagamento = {
  id: number;
  mesReferencia: string;
  valor: string;
  status: "pendente" | "pago" | "atrasado";
  dataPagamento: string | null;
  formaPagamento: string | null;
  observacao: string | null;
  membroId: number;
  membroNome: string;
  membroWhatsapp: string;
  diaVencimento: number;
};

type Filtro = "todas" | "pendente" | "atrasado" | "pago";

const STATUS_LABEL: Record<string, string> = { pendente: "Pendente", pago: "Pago", atrasado: "Atrasado" };
const STATUS_BADGE: Record<string, string> = {
  pendente: "badge-att",
  pago: "badge-ok",
  atrasado: "badge-risk",
};

export default function PagamentosPage() {
  const [mes, setMes] = useState(mesReferenciaAtual());
  const [linhas, setLinhas] = useState<LinhaPagamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [enviandoId, setEnviandoId] = useState<number | null>(null);
  const [enviandoLote, setEnviandoLote] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todas");

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

  const contagens = useMemo(
    () => ({
      todas: linhas.length,
      pendente: linhas.filter((l) => l.status === "pendente").length,
      atrasado: linhas.filter((l) => l.status === "atrasado").length,
      pago: linhas.filter((l) => l.status === "pago").length,
    }),
    [linhas]
  );

  const linhasFiltradas = useMemo(
    () => (filtro === "todas" ? linhas : linhas.filter((l) => l.status === filtro)),
    [linhas, filtro]
  );

  async function gerarCobrancas() {
    setMensagem(null);
    const resposta = await fetch("/api/pagamentos/gerar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mes }),
    });
    const dados = await resposta.json();
    setMensagem(
      `Cobranças geradas: ${dados.criados} nova(s) de ${dados.totalAtivos} membro(s) ativo(s).`
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
    setMensagem(resposta.ok ? `Mensagem enviada para ${linha.membroNome}.` : `Erro: ${dados.erro}`);
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
      <div className="head">
        <div>
          <h1>Mensalidades</h1>
          <p className="hsub">{formatarMesReferencia(mes)}</p>
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

      <div className="seg">
        <button aria-pressed={filtro === "todas"} onClick={() => setFiltro("todas")}>
          Todas<span className="c">{contagens.todas}</span>
        </button>
        <button aria-pressed={filtro === "pendente"} onClick={() => setFiltro("pendente")}>
          Pendentes<span className="c">{contagens.pendente}</span>
        </button>
        <button aria-pressed={filtro === "atrasado"} onClick={() => setFiltro("atrasado")}>
          Atrasadas<span className="c">{contagens.atrasado}</span>
        </button>
        <button aria-pressed={filtro === "pago"} onClick={() => setFiltro("pago")}>
          Pagas<span className="c">{contagens.pago}</span>
        </button>
      </div>

      <div className="card overflow-x-auto">
        {carregando ? (
          <p className="text-sm text-zinc-500">Carregando...</p>
        ) : linhasFiltradas.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {linhas.length === 0
              ? 'Nenhuma cobrança gerada para este mês ainda. Clique em "Gerar cobranças do mês".'
              : "Nenhuma mensalidade neste filtro."}
          </p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Membro</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Data pagamento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {linhasFiltradas.map((linha) => (
                <tr key={linha.id}>
                  <td className="font-medium" style={{ color: "var(--txt)" }}>
                    {linha.membroNome}
                  </td>
                  <td>{formatarMoeda(linha.valor)}</td>
                  <td>Dia {linha.diaVencimento}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[linha.status]}`}>
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
