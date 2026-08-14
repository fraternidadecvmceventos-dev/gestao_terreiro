import {
  pgTable,
  serial,
  text,
  varchar,
  numeric,
  integer,
  boolean,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

// Status possíveis (validados na camada de aplicação, não como enum nativo,
// para manter o schema simples e portátil entre provedores Postgres):
// pagamentos.status: "pendente" | "pago" | "atrasado"
// mensagensEnviadas.tipo: "lembrete" | "atraso"
// mensagensEnviadas.statusEnvio: "sucesso" | "erro"

export const consulentes = pgTable("consulentes", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 30 }).notNull(),
  valorMensalidade: numeric("valor_mensalidade", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  diaVencimento: integer("dia_vencimento").notNull().default(5),
  ativo: boolean("ativo").notNull().default(true),
  observacao: text("observacao"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export const pagamentos = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  consulenteId: integer("consulente_id")
    .notNull()
    .references(() => consulentes.id, { onDelete: "cascade" }),
  mesReferencia: varchar("mes_referencia", { length: 7 }).notNull(), // formato "YYYY-MM"
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pendente"),
  dataPagamento: date("data_pagamento"),
  formaPagamento: varchar("forma_pagamento", { length: 40 }),
  observacao: text("observacao"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export const doacoes = pgTable("doacoes", {
  id: serial("id").primaryKey(),
  consulenteId: integer("consulente_id").references(() => consulentes.id, {
    onDelete: "set null",
  }),
  doadorNome: varchar("doador_nome", { length: 200 }),
  data: date("data").notNull(),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  categoria: varchar("categoria", { length: 60 }).notNull().default("Doação avulsa"),
  formaPagamento: varchar("forma_pagamento", { length: 40 }),
  observacao: text("observacao"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export const despesas = pgTable("despesas", {
  id: serial("id").primaryKey(),
  data: date("data").notNull(),
  categoria: varchar("categoria", { length: 60 }).notNull(),
  descricao: text("descricao").notNull(),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  formaPagamento: varchar("forma_pagamento", { length: 40 }),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export const mensagensEnviadas = pgTable("mensagens_enviadas", {
  id: serial("id").primaryKey(),
  consulenteId: integer("consulente_id")
    .notNull()
    .references(() => consulentes.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 20 }).notNull().default("lembrete"),
  mesReferencia: varchar("mes_referencia", { length: 7 }).notNull(),
  dataEnvio: timestamp("data_envio").defaultNow().notNull(),
  statusEnvio: varchar("status_envio", { length: 20 }).notNull(),
  detalhe: text("detalhe"),
});
