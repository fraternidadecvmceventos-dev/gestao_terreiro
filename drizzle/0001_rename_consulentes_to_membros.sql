ALTER TABLE "consulentes" RENAME TO "membros";--> statement-breakpoint
ALTER TABLE "pagamentos" RENAME COLUMN "consulente_id" TO "membro_id";--> statement-breakpoint
ALTER TABLE "doacoes" RENAME COLUMN "consulente_id" TO "membro_id";--> statement-breakpoint
ALTER TABLE "mensagens_enviadas" RENAME COLUMN "consulente_id" TO "membro_id";--> statement-breakpoint
ALTER TABLE "doacoes" RENAME CONSTRAINT "doacoes_consulente_id_consulentes_id_fk" TO "doacoes_membro_id_membros_id_fk";--> statement-breakpoint
ALTER TABLE "mensagens_enviadas" RENAME CONSTRAINT "mensagens_enviadas_consulente_id_consulentes_id_fk" TO "mensagens_enviadas_membro_id_membros_id_fk";--> statement-breakpoint
ALTER TABLE "pagamentos" RENAME CONSTRAINT "pagamentos_consulente_id_consulentes_id_fk" TO "pagamentos_membro_id_membros_id_fk";
