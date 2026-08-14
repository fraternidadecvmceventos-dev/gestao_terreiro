import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pagamentos, consulentes, mensagensEnviadas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { enviarMensagemWhatsapp, montarMensagemCobranca, montarMensagemAtraso } from "@/lib/zapi";
import { formatarMoeda, formatarMesReferencia } from "@/lib/format";

const bodySchema = z.object({
  pagamentoId: z.coerce.number().int(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ erro: "Informe o pagamentoId." }, { status: 400 });
  }

  const [linha] = await db
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
    .where(eq(pagamentos.id, parsed.data.pagamentoId));

  if (!linha) {
    return NextResponse.json({ erro: "Pagamento não encontrado." }, { status: 404 });
  }

  const nomeTerreiro = process.env.TERREIRO_NAME || "Terreiro";
  const chavePix = process.env.PIX_KEY || "(chave PIX não configurada)";
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

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.detalhe }, { status: 502 });
  }

  return NextResponse.json({ ok: true, detalhe: resultado.detalhe });
}
