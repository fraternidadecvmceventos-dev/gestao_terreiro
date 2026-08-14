import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pagamentos, consulentes, mensagensEnviadas } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { enviarMensagemWhatsapp, montarMensagemCobranca, montarMensagemAtraso } from "@/lib/zapi";
import { formatarMoeda, formatarMesReferencia, mesReferenciaAtual } from "@/lib/format";

const bodySchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

/**
 * Dispara a mensagem de cobrança para todos os pagamentos ainda não pagos
 * (pendente ou atrasado) do mês informado. Usado tanto pelo botão "Enviar
 * para todos" no painel quanto poderia ser chamado pelo cron.
 */
export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ erro: "Mês inválido." }, { status: 400 });
  }
  const mes = parsed.data.mes || mesReferenciaAtual();

  const linhas = await db
    .select({
      id: pagamentos.id,
      status: pagamentos.status,
      valor: pagamentos.valor,
      mesReferencia: pagamentos.mesReferencia,
      consulenteId: consulentes.id,
      nome: consulentes.nome,
      whatsapp: consulentes.whatsapp,
      diaVencimento: consulentes.diaVencimento,
    })
    .from(pagamentos)
    .innerJoin(consulentes, eq(pagamentos.consulenteId, consulentes.id))
    .where(
      and(eq(pagamentos.mesReferencia, mes), inArray(pagamentos.status, ["pendente", "atrasado"]))
    );

  const nomeTerreiro = process.env.TERREIRO_NAME || "Terreiro";
  const chavePix = process.env.PIX_KEY || "(chave PIX não configurada)";

  let enviadosComSucesso = 0;
  let falhas = 0;

  for (const linha of linhas) {
    const mesFormatado = formatarMesReferencia(linha.mesReferencia);
    const valorFormatado = formatarMoeda(linha.valor).replace("R$", "").trim();

    const mensagem =
      linha.status === "atrasado"
        ? montarMensagemAtraso({
            nomeTerreiro,
            nomeConsulente: linha.nome,
            mesReferenciaFormatado: mesFormatado,
            valor: valorFormatado,
            chavePix,
          })
        : montarMensagemCobranca({
            nomeTerreiro,
            nomeConsulente: linha.nome,
            mesReferenciaFormatado: mesFormatado,
            valor: valorFormatado,
            diaVencimento: linha.diaVencimento,
            chavePix,
          });

    const resultado = await enviarMensagemWhatsapp(linha.whatsapp, mensagem);

    await db.insert(mensagensEnviadas).values({
      consulenteId: linha.consulenteId,
      tipo: linha.status === "atrasado" ? "atraso" : "lembrete",
      mesReferencia: linha.mesReferencia,
      statusEnvio: resultado.sucesso ? "sucesso" : "erro",
      detalhe: resultado.detalhe,
    });

    if (resultado.sucesso) {
      enviadosComSucesso++;
    } else {
      falhas++;
    }

    // Pequeno intervalo entre envios para não sobrecarregar a API do provedor.
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return NextResponse.json({ mes, total: linhas.length, enviadosComSucesso, falhas });
}
