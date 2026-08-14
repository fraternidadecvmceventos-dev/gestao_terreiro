import { ConsulenteForm } from "@/components/ConsulenteForm";

export default function NovoConsulentePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">Novo consulente</h1>
      <ConsulenteForm modo="criar" />
    </div>
  );
}
