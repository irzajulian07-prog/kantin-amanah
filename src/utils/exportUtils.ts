import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  dataKey: string;
  width?: number;
}

export interface ExportPdfOptions {
  title: string;
  subtitle?: string;
  periodLabel?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  fileName: string;
  summaryRows?: Array<{ label: string; value: string }>;
  pesantrenName?: string;
}

export interface ExportExcelOptions {
  fileName: string;
  sheetName?: string;
  title?: string;
  periodLabel?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  summaryRows?: Array<{ label: string; value: string }>;
}

/**
 * Export data array to an Excel (.xlsx) file using SheetJS
 */
export const exportToExcel = ({
  fileName,
  sheetName = 'Laporan',
  title,
  periodLabel,
  columns,
  data,
  summaryRows = []
}: ExportExcelOptions) => {
  // Format table rows matching the specified columns
  const formattedRows = data.map((item, index) => {
    const row: Record<string, any> = { 'No.': index + 1 };
    columns.forEach((col) => {
      row[col.header] = item[col.dataKey] !== undefined && item[col.dataKey] !== null ? item[col.dataKey] : '-';
    });
    return row;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  // Auto-fit column widths
  const colWidths = [
    { wch: 6 }, // No
    ...columns.map((col) => ({
      wch: Math.max(col.header.length, 14)
    }))
  ];
  worksheet['!cols'] = colWidths;

  // Create workbook and append sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  // If summary rows exist, add a metadata sheet
  if (summaryRows.length > 0 || title || periodLabel) {
    const metaData = [
      { Properti: 'Judul Laporan', Nilai: title || 'Laporan AMANAH Smart Mart' },
      { Properti: 'Periode', Nilai: periodLabel || 'Semua Waktu' },
      { Properti: 'Tanggal Export', Nilai: new Date().toLocaleString('id-ID') },
      { Properti: 'Total Baris Data', Nilai: data.length },
      ...summaryRows.map((s) => ({ Properti: s.label, Nilai: s.value }))
    ];
    const metaSheet = XLSX.utils.json_to_sheet(metaData);
    metaSheet['!cols'] = [{ wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, metaSheet, 'Ringkasan & Metadata');
  }

  // Generate file and trigger download
  const cleanFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, cleanFileName);
};

/**
 * Export data array to PDF document using jsPDF + autoTable
 */
export const exportToPdf = ({
  title,
  subtitle = 'Sistem Informasi Kantin Santriwati Digital',
  periodLabel = 'Semua Periode',
  columns,
  data,
  fileName,
  summaryRows = [],
  pesantrenName = 'PONDOK PESANTREN DARUL AMANAH – SMART MART'
}: ExportPdfOptions) => {
  // Initialize PDF in landscape for wide data, or portrait for compact data
  const isLandscape = columns.length > 6;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header styling & Pesantren branding
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(pesantrenName, 14, 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Kantin Digital Santriwati Terintegrasi RFID & Cashless System', 14, 16);
  doc.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID')}`, pageWidth - 14, 16, { align: 'right' });

  // Report Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 33);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${periodLabel}   |   ${subtitle}`, 14, 39);

  let currentY = 43;

  // Render Summary Cards / Stats in PDF if provided
  if (summaryRows.length > 0) {
    const cardWidth = (pageWidth - 28 - (summaryRows.length - 1) * 4) / Math.min(summaryRows.length, 4);
    summaryRows.slice(0, 4).forEach((stat, idx) => {
      const x = 14 + idx * (cardWidth + 4);
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(x, currentY, cardWidth, 12, 1.5, 1.5, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(stat.label, x + 3, currentY + 4.5);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(stat.value), x + 3, currentY + 9.5);
    });
    currentY += 16;
  }

  // Format table data
  const tableHeaders = ['No.', ...columns.map((c) => c.header)];
  const tableBody = data.map((item, index) => [
    index + 1,
    ...columns.map((c) => (item[c.dataKey] !== undefined && item[c.dataKey] !== null ? item[c.dataKey] : '-'))
  ]);

  // Generate Table using autoTable
  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.5
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    styles: {
      overflow: 'linebreak',
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }
    },
    margin: { left: 14, right: 14, bottom: 18 },
    didDrawPage: (pageData) => {
      // Footer page number
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${pageData.pageNumber} dari ${pageCount} — Dokumen Resmi AMANAH Smart Mart`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }
  });

  const cleanFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  doc.save(cleanFileName);
};
