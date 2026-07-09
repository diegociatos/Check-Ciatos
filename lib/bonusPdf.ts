// Geração de relatórios de bonificação em PDF (jsPDF + autotable).
// Layout com identidade do Grupo Ciatos e bloco de assinatura/aprovação.
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MARCA: [number, number, number] = [139, 27, 31]; // #8B1B1F
const TINTA: [number, number, number] = [28, 25, 23];
const CINZA: [number, number, number] = [120, 113, 108];
const LINHA: [number, number, number] = [230, 229, 228];

export interface LinhaPdf {
  nome: string;
  time?: string;
  aprovadas: number;
  erros: number;      // reprovadas (feita errada)
  naoFeitas: number;
  refeitas: number;   // tentativas > 0
  ganhos: number;
  penalidades: number;
  saldo: number;
  eficiencia: number;
  bonus: number;
  elegivel: boolean;
}

export interface TarefaPdf { titulo: string; status: string; evidencia: boolean; }

const hoje = () => new Date().toLocaleDateString('pt-BR');

function cabecalho(doc: jsPDF, empresa: string, subtitulo: string, periodo: string): number {
  doc.setFillColor(...MARCA);
  doc.roundedRect(14, 12, 12, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('GC', 20, 20, { align: 'center' });

  doc.setTextColor(...TINTA); doc.setFontSize(14); doc.text('Grupo Ciatos', 30, 18);
  doc.setTextColor(...CINZA); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(subtitulo, 30, 23);

  const pw = doc.internal.pageSize.getWidth();
  doc.setTextColor(...TINTA); doc.setFontSize(10); doc.text(empresa, pw - 14, 16, { align: 'right' });
  doc.setTextColor(...CINZA); doc.setFontSize(9); doc.text(`Período: ${periodo}`, pw - 14, 21, { align: 'right' });

  doc.setDrawColor(...LINHA); doc.line(14, 28, pw - 14, 28);
  return 36;
}

function rodapeAssinaturas(doc: jsPDF, yInicial: number) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  let y = Math.max(yInicial + 14, ph - 42);
  if (y > ph - 30) { doc.addPage(); y = ph - 42; }

  const cols = [
    { label: 'Gestor responsável', x: 16 },
    { label: 'RH', x: 16 + (pw - 32) / 3 },
    { label: 'Financeiro', x: 16 + (2 * (pw - 32)) / 3 },
  ];
  const largura = (pw - 32) / 3 - 8;
  doc.setDrawColor(160); doc.setTextColor(...CINZA); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  cols.forEach(c => {
    doc.line(c.x, y, c.x + largura, y);
    doc.text(c.label, c.x, y + 5);
    doc.text('Data: ____/____/______', c.x, y + 10);
  });

  doc.setFontSize(7); doc.setTextColor(...CINZA);
  doc.text(`Documento gerado em ${hoje()} — sujeito a conferência e aprovação.`, 14, ph - 10);
}

const brl = (n: number) => (n >= 0 ? '+' : '') + n;

