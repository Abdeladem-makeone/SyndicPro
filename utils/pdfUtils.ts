
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  PRIMARY: [79, 70, 229] as [number, number, number],
  SECONDARY: [100, 116, 139] as [number, number, number],
  SUCCESS: [16, 185, 129] as [number, number, number],
  DANGER: [239, 68, 68] as [number, number, number],
  TEXT_DARK: [30, 41, 59] as [number, number, number],
  WHITE: [255, 255, 255] as [number, number, number]
};

const drawHeader = (doc: jsPDF, title: string, subtitle: string) => {
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(...COLORS.WHITE);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 34);
};

export const exportToPDF = (title: string, headers: string[], rows: any[][], fileName: string) => {
  const doc = new jsPDF();
  drawHeader(doc, "SYNDICPRO MANAGER", title.toUpperCase());
  
  autoTable(doc, {
    startY: 50,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: COLORS.PRIMARY },
    styles: { font: 'helvetica', fontSize: 9 }
  });
  
  doc.save(`${fileName}.pdf`);
};

export const exportCashStatePDF = (buildingName: string, summary: any, transactions: any[]) => {
  const doc = new jsPDF();
  drawHeader(doc, "ÉTAT DE CAISSE", buildingName.toUpperCase());

  autoTable(doc, {
    startY: 50,
    head: [['Désignation', 'Valeur']],
    body: [
      ['Total Recettes', `${summary.totalRevenue.toLocaleString()} DH`],
      ['Total Dépenses', `${summary.totalExpenses.toLocaleString()} DH`],
      ['Solde Actuel', `${summary.balance.toLocaleString()} DH`]
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.PRIMARY },
    styles: { font: 'helvetica' }
  });

  // Utilisation sécurisée de la position finale du tableau précédent
  const finalY = (doc as any).lastAutoTable?.finalY || 80;

  autoTable(doc, {
    startY: finalY + 10,
    head: [['Date', 'Type', 'Description', 'Montant']],
    body: transactions.map(t => [t.date, t.type, t.description, t.amount]),
    theme: 'striped',
    headStyles: { fillColor: COLORS.SECONDARY },
    styles: { font: 'helvetica', fontSize: 8 }
  });

  doc.save(`Etat_Caisse_${buildingName.replace(/\s+/g, '_')}.pdf`);
};

export const exportAnnualReportPDF = (
  buildingName: string,
  year: number,
  summary: any,
  unpaidList: any[],
  expenseBreakdown: any[],
  revenueBreakdown: any[]
) => {
  const doc = new jsPDF();
  drawHeader(doc, "BILAN ANNUEL DE GESTION", `${buildingName.toUpperCase()} - ANNÉE ${year}`);

  doc.setTextColor(...COLORS.TEXT_DARK);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("I. RÉCAPITULATIF DES RECETTES", 14, 65);

  autoTable(doc, {
    startY: 70,
    head: [['Source de Revenu', 'Montant Encaissé']],
    body: revenueBreakdown.map(r => [r.name, `${r.value.toLocaleString()} DH`]),
    theme: 'grid',
    headStyles: { fillColor: COLORS.PRIMARY },
    styles: { font: 'helvetica' },
    columnStyles: { 1: { halign: 'right' } }
  });

  let currentY = (doc as any).lastAutoTable?.finalY || 100;
  currentY += 15;

  doc.setTextColor(...COLORS.TEXT_DARK);
  doc.setFontSize(14);
  doc.text("II. ANALYSE FINANCIÈRE GLOBALE", 14, currentY);

  const drawStatBox = (x: number, y: number, label: string, value: string, color: [number, number, number]) => {
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(...COLORS.WHITE);
    doc.roundedRect(x, y, 60, 25, 3, 3, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.SECONDARY);
    doc.text(label, x + 5, y + 8);
    doc.setFontSize(11);
    doc.setTextColor(...color);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + 5, y + 18);
  };

  drawStatBox(14, currentY + 10, "TOTAL RECETTES", `+${summary.totalRevenue.toLocaleString()} DH`, COLORS.SUCCESS);
  drawStatBox(77, currentY + 10, "TOTAL DÉPENSES", `-${summary.totalExpenses.toLocaleString()} DH`, COLORS.DANGER);
  drawStatBox(140, currentY + 10, "SOLDE NET", `${summary.balance.toLocaleString()} DH`, COLORS.PRIMARY);

  currentY += 45;

  doc.setTextColor(...COLORS.TEXT_DARK);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("III. ÉTAT DES CRÉANCES (IMPAYÉS)", 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [['Appartement', 'Propriétaire', 'Retards', 'Montant Dû']],
    body: unpaidList.map(item => [
      item.number,
      item.owner,
      `${item.unpaidCount} mois`,
      `${item.totalOwed.toLocaleString()} DH`
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLORS.DANGER },
    styles: { font: 'helvetica', fontSize: 9 },
    columnStyles: { 3: { halign: 'right' } }
  });

  currentY = (doc as any).lastAutoTable?.finalY || currentY + 40;

  if (currentY < 230) {
    doc.setTextColor(...COLORS.TEXT_DARK);
    doc.setFontSize(14);
    doc.text("IV. RÉPARTITION DES CHARGES", 14, currentY + 15);
    autoTable(doc, {
      startY: currentY + 20,
      head: [['Catégorie', 'Montant', 'Part (%)']],
      body: expenseBreakdown.map(item => [
        item.name,
        `${item.value.toLocaleString()} DH`,
        `${item.percentage.toFixed(1)} %`
      ]),
      theme: 'grid',
      headStyles: { fillColor: COLORS.PRIMARY },
      styles: { font: 'helvetica', fontSize: 9 }
    });
  }

  doc.save(`Bilan_${year}_${buildingName.replace(/\s+/g, '_')}.pdf`);
};
