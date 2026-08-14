import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pagamentos, consulentes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { mesReferenciaAtual } from "@/lib/format";
import { z } from "zod";

const bodySchema = z.object({
  mes: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Use o formato YYYY-MM.")
    .optional(),
});

/**
 * Gera as cobranças (linhas de pagamento pendente) do mês para todos os
 * consulentes ativos que ainda não têm uma linha nesse mês. Idempotente:
 * pode ser chamado várias vezes sem duplicar.
 */
export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }
  const mes = parsed.data.mes || mesReferenciaAtual();

  const ativos = await db
    .select()
    .from(consulentes)
    .where(eq(consulentes.ativo, true));

  const existentes = await db
    .select({ consulenteId: pagamentos.consulenteId })
    .from(pagamentos)
    .where(eq(pagamentos.mesReferencia, mes));
  const idsComPagamento = new Set(existentes.map((p) => p.consulenteId));

  const faltantes = ativos.filter((c) => !idsComPagamento.has(c.id));

  let criados = 0;
  for (const consulente of faltantes) {
    await db.insert(pagamentos).values({
      consulenteId: consulente.id,
      mesReferencia: mes,
      valor: consulente.valorMensalidade,
      status: "pendente",
    });
    criados++;
  }

  return NextResponse.json({ mes, criados, totalAtivos: ativos.length });
}
