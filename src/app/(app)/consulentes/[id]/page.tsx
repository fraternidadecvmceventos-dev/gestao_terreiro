import { db } from "@/db";
import { consulentes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ConsulenteForm } from "@/components/ConsulenteForm";

export default async function EditarConsulentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const consulenteId = Number(id);
  if (!Number.isInteger(consulenteId)) notFound();

  const [consulente] = await db
    .select()
    .from(consulentes)
    .where(eq(consulentes.id, consulenteId));

  if (!consulente) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">Editar consulente</h1>
      <ConsulenteForm
        modo="editar"
        valoresIniciais={{
          nome: consulente.nome,
          whatsapp: consulente.whatsapp,
          valorMensalidade: consulente.valorMensalidade,
          diaVencimento: String(consulente.diaVencimento),
          ativo: consulente.ativo,
          observacao: consulente.observacao || "",
        }}
        consulenteId={consulente.id}
      />
    </div>
  );
}
