import { db } from "@/db";
import { membros } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { MembroForm } from "@/components/MembroForm";

export default async function EditarMembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const membroId = Number(id);
  if (!Number.isInteger(membroId)) notFound();

  const [membro] = await db
    .select()
    .from(membros)
    .where(eq(membros.id, membroId));

  if (!membro) notFound();

  return (
    <div className="space-y-4">
      <h1>Editar membro</h1>
      <MembroForm
        modo="editar"
        valoresIniciais={{
          nome: membro.nome,
          whatsapp: membro.whatsapp,
          valorMensalidade: membro.valorMensalidade,
          diaVencimento: String(membro.diaVencimento),
          ativo: membro.ativo,
          observacao: membro.observacao || "",
        }}
        membroId={membro.id}
      />
    </div>
  );
}
