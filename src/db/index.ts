import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __terreiroDbClient: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL não configurada. Defina a variável de ambiente com a string de conexão do Postgres (Supabase/Neon)."
  );
}

// Reaproveita a conexão entre hot-reloads em dev e entre invocações da mesma
// função serverless na Vercel, evitando esgotar o limite de conexões do banco.
const client =
  global.__terreiroDbClient ??
  postgres(connectionString, { max: 1, prepare: false });

if (process.env.NODE_ENV !== "production") {
  global.__terreiroDbClient = client;
}

export const db = drizzle(client, { schema });
