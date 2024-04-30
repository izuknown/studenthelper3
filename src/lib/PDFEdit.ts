import { PDFDocument, rgb } from 'pdf-lib';

export async function editPDF(
    transcript: string,
    fontName = 'Helvetica',
    fontSize = 12,
    fontColor = [0, 0, 0],
    backgroundColor = [1, 1, 1]
): Promise<Uint8Array> {
    try {
        // Create a new PDF document
        console.log('creating new pdf')
        const pdfDoc = await PDFDocument.create();

        // Add a new page to the document
        console.log('adding adding new page')
        const page = pdfDoc.addPage();

        // Set font, font size, and font color
        console.log('font setting')
        const font = await pdfDoc.embedFont(fontName);
        page.setFont(font);
        page.setFontSize(fontSize);
        page.setFontColor(rgb(fontColor[0], fontColor[1], fontColor[2]));

        // Set background color
        console.log('setting background colour')
        page.drawRectangle({
            x: 0,
            y: 0,
            width: page.getWidth(),
            height: page.getHeight(),
            color: rgb(backgroundColor[0], backgroundColor[1], backgroundColor[2]),
        });

        // Add transcript as text content
        console.log('adding transcript')
        page.drawText(transcript, {
            x: 50, // Adjust x-coordinate as needed
            y: page.getHeight() - 50, // Adjust y-coordinate as needed
        });

        // Save the new PDF document as a Uint8Array
        console.log('saving PDF')
        const modifiedPdfBytes = await pdfDoc.save();
        return modifiedPdfBytes;
    } catch (error) {
        console.error('Error editing PDF:', error);
        throw error;
    }
}