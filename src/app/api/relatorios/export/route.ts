import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { db } from "@/db";
import { pagamentos, membros, doacoes, despesas } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { mesReferenciaAtual, formatarMesReferencia } from "@/lib/format";

const CURRENCY_FMT = '"R$" #,##0.00;[RED]-"R$" #,##0.00';
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF2F5496" },
};
const TOTAL_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFD9E1F2" },
};
const FONT_NAME = "Arial";

function limitesDoMes(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const inicio = `${mes}-01`;
  const proximoMes =
    mesNum === 12 ? `${ano + 1}-01` : `${ano}-${String(mesNum + 1).padStart(2, "0")}`;
  return { inicio, fim: `${proximoMes}-01` };
}

function estilizarCabecalho(worksheet: ExcelJS.Worksheet, linha: number, ultimaColuna: number) {
  for (let col = 1; col <= ultimaColuna; col++) {
    const cell = worksheet.getCell(linha, col);
    cell.fill = HEADER_FILL;
    cell.font = { name: FONT_NAME, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get("mes") || mesReferenciaAtual();
  const { inicio, fim } = limitesDoMes(mes);
  const mesFormatado = formatarMesReferencia(mes);

  const linhasMensalidades = await db
    .select({
      nome: membros.nome,
      whatsapp: membros.whatsapp,
      valor: pagamentos.valor,
      diaVencimento: membros.diaVencimento,
      status: pagamentos.status,
      dataPagamento: pagamentos.dataPagamento,
      formaPagamento: pagamentos.formaPagamento,
      observacao: pagamentos.observacao,
    })
    .from(pagamentos)
    .innerJoin(membros, eq(pagamentos.membroId, membros.id))
    .where(eq(pagamentos.mesReferencia, mes))
    .orderBy(membros.nome);

  const linhasDoacoes = await db
    .select()
    .from(doacoes)
    .where(and(gte(doacoes.data, inicio), lt(doacoes.data, fim)))
    .orderBy(doacoes.data);

  const linhasDespesas = await db
    .select()
    .from(despesas)
    .where(and(gte(despesas.data, inicio), lt(despesas.data, fim)))
    .orderBy(despesas.data);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = process.env.TERREIRO_NAME || "Terreiro";
  workbook.created = new Date();

  // ---------------- Mensalidades ----------------
  const wsMensalidades = workbook.addWorksheet("Mensalidades");
  wsMensalidades.columns = [
    { width: 28 },
    { width: 18 },
    { width: 20 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 20 },
    { width: 26 },
  ];
  wsMensalidades.mergeCells(1, 1, 1, 8);
  wsMensalidades.getCell(1, 1).value = `MENSALIDADES — ${mesFormatado}`;
  wsMensalidades.getCell(1, 1).font = { name: FONT_NAME, bold: true, size: 14, color: { argb: "FF2F5496" } };

  const headers1 = [
    "Nome do Membro",
    "WhatsApp",
    "Valor Mensalidade (R$)",
    "Dia Vencimento",
    "Status",
    "Data Pagamento",
    "Forma de Pagamento",
    "Observação",
  ];
  headers1.forEach((h, i) => (wsMensalidades.getCell(3, i + 1).value = h));
  estilizarCabecalho(wsMensalidades, 3, headers1.length);

  const primeiraLinhaDados1 = 4;
  linhasMensalidades.forEach((linha, idx) => {
    const r = primeiraLinhaDados1 + idx;
    wsMensalidades.getCell(r, 1).value = linha.nome;
    wsMensalidades.getCell(r, 2).value = linha.whatsapp;
    wsMensalidades.getCell(r, 3).value = Number(linha.valor);
    wsMensalidades.getCell(r, 3).numFmt = CURRENCY_FMT;
    wsMensalidades.getCell(r, 4).value = linha.diaVencimento;
    wsMensalidades.getCell(r, 5).value =
      linha.status === "pago" ? "Pago" : linha.status === "atrasado" ? "Atrasado" : "Pendente";
    wsMensalidades.getCell(r, 6).value = linha.dataPagamento || "";
    wsMensalidades.getCell(r, 7).value = linha.formaPagamento || "";
    wsMensalidades.getCell(r, 8).value = linha.observacao || "";
    wsMensalidades.getRow(r).font = { name: FONT_NAME };
  });
  const ultimaLinha1 = primeiraLinhaDados1 + Math.max(linhasMensalidades.length, 1) - 1;
  const totalRow1 = ultimaLinha1 + 1;
  wsMensalidades.mergeCells(totalRow1, 1, totalRow1, 2);
  wsMensalidades.getCell(totalRow1, 1).value = "TOTAL RECEBIDO (STATUS = PAGO)";
  const totalCell1 = wsMensalidades.getCell(totalRow1, 3);
  totalCell1.value = {
    formula: `SUMIF(E${primeiraLinhaDados1}:E${ultimaLinha1},"Pago",C${primeiraLinhaDados1}:C${ultimaLinha1})`,
  };
  totalCell1.numFmt = CURRENCY_FMT;
  for (let c = 1; c <= headers1.length; c++) {
    wsMensalidades.getCell(totalRow1, c).fill = TOTAL_FILL;
    wsMensalidades.getCell(totalRow1, c).font = { name: FONT_NAME, bold: true };
  }

  // ---------------- Doações ----------------
  const wsDoacoes = workbook.addWorksheet("Doações");
  wsDoacoes.columns = [{ width: 14 }, { width: 26 }, { width: 16 }, { width: 22 }, { width: 20 }, { width: 28 }];
  wsDoacoes.mergeCells(1, 1, 1, 6);
  wsDoacoes.getCell(1, 1).value = `DOAÇÕES RECEBIDAS — ${mesFormatado}`;
  wsDoacoes.getCell(1, 1).font = { name: FONT_NAME, bold: true, size: 14, color: { argb: "FF2F5496" } };

  const headers2 = ["Data", "Doador / Membro", "Valor (R$)", "Categoria", "Forma de Pagamento", "Observação"];
  headers2.forEach((h, i) => (wsDoacoes.getCell(3, i + 1).value = h));
  estilizarCabecalho(wsDoacoes, 3, headers2.length);

  const primeiraLinhaDados2 = 4;
  linhasDoacoes.forEach((linha, idx) => {
    const r = primeiraLinhaDados2 + idx;
    wsDoacoes.getCell(r, 1).value = linha.data;
    wsDoacoes.getCell(r, 2).value = linha.doadorNome || "Anônimo";
    wsDoacoes.getCell(r, 3).value = Number(linha.valor);
    wsDoacoes.getCell(r, 3).numFmt = CURRENCY_FMT;
    wsDoacoes.getCell(r, 4).value = linha.categoria;
    wsDoacoes.getCell(r, 5).value = linha.formaPagamento || "";
    wsDoacoes.getCell(r, 6).value = linha.observacao || "";
    wsDoacoes.getRow(r).font = { name: FONT_NAME };
  });
  const ultimaLinha2 = primeiraLinhaDados2 + Math.max(linhasDoacoes.length, 1) - 1;
  const totalRow2 = ultimaLinha2 + 1;
  wsDoacoes.mergeCells(totalRow2, 1, totalRow2, 2);
  wsDoacoes.getCell(totalRow2, 1).value = "TOTAL DE DOAÇÕES";
  const totalCell2 = wsDoacoes.getCell(totalRow2, 3);
  totalCell2.value = { formula: `SUM(C${primeiraLinhaDados2}:C${ultimaLinha2})` };
  totalCell2.numFmt = CURRENCY_FMT;
  for (let c = 1; c <= headers2.length; c++) {
    wsDoacoes.getCell(totalRow2, c).fill = TOTAL_FILL;
    wsDoacoes.getCell(totalRow2, c).font = { name: FONT_NAME, bold: true };
  }

  // ---------------- Despesas ----------------
  const wsDespesas = workbook.addWorksheet("Despesas");
  wsDespesas.columns = [{ width: 14 }, { width: 20 }, { width: 32 }, { width: 16 }, { width: 20 }];
  wsDespesas.mergeCells(1, 1, 1, 5);
  wsDespesas.getCell(1, 1).value = `DESPESAS DO TERREIRO — ${mesFormatado}`;
  wsDespesas.getCell(1, 1).font = { name: FONT_NAME, bold: true, size: 14, color: { argb: "FF2F5496" } };

  const headers3 = ["Data", "Categoria", "Descrição", "Valor (R$)", "Forma de Pagamento"];
  headers3.forEach((h, i) => (wsDespesas.getCell(3, i + 1).value = h));
  estilizarCabecalho(wsDespesas, 3, headers3.length);

  const primeiraLinhaDados3 = 4;
  linhasDespesas.forEach((linha, idx) => {
    const r = primeiraLinhaDados3 + idx;
    wsDespesas.getCell(r, 1).value = linha.data;
    wsDespesas.getCell(r, 2).value = linha.categoria;
    wsDespesas.getCell(r, 3).value = linha.descricao;
    wsDespesas.getCell(r, 4).value = Number(linha.valor);
    wsDespesas.getCell(r, 4).numFmt = CURRENCY_FMT;
    wsDespesas.getCell(r, 5).value = linha.formaPagamento || "";
    wsDespesas.getRow(r).font = { name: FONT_NAME };
  });
  const ultimaLinha3 = primeiraLinhaDados3 + Math.max(linhasDespesas.length, 1) - 1;
  const totalRow3 = ultimaLinha3 + 1;
  wsDespesas.mergeCells(totalRow3, 1, totalRow3, 3);
  wsDespesas.getCell(totalRow3, 1).value = "TOTAL DE DESPESAS";
  const totalCell3 = wsDespesas.getCell(totalRow3, 4);
  totalCell3.value = { formula: `SUM(D${primeiraLinhaDados3}:D${ultimaLinha3})` };
  totalCell3.numFmt = CURRENCY_FMT;
  for (let c = 1; c <= headers3.length; c++) {
    wsDespesas.getCell(totalRow3, c).fill = TOTAL_FILL;
    wsDespesas.getCell(totalRow3, c).font = { name: FONT_NAME, bold: true };
  }

  // ---------------- Resumo e Balanço ----------------
  const wsResumo = workbook.addWorksheet("Resumo e Balanço");
  wsResumo.columns = [{ width: 34 }, { width: 4 }, { width: 20 }];
  wsResumo.mergeCells(1, 1, 1, 3);
  wsResumo.getCell(1, 1).value = "PRESTAÇÃO DE CONTAS — RESUMO E BALANÇO";
  wsResumo.getCell(1, 1).font = { name: FONT_NAME, bold: true, size: 14, color: { argb: "FF2F5496" } };

  wsResumo.getCell(3, 1).value = "Mês de referência:";
  wsResumo.getCell(3, 1).font = { name: FONT_NAME, bold: true };
  wsResumo.getCell(3, 3).value = mesFormatado;

  wsResumo.mergeCells(5, 1, 5, 3);
  wsResumo.getCell(5, 1).value = "ENTRADAS";
  wsResumo.getCell(5, 1).fill = HEADER_FILL;
  wsResumo.getCell(5, 1).font = { name: FONT_NAME, bold: true, color: { argb: "FFFFFFFF" } };

  wsResumo.getCell(6, 1).value = "Mensalidades recebidas (status = Pago)";
  wsResumo.getCell(6, 3).value = { formula: `Mensalidades!C${totalRow1}` };
  wsResumo.getCell(6, 3).numFmt = CURRENCY_FMT;

  wsResumo.getCell(7, 1).value = "Doações recebidas";
  wsResumo.getCell(7, 3).value = { formula: `'Doações'!C${totalRow2}` };
  wsResumo.getCell(7, 3).numFmt = CURRENCY_FMT;

  wsResumo.getCell(8, 1).value = "TOTAL DE ENTRADAS";
  wsResumo.getCell(8, 3).value = { formula: "C6+C7" };
  [wsResumo.getCell(8, 1), wsResumo.getCell(8, 3)].forEach((c) => {
    c.fill = TOTAL_FILL;
    c.font = { name: FONT_NAME, bold: true };
  });
  wsResumo.getCell(8, 3).numFmt = CURRENCY_FMT;

  wsResumo.mergeCells(10, 1, 10, 3);
  wsResumo.getCell(10, 1).value = "SAÍDAS";
  wsResumo.getCell(10, 1).fill = HEADER_FILL;
  wsResumo.getCell(10, 1).font = { name: FONT_NAME, bold: true, color: { argb: "FFFFFFFF" } };

  wsResumo.getCell(11, 1).value = "Total de despesas do terreiro";
  wsResumo.getCell(11, 3).value = { formula: `Despesas!D${totalRow3}` };
  wsResumo.getCell(11, 3).numFmt = CURRENCY_FMT;

  wsResumo.getCell(12, 1).value = "TOTAL DE SAÍDAS";
  wsResumo.getCell(12, 3).value = { formula: "C11" };
  [wsResumo.getCell(12, 1), wsResumo.getCell(12, 3)].forEach((c) => {
    c.fill = TOTAL_FILL;
    c.font = { name: FONT_NAME, bold: true };
  });
  wsResumo.getCell(12, 3).numFmt = CURRENCY_FMT;

  wsResumo.mergeCells(14, 1, 14, 3);
  wsResumo.getCell(14, 1).value = "BALANÇO DO MÊS";
  wsResumo.getCell(14, 1).fill = HEADER_FILL;
  wsResumo.getCell(14, 1).font = { name: FONT_NAME, bold: true, color: { argb: "FFFFFFFF" } };

  wsResumo.getCell(15, 1).value = "Saldo do mês anterior (preencha manualmente)";
  wsResumo.getCell(15, 3).value = 0;
  wsResumo.getCell(15, 3).font = { name: FONT_NAME, color: { argb: "FF0000FF" } };
  wsResumo.getCell(15, 3).numFmt = CURRENCY_FMT;

  wsResumo.getCell(16, 1).value = "Resultado do mês (Entradas - Saídas)";
  wsResumo.getCell(16, 3).value = { formula: "C8-C12" };
  wsResumo.getCell(16, 3).numFmt = CURRENCY_FMT;

  wsResumo.getCell(17, 1).value = "SALDO ACUMULADO";
  wsResumo.getCell(17, 3).value = { formula: "C15+C16" };
  [wsResumo.getCell(17, 1), wsResumo.getCell(17, 3)].forEach((c) => {
    c.fill = TOTAL_FILL;
    c.font = { name: FONT_NAME, bold: true };
  });
  wsResumo.getCell(17, 3).numFmt = CURRENCY_FMT;

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="prestacao-de-contas-${mes}.xlsx"`,
    },
  });
}
