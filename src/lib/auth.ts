import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "terreiro_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET não configurada (ou muito curta). Defina uma string aleatória longa nas variáveis de ambiente."
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Compara a senha informada com a senha de administrador configurada,
 * em tempo constante para reduzir risco de timing attack.
 */
export function verificarSenhaAdmin(senhaInformada: string): boolean {
  const senhaCorreta = process.env.ADMIN_PASSWORD;
  if (!senhaCorreta) {
    throw new Error("ADMIN_PASSWORD não configurada nas variáveis de ambiente.");
  }
  const bufferInformada = Buffer.from(senhaInformada.padEnd(200, "\0"));
  const bufferCorreta = Buffer.from(senhaCorreta.padEnd(200, "\0"));
  return crypto.timingSafeEqual(bufferInformada, bufferCorreta);
}

export async function criarSessao(): Promise<string> {
  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
  return token;
}

export async function definirCookieSessao(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function removerCookieSessao() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function verificarTokenSessao(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecretKey());
    return true;
  } catch {
    return false;
  }
}

export async function obterSessaoAtual(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verificarTokenSessao(token);
}

export { COOKIE_NAME };
