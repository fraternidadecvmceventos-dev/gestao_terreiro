import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pagamentos, membros } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { mesReferenciaAtual } from "@/lib/format";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get("mes") || mesReferenciaAtual();

  const linhas = await db
    .select({
      id: pagamentos.id,
      mesReferencia: pagamentos.mesReferencia,
      valor: pagamentos.valor,
      status: pagamentos.status,
      dataPagamento: pagamentos.dataPagamento,
      formaPagamento: pagamentos.formaPagamento,
      observacao: pagamentos.observacao,
      membroId: membros.id,
      membroNome: membros.nome,
      membroWhatsapp: membros.whatsapp,
      diaVencimento: membros.diaVencimento,
    })
    .from(pagamentos)
    .innerJoin(membros, eq(pagamentos.membroId, membros.id))
    .where(eq(pagamentos.mesReferencia, mes))
    .orderBy(asc(membros.nome));

  return NextResponse.json({ mes, pagamentos: linhas });
}
