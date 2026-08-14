import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { despesas } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const despesaId = Number(id);
  if (!Number.isInteger(despesaId)) {
    return NextResponse.json({ erro: "Id inválido." }, { status: 400 });
  }

  const [removido] = await db.delete(despesas).where(eq(despesas.id, despesaId)).returning();
  if (!removido) {
    return NextResponse.json({ erro: "Despesa não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
