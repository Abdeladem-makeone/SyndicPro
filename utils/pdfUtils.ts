
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Palette de couleurs SyndicPro
const COLORS = {
  PRIMARY: [79, 70, 229],    // Indigo 600
  SECONDARY: [100, 116, 139], // Slate 500
  SUCCESS: [22, 163, 74],     // Green 600
  DANGER: [220, 38, 38],      // Red 600
  BG_LIGHT: [248, 250, 252],  // Slate 50
  TEXT_DARK: [30, 41, 59],    // Slate 800
  WHITE: [255, 255, 255]
};

const drawHeader = (doc: any, title: string, subtitle: string) => {
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 38);
};

export const exportAnnualReportPDF = async (
  buildingName: string,
  year: number,
  summary: any,
  unpaidList: any[],
  expenseBreakdown: any[]
) => {
  const doc = new jsPDF() as any;

  drawHeader(doc, "BILAN ANNUEL DE GESTION", `${buildingName.toUpperCase()} - ANNÉE ${year}`);

  // Section I
  doc.setTextColor(...COLORS.TEXT_DARK);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("I. RÉSUMÉ DE LA SITUATION FINANCIÈRE", 14, 65);

  const drawStatBox = (x: number, y: number, label: string, value: string, color: number[]) => {
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(...COLORS.WHITE);
    doc.roundedRect(x, y, 60, 25, 3, 3, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.SECONDARY);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + 5, y + 8);
    doc.setFontSize(12);
    doc.setTextColor(...color);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + 5, y + 18);
  };

  drawStatBox(14, 75, "TOTAL RECETTES", `+${summary.totalRevenue.toLocaleString()} DH`, COLORS.SUCCESS);
  drawStatBox(77, 75, "TOTAL DÉPENSES", `-${summary.totalExpenses.toLocaleString()} DH`, COLORS.DANGER);
  drawStatBox(140, 75, "SOLDE NET", `${summary.balance.toLocaleString()} DH`, COLORS.PRIMARY);

  // Section II
  doc.setTextColor(...COLORS.TEXT_DARK);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("II. ÉTAT DES CRÉANCES (IMPAYÉS)", 14, 120);

  doc.autoTable({
    startY: 125,
    head: [['Appartement', 'Propriétaire', 'Retards', 'Montant Dû']],
    body: unpaidList.map(item => [
      item.number,
      item.owner,
      `${item.unpaidCount} mois`,
      `${item.totalOwed.toLocaleString()} DH`
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLORS.DANGER },
    styles: { font: 'helvetica' },
    columnStyles: { 3: { halign: 'right' } }
  });

  const lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 180;
  
  // Section III
  doc.setTextColor(...COLORS.TEXT_DARK);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("III. RÉPARTITION DES CHARGES", 14, lastY + 20);

  doc.autoTable({
    startY: lastY + 25,
    head: [['Catégorie', 'Montant', 'Part (%)']],
    body: expenseBreakdown.map(item => [
      item.name,
      `${item.value.toLocaleString()} DH`,
      `${item.percentage.toFixed(1)} %`
    ]),
    theme: 'grid',
    headStyles: { fillColor: COLORS.PRIMARY },
    styles: { font: 'helvetica' },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' } }
  });

  doc.save(`Bilan_${buildingName.replace(/\s+/g, '_')}_${year}.pdf`);
};

export const exportCashStatePDF = async (
  buildingName: string,
  summary: any,
  recentTransactions: any[]
) => {
  const doc = new jsPDF() as any;

  drawHeader(doc, "ÉTAT DE CAISSE ET LIQUIDITÉS", buildingName.toUpperCase());

  // Card Balance
  doc.setFillColor(...COLORS.BG_LIGHT);
  doc.setDrawColor(...COLORS.PRIMARY);
  doc.roundedRect(14, 60, 182, 35, 4, 4, 'FD');
  
  doc.setTextColor(...COLORS.PRIMARY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("SOLDE DISPONIBLE EN CAISSE", 105, 72, { align: 'center' });
  doc.setFontSize(28);
  doc.text(`${summary.balance.toLocaleString()} DH`, 105, 87, { align: 'center' });

  // Transactions
  doc.setTextColor(...COLORS.TEXT_DARK);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("DERNIERS MOUVEMENTS DE FONDS", 14, 110);

  doc.autoTable({
    startY: 115,
    head: [['Date', 'Opération', 'Détails', 'Flux (DH)']],
    body: recentTransactions.map(tr => [
      tr.date,
      tr.type,
      tr.description,
      tr.amount
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLORS.PRIMARY },
    styles: { font: 'helvetica' },
    columnStyles: { 3: { halign: 'right' } }
  });

  doc.save(`Etat_Caisse_${buildingName.replace(/\s+/g, '_')}.pdf`);
};

export const exportToPDF = (title: string, headers: string[], rows: any[][], fileName: string) => {
  const doc = new jsPDF() as any;
  
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 40,
    theme: 'striped',
    headStyles: { fillColor: COLORS.PRIMARY },
    styles: { font: 'helvetica' }
  });
  doc.save(`${fileName}.pdf`);
};
