import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { membros, pagamentos, mensagensEnviadas } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  mesReferenciaAtual,
  diaDoMesAtual,
  dataHojeISO,
  formatarMoeda,
  formatarMesReferencia,
} from "@/lib/format";
import { enviarLembreteMensalidade, enviarAvisoAtraso } from "@/lib/whatsapp-meta";

/**
 * Rotina diária (chamada pelo Vercel Cron — ver vercel.json) que:
 *  1. Garante que existe uma linha de pagamento "pendente" para o mês atual
 *     de cada membro ativo.
 *  2. Envia o lembrete de cobrança no dia do vencimento de cada um.
 *  3. Marca como "atrasado" quem passou do vencimento sem pagar, e envia um
 *     único aviso de atraso por mês.
 *
 * Protegida por CRON_SECRET: a Vercel injeta automaticamente o header
 * `Authorization: Bearer <CRON_SECRET>` nas chamadas de cron quando essa
 * variável de ambiente está configurada no projeto.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
    }
  }

  const mes = mesReferenciaAtual();
  const diaHoje = diaDoMesAtual();
  const hojeISO = dataHojeISO();
  const chavePix = process.env.PIX_KEY || "(chave PIX não configurada)";

  const ativos = await db.select().from(membros).where(eq(membros.ativo, true));

  let pagamentosCriados = 0;
  let lembretesEnviados = 0;
  let atrasosMarcados = 0;
  let avisosAtrasoEnviados = 0;

  for (const membro of ativos) {
    let [pagamento] = await db
      .select()
      .from(pagamentos)
      .where(
        and(eq(pagamentos.membroId, membro.id), eq(pagamentos.mesReferencia, mes))
      );

    if (!pagamento) {
      [pagamento] = await db
        .insert(pagamentos)
        .values({
          membroId: membro.id,
          mesReferencia: mes,
          valor: membro.valorMensalidade,
          status: "pendente",
        })
        .returning();
      pagamentosCriados++;
    }

    if (pagamento.status === "pago") continue;

    const vencimentoISO = `${mes}-${String(membro.diaVencimento).padStart(2, "0")}`;
    const estaAtrasado = hojeISO > vencimentoISO;

    if (estaAtrasado && pagamento.status !== "atrasado") {
      await db
        .update(pagamentos)
        .set({ status: "atrasado" })
        .where(eq(pagamentos.id, pagamento.id));
      atrasosMarcados++;
      pagamento = { ...pagamento, status: "atrasado" };
    }

    const valorFormatado = formatarMoeda(pagamento.valor).replace("R$", "").trim();
    const mesFormatado = formatarMesReferencia(mes);

    // Lembrete no dia do vencimento (uma vez por mês).
    if (diaHoje === membro.diaVencimento && pagamento.status === "pendente") {
      const jaEnviado = await db
        .select()
        .from(mensagensEnviadas)
        .where(
          and(
            eq(mensagensEnviadas.membroId, membro.id),
            eq(mensagensEnviadas.mesReferencia, mes),
            eq(mensagensEnviadas.tipo, "lembrete")
          )
        );
      if (jaEnviado.length === 0) {
        const resultado = await enviarLembreteMensalidade({
          numero: membro.whatsapp,
          nomeMembro: membro.nome,
          mesReferenciaFormatado: mesFormatado,
          valor: valorFormatado,
          diaVencimento: String(membro.diaVencimento),
          chavePix,
        });
        await db.insert(mensagensEnviadas).values({
          membroId: membro.id,
          tipo: "lembrete",
          mesReferencia: mes,
          statusEnvio: resultado.sucesso ? "sucesso" : "erro",
          detalhe: resultado.detalhe,
        });
        if (resultado.sucesso) lembretesEnviados++;
      }
    }

    // Aviso único de atraso.
    if (pagamento.status === "atrasado") {
      const jaAvisado = await db
        .select()
        .from(mensagensEnviadas)
        .where(
          and(
            eq(mensagensEnviadas.membroId, membro.id),
            eq(mensagensEnviadas.mesReferencia, mes),
            eq(mensagensEnviadas.tipo, "atraso")
          )
        );
      if (jaAvisado.length === 0) {
        const resultado = await enviarAvisoAtraso({
          numero: membro.whatsapp,
          nomeMembro: membro.nome,
          mesReferenciaFormatado: mesFormatado,
          valor: valorFormatado,
          chavePix,
        });
        await db.insert(mensagensEnviadas).values({
          membroId: membro.id,
          tipo: "atraso",
          mesReferencia: mes,
          statusEnvio: resultado.sucesso ? "sucesso" : "erro",
          detalhe: resultado.detalhe,
        });
        if (resultado.sucesso) avisosAtrasoEnviados++;
      }
    }
  }

  return NextResponse.json({
    mes,
    membrosAtivos: ativos.length,
    pagamentosCriados,
    lembretesEnviados,
    atrasosMarcados,
    avisosAtrasoEnviados,
  });
}
