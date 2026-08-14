/**
 * Integração com a API oficial do WhatsApp (Meta Cloud API / WhatsApp
 * Business Platform) — https://developers.facebook.com/docs/whatsapp
 *
 * Diferente de provedores como a Z-API, aqui é OBRIGATÓRIO usar um "modelo
 * de mensagem" (message template) pré-aprovado pela Meta para iniciar uma
 * conversa com o membro (não dá para mandar texto livre quando é o
 * terreiro que inicia a conversa). Os modelos precisam ser criados e
 * aprovados no WhatsApp Manager antes de funcionarem aqui — ver README.md.
 *
 * Os textos exatos dos dois modelos usados neste projeto (para submeter no
 * WhatsApp Manager, categoria "Utility"):
 *
 * mensalidade_lembrete:
 *   "Olá, {{1}}! Passando para lembrar da sua mensalidade de {{2}} no
 *    valor de R$ {{3}}, com vencimento no dia {{4}}. Chave PIX: {{5}}.
 *    Qualquer dúvida, estamos à disposição. Axé!"
 *
 * mensalidade_atraso:
 *   "Olá, {{1}}! Notamos que a mensalidade de {{2}} (R$ {{3}}) ainda
 *    consta em aberto. Chave PIX: {{4}}. Se já pagou, pode desconsiderar.
 *    Axé!"
 */

export type ResultadoEnvio = {
  sucesso: boolean;
  detalhe: string;
};

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";

/**
 * Normaliza um número de telefone brasileiro para o formato esperado pela
 * API do WhatsApp: apenas dígitos, com código do país 55 na frente.
 */
export function normalizarTelefone(numero: string): string {
  const digitos = numero.replace(/\D/g, "");
  if (digitos.startsWith("55") && digitos.length >= 12) {
    return digitos;
  }
  return `55${digitos}`;
}

async function enviarTemplate(params: {
  numero: string;
  nomeTemplate: string;
  parametros: string[];
}): Promise<ResultadoEnvio> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return {
      sucesso: false,
      detalhe:
        "WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_ACCESS_TOKEN não configurados. Configure as variáveis de ambiente da API oficial do WhatsApp (Meta) para habilitar o envio.",
    };
  }

  const telefone = normalizarTelefone(params.numero);
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: telefone,
        type: "template",
        template: {
          name: params.nomeTemplate,
          language: { code: "pt_BR" },
          components: [
            {
              type: "body",
              parameters: params.parametros.map((texto) => ({ type: "text", text: texto })),
            },
          ],
        },
      }),
    });

    const corpo = await resposta.text();

    if (!resposta.ok) {
      return { sucesso: false, detalhe: `A Meta respondeu ${resposta.status}: ${corpo}` };
    }

    return { sucesso: true, detalhe: corpo || "Mensagem enviada." };
  } catch (erro) {
    return {
      sucesso: false,
      detalhe: `Falha ao chamar a API do WhatsApp: ${(erro as Error).message}`,
    };
  }
}

export async function enviarLembreteMensalidade(params: {
  numero: string;
  nomeMembro: string;
  mesReferenciaFormatado: string;
  valor: string;
  diaVencimento: string;
  chavePix: string;
}): Promise<ResultadoEnvio> {
  const nomeTemplate = process.env.WHATSAPP_TEMPLATE_LEMBRETE || "mensalidade_lembrete";
  return enviarTemplate({
    numero: params.numero,
    nomeTemplate,
    parametros: [
      params.nomeMembro,
      params.mesReferenciaFormatado,
      params.valor,
      params.diaVencimento,
      params.chavePix,
    ],
  });
}

export async function enviarAvisoAtraso(params: {
  numero: string;
  nomeMembro: string;
  mesReferenciaFormatado: string;
  valor: string;
  chavePix: string;
}): Promise<ResultadoEnvio> {
  const nomeTemplate = process.env.WHATSAPP_TEMPLATE_ATRASO || "mensalidade_atraso";
  return enviarTemplate({
    numero: params.numero,
    nomeTemplate,
    parametros: [params.nomeMembro, params.mesReferenciaFormatado, params.valor, params.chavePix],
  });
}
