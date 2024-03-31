import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function saveTranscriptionAsPDF(transcription: string, txtFilePath: string): Promise<string | null> {
    try {
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();

        // Add a new page to the PDF
        const page = pdfDoc.addPage();

        // Set the font and size for the text
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        page.setFont(helveticaFont);
        page.setFontSize(12);

        // Add the transcription text to the PDF page, replacing special characters
        const lines = transcription.split('\n');
        const textHeight = 12;
        const yStart = page.getHeight() - 50; // Adjust as needed
        const specialCharsRegex = /[^\x00-\x7F]/g; // Matches non-ASCII characters
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].replace(specialCharsRegex, ''); // Replace special characters
            if (yStart - (i * textHeight) < 50) {
                // If the text reaches the bottom of the page, create a new page
                const newPage = pdfDoc.addPage();
                newPage.setFont(helveticaFont);
                newPage.setFontSize(12);
                newPage.drawText(line, { x: 50, y: newPage.getHeight() - 50 });
            } else {
                page.drawText(line, { x: 50, y: yStart - (i * textHeight) });
            }
        }

        // Save the PDF to a file
        const pdfFilePath = txtFilePath.replace('.txt', '.pdf');
        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(pdfFilePath, pdfBytes);

        console.log(`Transcription saved as PDF file at: ${pdfFilePath}`);
        return pdfFilePath;
    } catch (error) {
        console.error('Error saving transcription as PDF:', error);
        return null;
    }
}

export function convertToAscii (inputString: string) {
  // remove non ascii characters
  const asciiString = inputString.replace(/[^\x00-\x7F]+/g, "")
  return asciiString;
}