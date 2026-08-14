import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

async function main() {
  // Import dinâmico: precisa rodar DEPOIS do dotenv carregar o .env.local,
  // já que ./index lê DATABASE_URL assim que é importado. Um import
  // estático no topo do arquivo seria "hoisted" pelo ESM e rodaria antes
  // do config() acima.
  const { db } = await import("./index");
  const { membros } = await import("./schema");

  const inseridos = await db
    .insert(membros)
    .values([
      { nome: "Maria Exemplo", whatsapp: "5511912345678", valorMensalidade: "50.00", diaVencimento: 5 },
      { nome: "João Exemplo", whatsapp: "5511998765432", valorMensalidade: "50.00", diaVencimento: 10 },
      { nome: "Ana Exemplo", whatsapp: "5511987651234", valorMensalidade: "30.00", diaVencimento: 15 },
    ])
    .returning();

  console.log(`Seed concluído: ${inseridos.length} membro(s) de exemplo inserido(s).`);
  process.exit(0);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
