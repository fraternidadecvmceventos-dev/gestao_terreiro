import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pagamentos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const atualizacaoSchema = z.object({
  status: z.enum(["pendente", "pago", "atrasado"]).optional(),
  dataPagamento: z.string().trim().optional().nullable(),
  formaPagamento: z.string().trim().optional().nullable(),
  observacao: z.string().trim().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pagamentoId = Number(id);
  if (!Number.isInteger(pagamentoId)) {
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

  const [atualizado] = await db
    .update(pagamentos)
    .set(parsed.data)
    .where(eq(pagamentos.id, pagamentoId))
    .returning();

  if (!atualizado) {
    return NextResponse.json({ erro: "Pagamento não encontrado." }, { status: 404 });
  }

  return NextResponse.json(atualizado);
}
