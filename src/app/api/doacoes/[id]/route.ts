import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { doacoes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doacaoId = Number(id);
  if (!Number.isInteger(doacaoId)) {
    return NextResponse.json({ erro: "Id inválido." }, { status: 400 });
  }

  const [removido] = await db.delete(doacoes).where(eq(doacoes.id, doacaoId)).returning();
  if (!removido) {
    return NextResponse.json({ erro: "Doação não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
