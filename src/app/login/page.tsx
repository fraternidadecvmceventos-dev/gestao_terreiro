"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados?.erro ?? "Não foi possível entrar.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div id="gate">
      <div className="gate-in">
        <div className="gmark">
          <svg width="28" height="21" viewBox="0 0 34 26" fill="none" aria-hidden="true">
            <path d="M2 22C6 11 14 3.5 24 1c-3 9-9.5 16.5-18 21z" fill="#7AC143" />
            <path d="M9 25C13.5 13 21 5.5 32 2c-2.5 11-9.5 19.5-19.5 23z" fill="#1B7FA8" />
          </svg>
          <span>GESTÃO DO TERREIRO</span>
        </div>

        <h1 className="gtitle">
          Mensalidades e doações,
          <br />
          sempre em ordem.
        </h1>
        <p className="gsub">Área restrita — acesse com a senha de administrador.</p>

        <form onSubmit={handleSubmit}>
          <label className="glabel" htmlFor="senha">
            Senha de administrador
          </label>
          <input
            id="senha"
            type="password"
            className="ginput"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoFocus
            required
          />

          {erro && <p className="gerro">{erro}</p>}

          <button type="submit" className="gbtn" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
      <div className="gfoot">Uso interno — dados protegidos por senha.</div>
    </div>
  );
}
