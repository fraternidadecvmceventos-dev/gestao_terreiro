import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pagamentos, membros, mensagensEnviadas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { enviarLembreteMensalidade, enviarAvisoAtraso } from "@/lib/whatsapp-meta";
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
      membroId: membros.id,
      nome: membros.nome,
      whatsapp: membros.whatsapp,
      diaVencimento: membros.diaVencimento,
    })
    .from(pagamentos)
    .innerJoin(membros, eq(pagamentos.membroId, membros.id))
    .where(eq(pagamentos.id, parsed.data.pagamentoId));

  if (!linha) {
    return NextResponse.json({ erro: "Pagamento não encontrado." }, { status: 404 });
  }

  const chavePix = process.env.PIX_KEY || "(chave PIX não configurada)";
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

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.detalhe }, { status: 502 });
  }

  return NextResponse.json({ ok: true, detalhe: resultado.detalhe });
}
