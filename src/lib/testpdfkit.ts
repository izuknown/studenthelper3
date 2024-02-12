const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('output.pdf'));
doc.fontSize(25).text('PDFKit works!', 100, 100);
doc.end();
console.log('PDF created');
