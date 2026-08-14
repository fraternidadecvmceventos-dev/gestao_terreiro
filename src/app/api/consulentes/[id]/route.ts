import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { consulentes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const atualizacaoSchema = z.object({
  nome: z.string().trim().min(2).optional(),
  whatsapp: z.string().trim().min(8).optional(),
  valorMensalidade: z.coerce.number().nonnegative().optional(),
  diaVencimento: z.coerce.number().int().min(1).max(28).optional(),
  ativo: z.boolean().optional(),
  observacao: z.string().trim().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const consulenteId = Number(id);
  if (!Number.isInteger(consulenteId)) {
    return NextResponse.json({ erro: "Id inválido." }, { status: 400 });
  }

  const json = await request.json().catch(() => null);
  const parsed = atualizacaoSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const dados = parsed.data;
  const valoresParaAtualizar: Record<string, unknown> = { ...dados };
  if (dados.valorMensalidade !== undefined) {
    valoresParaAtualizar.valorMensalidade = dados.valorMensalidade.toFixed(2);
  }

  const [atualizado] = await db
    .update(consulentes)
    .set(valoresParaAtualizar)
    .where(eq(consulentes.id, consulenteId))
    .returning();

  if (!atualizado) {
    return NextResponse.json({ erro: "Consulente não encontrado." }, { status: 404 });
  }

  return NextResponse.json(atualizado);
}
