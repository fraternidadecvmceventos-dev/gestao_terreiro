import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { membros } from "@/db/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";

const membroSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome completo."),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp válido."),
  valorMensalidade: z.coerce.number().nonnegative("Valor não pode ser negativo."),
  diaVencimento: z.coerce.number().int().min(1).max(28, "Use um dia entre 1 e 28."),
  ativo: z.boolean().optional().default(true),
  observacao: z.string().trim().optional().nullable(),
});

export async function GET() {
  const lista = await db.select().from(membros).orderBy(asc(membros.nome));
  return NextResponse.json(lista);
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = membroSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const dados = parsed.data;
  const [criado] = await db
    .insert(membros)
    .values({
      nome: dados.nome,
      whatsapp: dados.whatsapp,
      valorMensalidade: dados.valorMensalidade.toFixed(2),
      diaVencimento: dados.diaVencimento,
      ativo: dados.ativo,
      observacao: dados.observacao || null,
    })
    .returning();

  return NextResponse.json(criado, { status: 201 });
}
