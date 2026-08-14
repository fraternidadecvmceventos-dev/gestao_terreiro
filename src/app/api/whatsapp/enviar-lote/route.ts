import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pagamentos, membros, mensagensEnviadas } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { enviarLembreteMensalidade, enviarAvisoAtraso } from "@/lib/whatsapp-meta";
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
      membroId: membros.id,
      nome: membros.nome,
      whatsapp: membros.whatsapp,
      diaVencimento: membros.diaVencimento,
    })
    .from(pagamentos)
    .innerJoin(membros, eq(pagamentos.membroId, membros.id))
    .where(
      and(eq(pagamentos.mesReferencia, mes), inArray(pagamentos.status, ["pendente", "atrasado"]))
    );

  const chavePix = process.env.PIX_KEY || "(chave PIX não configurada)";

  let enviadosComSucesso = 0;
  let falhas = 0;

  for (const linha of linhas) {
    const mesFormatado = formatarMesReferencia(linha.mesReferencia);
    const valorFormatado = formatarMoeda(linha.valor).replace("R$", "").trim();

    const resultado =
      linha.status === "atrasado"
        ? await enviarAvisoAtraso({
            numero: linha.whatsapp,
            nomeMembro: linha.nome,
            mesReferenciaFormatado: mesFormatado,
            valor: valorFormatado,
            chavePix,
          })
        : await enviarLembreteMensalidade({
            numero: linha.whatsapp,
            nomeMembro: linha.nome,
            mesReferenciaFormatado: mesFormatado,
            valor: valorFormatado,
            diaVencimento: String(linha.diaVencimento),
            chavePix,
          });

    await db.insert(mensagensEnviadas).values({
      membroId: linha.membroId,
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
