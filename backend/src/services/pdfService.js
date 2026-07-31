const PDFDocument = require('pdfkit');

/**
 * Streams a generated PDF report directly to the HTTP response.
 * @param {import('express').Response} res
 * @param {Object} data - { title, subtitle, sections: [{heading, body}], table: {headers, rows} }
 */
const streamReportPDF = (res, data) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${data.filename || 'report.pdf'}"`);
  doc.pipe(res);

  doc.fontSize(18).fillColor('#0b5394').text('Airports Authority of India', { align: 'center' });
  doc.fontSize(14).fillColor('#000').text(data.title || 'Report', { align: 'center' });
  if (data.subtitle) {
    doc.fontSize(10).fillColor('#555').text(data.subtitle, { align: 'center' });
  }
  doc.moveDown();
  doc.strokeColor('#0b5394').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown();

  (data.sections || []).forEach((section) => {
    doc.fontSize(12).fillColor('#0b5394').text(section.heading, { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#000').text(section.body, { align: 'justify' });
    doc.moveDown();
  });

  if (data.table && data.table.rows?.length) {
    const { headers, rows } = data.table;
    const colWidth = 495 / headers.length;
    doc.fontSize(10).fillColor('#fff');
    const startX = 50;
    let y = doc.y + 5;

    doc.rect(startX, y, 495, 20).fill('#0b5394');
    headers.forEach((h, i) => {
      doc.fillColor('#fff').text(h, startX + i * colWidth + 4, y + 5, { width: colWidth - 8 });
    });
    y += 20;

    rows.forEach((row, rIdx) => {
      const rowColor = rIdx % 2 === 0 ? '#f2f2f2' : '#ffffff';
      doc.rect(startX, y, 495, 20).fill(rowColor);
      row.forEach((cell, i) => {
        doc.fillColor('#000').text(String(cell), startX + i * colWidth + 4, y + 5, { width: colWidth - 8 });
      });
      y += 20;
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });
  }

  doc.moveDown(2);
  doc.fontSize(8).fillColor('#888').text(`Generated on ${new Date().toLocaleString('en-IN')}`, { align: 'right' });

  doc.end();
};

module.exports = { streamReportPDF };
