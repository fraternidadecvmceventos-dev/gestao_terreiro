export function formatarMoeda(valor: string | number): string {
  const numero = typeof valor === "string" ? parseFloat(valor) : valor;
  if (Number.isNaN(numero)) return "R$ 0,00";
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Recebe "2026-08" e devolve "Agosto/2026". */
export function formatarMesReferencia(mesReferencia: string): string {
  const [ano, mes] = mesReferencia.split("-").map(Number);
  if (!ano || !mes || mes < 1 || mes > 12) return mesReferencia;
  return `${MESES_PT[mes - 1]}/${ano}`;
}

/** Mês de referência atual no formato "YYYY-MM", respeitando o fuso horário de São Paulo. */
export function mesReferenciaAtual(): string {
  const agora = new Date();
  const formatado = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).format(agora);
  // en-CA com year/month produz "YYYY-MM"
  return formatado;
}

/** Dia do mês atual (1-31), respeitando o fuso horário de São Paulo. */
export function diaDoMesAtual(): number {
  const agora = new Date();
  const dia = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
  }).format(agora);
  return parseInt(dia, 10);
}

export function dataHojeISO(): string {
  const agora = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}
