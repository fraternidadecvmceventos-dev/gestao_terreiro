import { NextResponse } from "next/server";
import { removerCookieSessao } from "@/lib/auth";

export async function POST() {
  await removerCookieSessao();
  return NextResponse.json({ ok: true });
}