// ---- Consolidado da equipe -------------------------------------------------
export function pdfConsolidado(empresa: string, periodo: string, linhas: LinhaPdf[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = cabecalho(doc, empresa || 'Empresa', 'Relatório de bonificação — Consolidado da equipe', periodo);

  doc.setTextColor(...TINTA); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text('Consolidado da equipe', 14, y); y += 2;

  const tot = linhas.reduce((a, r) => ({
    aprovadas: a.aprovadas + r.aprovadas, erros: a.erros + r.erros, naoFeitas: a.naoFeitas + r.naoFeitas,
    refeitas: a.refeitas + r.refeitas, ganhos: a.ganhos + r.ganhos, penalidades: a.penalidades + r.penalidades,
    saldo: a.saldo + r.saldo, bonus: a.bonus + (r.elegivel ? r.bonus : 0),
  }), { aprovadas: 0, erros: 0, naoFeitas: 0, refeitas: 0, ganhos: 0, penalidades: 0, saldo: 0, bonus: 0 });

  autoTable(doc, {
    startY: y + 4,
    head: [['Colaborador', 'Aprov.', 'Reprov.', 'Não feitas', 'Refeitas', 'Ganhos', 'Penal.', 'Saldo', 'Efic.', 'Bônus']],
    body: linhas.map(r => [
      r.nome, r.aprovadas, r.erros, r.naoFeitas, r.refeitas, brl(r.ganhos), r.penalidades, r.saldo,
      `${Math.round(r.eficiencia)}%`, r.elegivel ? `+${r.bonus}` : '—',
    ]),
    foot: [['Totais', tot.aprovadas, tot.erros, tot.naoFeitas, tot.refeitas, brl(tot.ganhos), tot.penalidades, tot.saldo, '', `+${tot.bonus}`]],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: TINTA, lineColor: LINHA },
    headStyles: { fillColor: MARCA, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [245, 243, 241], textColor: TINTA, fontStyle: 'bold' },
    columnStyles: { 0: { halign: 'left' } },
    margin: { left: 14, right: 14 },
    didParseCell: (d) => { if (d.section === 'body' && d.column.index > 0) d.cell.styles.halign = 'center'; },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? y + 20;
  rodapeAssinaturas(doc, finalY);
  doc.save(`bonificacao_consolidado_${periodo.replace(/\s+/g, '_').toLowerCase()}.pdf`);
}

// ---- Individual por colaborador -------------------------------------------
export function pdfColaborador(empresa: string, periodo: string, linha: LinhaPdf, tarefas: TarefaPdf[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = cabecalho(doc, empresa || 'Empresa', 'Relatório de bonificação — Individual', periodo);

  doc.setTextColor(...TINTA); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text(linha.nome, 14, y);
  if (linha.time) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...CINZA); doc.text(`Time: ${linha.time}`, 14, y + 5); }
  y += 12;

  // Blocos de indicadores
  const pw = doc.internal.pageSize.getWidth();
  const kpis: [string, string][] = [
    ['Eficiência', `${Math.round(linha.eficiencia)}%`],
    ['Saldo', `${linha.saldo} pts`],
    ['Bônus', linha.elegivel ? `+${linha.bonus} pts` : '—'],
    ['Elegível', linha.elegivel ? 'Sim' : 'Não'],
  ];
  const bw = (pw - 28 - 9) / 4;
  kpis.forEach(([label, val], i) => {
    const x = 14 + i * (bw + 3);
    doc.setDrawColor(...LINHA); doc.setFillColor(250, 249, 248); doc.roundedRect(x, y, bw, 18, 2, 2, 'FD');
    doc.setTextColor(...CINZA); doc.setFontSize(7); doc.text(label.toUpperCase(), x + 3, y + 6);
    doc.setTextColor(...(label === 'Bônus' && linha.elegivel ? MARCA : TINTA)); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text(val, x + 3, y + 14); doc.setFont('helvetica', 'normal');
  });
  y += 24;

  // Números do período
  autoTable(doc, {
    startY: y,
    head: [['Aprovadas', 'Reprovadas', 'Não feitas', 'Refeitas', 'Ganhos', 'Penalidades']],
    body: [[linha.aprovadas, linha.erros, linha.naoFeitas, linha.refeitas, brl(linha.ganhos), linha.penalidades]],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5, halign: 'center', textColor: TINTA, lineColor: LINHA },
    headStyles: { fillColor: MARCA, textColor: [255, 255, 255], fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  let afterY = (doc as any).lastAutoTable?.finalY ?? y + 16;

  // Detalhe das tarefas + evidências
  if (tarefas.length) {
    doc.setTextColor(...TINTA); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('Tarefas do período', 14, afterY + 10);
    autoTable(doc, {
      startY: afterY + 13,
      head: [['Tarefa', 'Status', 'Evidência']],
      body: tarefas.map(t => [t.titulo, t.status, t.evidencia ? 'Sim' : '—']),
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2, textColor: TINTA, lineColor: LINHA },
      headStyles: { fillColor: [245, 243, 241], textColor: TINTA, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'center', cellWidth: 34 }, 2: { halign: 'center', cellWidth: 24 } },
      margin: { left: 14, right: 14 },
    });
    afterY = (doc as any).lastAutoTable?.finalY ?? afterY + 16;
  }

  rodapeAssinaturas(doc, afterY);
  doc.save(`bonificacao_${linha.nome.replace(/\s+/g, '_').toLowerCase()}_${periodo.replace(/\s+/g, '_').toLowerCase()}.pdf`);
}
