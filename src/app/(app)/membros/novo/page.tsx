import { MembroForm } from "@/components/MembroForm";

export default function NovoMembroPage() {
  return (
    <div className="space-y-4">
      <h1>Novo membro</h1>
      <MembroForm modo="criar" />
    </div>
  );
}
