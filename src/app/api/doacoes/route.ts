import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { doacoes } from "@/db/schema";
import { desc, gte, lt, and } from "drizzle-orm";
import { z } from "zod";
import { mesReferenciaAtual } from "@/lib/format";

const criacaoSchema = z.object({
  doadorNome: z.string().trim().optional().nullable(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato YYYY-MM-DD."),
  valor: z.coerce.number().positive("Valor deve ser maior que zero."),
  categoria: z.string().trim().min(1).default("Doação avulsa"),
  formaPagamento: z.string().trim().optional().nullable(),
  observacao: z.string().trim().optional().nullable(),
});

function limitesDoMes(mes: string): { inicio: string; fim: string } {
  const [ano, mesNum] = mes.split("-").map(Number);
  const inicio = `${mes}-01`;
  const proximoMes = mesNum === 12 ? `${ano + 1}-01` : `${ano}-${String(mesNum + 1).padStart(2, "0")}`;
  return { inicio, fim: `${proximoMes}-01` };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get("mes") || mesReferenciaAtual();
  const { inicio, fim } = limitesDoMes(mes);

  const lista = await db
    .select()
    .from(doacoes)
    .where(and(gte(doacoes.data, inicio), lt(doacoes.data, fim)))
    .orderBy(desc(doacoes.data));

  return NextResponse.json({ mes, doacoes: lista });
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = criacaoSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }
  const dados = parsed.data;

  const [criado] = await db
    .insert(doacoes)
    .values({
      doadorNome: dados.doadorNome || null,
      data: dados.data,
      valor: dados.valor.toFixed(2),
      categoria: dados.categoria,
      formaPagamento: dados.formaPagamento || null,
      observacao: dados.observacao || null,
    })
    .returning();

  return NextResponse.json(criado, { status: 201 });
}
