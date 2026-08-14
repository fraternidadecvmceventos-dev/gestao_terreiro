import { NextRequest, NextResponse } from "next/server";
import { verificarSenhaAdmin, criarSessao, definirCookieSessao } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let senha: string | undefined;
  try {
    const body = await request.json();
    senha = body?.senha;
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  if (!senha || typeof senha !== "string") {
    return NextResponse.json({ erro: "Informe a senha." }, { status: 400 });
  }

  let valida: boolean;
  try {
    valida = verificarSenhaAdmin(senha);
  } catch (erro) {
    return NextResponse.json({ erro: (erro as Error).message }, { status: 500 });
  }

  if (!valida) {
    return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  const token = await criarSessao();
  await definirCookieSessao(token);

  return NextResponse.json({ ok: true });
}
