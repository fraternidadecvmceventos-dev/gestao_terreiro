/**
 * Integração com a Z-API (https://www.z-api.io) para envio de mensagens de
 * WhatsApp. Troque este arquivo se decidir usar outro provedor (Twilio,
 * WPPConnect Cloud etc.) — o resto do app só depende da função
 * `enviarMensagemWhatsapp`.
 */

export type ResultadoEnvio = {
  sucesso: boolean;
  detalhe: string;
};

/**
 * Normaliza um número de telefone brasileiro para o formato esperado pela
 * Z-API: apenas dígitos, com código do país 55 na frente.
 * Aceita entradas como "(11) 91234-5678", "11912345678", "+55 11 91234-5678".
 */
export function normalizarTelefone(numero: string): string {
  const digitos = numero.replace(/\D/g, "");
  if (digitos.startsWith("55") && digitos.length >= 12) {
    return digitos;
  }
  return `55${digitos}`;
}

export async function enviarMensagemWhatsapp(
  numero: string,
  mensagem: string
): Promise<ResultadoEnvio> {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !token) {
    return {
      sucesso: false,
      detalhe:
        "ZAPI_INSTANCE_ID/ZAPI_TOKEN não configurados. Configure as variáveis de ambiente da Z-API para habilitar o envio.",
    };
  }

  const telefone = normalizarTelefone(numero);
  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;

  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(clientToken ? { "Client-Token": clientToken } : {}),
      },
      body: JSON.stringify({
        phone: telefone,
        message: mensagem,
      }),
    });

    const corpo = await resposta.text();

    if (!resposta.ok) {
      return {
        sucesso: false,
        detalhe: `Z-API respondeu ${resposta.status}: ${corpo}`,
      };
    }

    return { sucesso: true, detalhe: corpo || "Mensagem enviada." };
  } catch (erro) {
    return {
      sucesso: false,
      detalhe: `Falha ao chamar a Z-API: ${(erro as Error).message}`,
    };
  }
}

export function montarMensagemCobranca(params: {
  nomeTerreiro: string;
  nomeConsulente: string;
  mesReferenciaFormatado: string;
  valor: string;
  diaVencimento: number;
  chavePix: string;
}): string {
  const { nomeTerreiro, nomeConsulente, mesReferenciaFormatado, valor, diaVencimento, chavePix } =
    params;
  return (
    `Olá, ${nomeConsulente} 🙏\n\n` +
    `Passando para lembrar da sua mensalidade de ${mesReferenciaFormatado} do ${nomeTerreiro}, ` +
    `no valor de R$ ${valor}, com vencimento no dia ${diaVencimento}.\n\n` +
    `Chave PIX: ${chavePix}\n\n` +
    `Qualquer dúvida, estamos à disposição. Axé!`
  );
}

export function montarMensagemAtraso(params: {
  nomeTerreiro: string;
  nomeConsulente: string;
  mesReferenciaFormatado: string;
  valor: string;
  chavePix: string;
}): string {
  const { nomeTerreiro, nomeConsulente, mesReferenciaFormatado, valor, chavePix } = params;
  return (
    `Olá, ${nomeConsulente} 🙏\n\n` +
    `Notamos que a mensalidade de ${mesReferenciaFormatado} do ${nomeTerreiro} ` +
    `(R$ ${valor}) ainda consta em aberto.\n\n` +
    `Chave PIX: ${chavePix}\n\n` +
    `Se já pagou, pode desconsiderar ou nos avisar para atualizarmos por aqui. Axé!`
  );
}
