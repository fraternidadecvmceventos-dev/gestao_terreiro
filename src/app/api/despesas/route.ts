import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { despesas } from "@/db/schema";
import { desc, gte, lt, and } from "drizzle-orm";
import { z } from "zod";
import { mesReferenciaAtual } from "@/lib/format";

const criacaoSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato YYYY-MM-DD."),
  categoria: z.string().trim().min(1, "Informe a categoria."),
  descricao: z.string().trim().min(1, "Informe a descrição."),
  valor: z.coerce.number().positive("Valor deve ser maior que zero."),
  formaPagamento: z.string().trim().optional().nullable(),
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
    .from(despesas)
    .where(and(gte(despesas.data, inicio), lt(despesas.data, fim)))
    .orderBy(desc(despesas.data));

  return NextResponse.json({ mes, despesas: lista });
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
    .insert(despesas)
    .values({
      data: dados.data,
      categoria: dados.categoria,
      descricao: dados.descricao,
      valor: dados.valor.toFixed(2),
      formaPagamento: dados.formaPagamento || null,
    })
    .returning();

  return NextResponse.json(criado, { status: 201 });
}
