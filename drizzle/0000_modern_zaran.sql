CREATE TABLE "consulentes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(200) NOT NULL,
	"whatsapp" varchar(30) NOT NULL,
	"valor_mensalidade" numeric(10, 2) DEFAULT '0' NOT NULL,
	"dia_vencimento" integer DEFAULT 5 NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"observacao" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "despesas" (
	"id" serial PRIMARY KEY NOT NULL,
	"data" date NOT NULL,
	"categoria" varchar(60) NOT NULL,
	"descricao" text NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"forma_pagamento" varchar(40),
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"consulente_id" integer,
	"doador_nome" varchar(200),
	"data" date NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"categoria" varchar(60) DEFAULT 'Doação avulsa' NOT NULL,
	"forma_pagamento" varchar(40),
	"observacao" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mensagens_enviadas" (
	"id" serial PRIMARY KEY NOT NULL,
	"consulente_id" integer NOT NULL,
	"tipo" varchar(20) DEFAULT 'lembrete' NOT NULL,
	"mes_referencia" varchar(7) NOT NULL,
	"data_envio" timestamp DEFAULT now() NOT NULL,
	"status_envio" varchar(20) NOT NULL,
	"detalhe" text
);
--> statement-breakpoint
CREATE TABLE "pagamentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"consulente_id" integer NOT NULL,
	"mes_referencia" varchar(7) NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pendente' NOT NULL,
	"data_pagamento" date,
	"forma_pagamento" varchar(40),
	"observacao" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doacoes" ADD CONSTRAINT "doacoes_consulente_id_consulentes_id_fk" FOREIGN KEY ("consulente_id") REFERENCES "public"."consulentes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens_enviadas" ADD CONSTRAINT "mensagens_enviadas_consulente_id_consulentes_id_fk" FOREIGN KEY ("consulente_id") REFERENCES "public"."consulentes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_consulente_id_consulentes_id_fk" FOREIGN KEY ("consulente_id") REFERENCES "public"."consulentes"("id") ON DELETE cascade ON UPDATE no action;