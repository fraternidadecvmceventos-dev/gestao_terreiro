import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pagamentos, consulentes } from "@/db/schema";
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
      consulenteId: consulentes.id,
      consulenteNome: consulentes.nome,
      consulenteWhatsapp: consulentes.whatsapp,
      diaVencimento: consulentes.diaVencimento,
    })
    .from(pagamentos)
    .innerJoin(consulentes, eq(pagamentos.consulenteId, consulentes.id))
    .where(eq(pagamentos.mesReferencia, mes))
    .orderBy(asc(consulentes.nome));

  return NextResponse.json({ mes, pagamentos: linhas });
}
