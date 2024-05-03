import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

function wordWrap(text: string, maxWidth: number, font: any, fontSize: number): string {
    let result = '';
    let line = '';
    const words = text.split(' ');

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const width = font.widthOfTextAtSize(word, fontSize);

        if (line.length + width < maxWidth) {
            line += (line ? ' ' : '') + word;
        } else {
            result += (result ? '\n' : '') + line;
            line = word;
        }
    }

    result += (result ? '\n' : '') + line;
    return result;
}

export async function editPDF(
    transcript: string,
    fontName = 'Helvetica',
    fontSize = 12,
    fontColor = [0, 0, 0],
    backgroundColor = [1, 1, 1]
): Promise<Uint8Array> {
    try {
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();

        // Add a new page to the document
        let page = pdfDoc.addPage();

        // Set font, font size, and font color
        const font = await pdfDoc.embedFont(fontName);
        page.setFont(font);
        page.setFontSize(fontSize);
        page.setFontColor(rgb(fontColor[0], fontColor[1], fontColor[2]));

        // Set background color
        page.drawRectangle({
            x: 0,
            y: 0,
            width: page.getWidth(),
            height: page.getHeight(),
            color: rgb(backgroundColor[0], backgroundColor[1], backgroundColor[2]),
        });

        // Calculate available space on the first page
        const margin = 50;
        const textWidth = page.getWidth() - 2 * margin;
        let y = page.getHeight() - margin; // Track current y-coordinate

        // Embed standard font to calculate text metrics
        const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontHeight = fontSize * font.heightAtSize(fontSize);
        const lineHeight = fontHeight * 1.2; // Adjust line spacing as needed

        // Wrap the transcript text
        const wrappedText = wordWrap(transcript, textWidth, font, fontSize);

        // Split wrapped text into lines
        const lines = wrappedText.split('\n');

        // Iterate over lines and draw them on pages
        let remainingText = '';
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (y < margin + lineHeight) {
                // If the current page is filled, add a new page
                page = pdfDoc.addPage();
                page.setFont(font);
                page.setFontSize(fontSize);
                page.setFontColor(rgb(fontColor[0], fontColor[1], fontColor[2]));

                // Set background color
                page.drawRectangle({
                    x: 0,
                    y: 0,
                    width: page.getWidth(),
                    height: page.getHeight(),
                    color: rgb(backgroundColor[0], backgroundColor[1], backgroundColor[2]),
                });

                // Reset y-coordinate and draw remaining text
                y = page.getHeight() - margin;
                if (remainingText) {
                    page.drawText(remainingText, {
                        x: margin,
                        y,
                        maxWidth: textWidth,
                    });
                    y -= fontHeight * remainingText.split('\n').length;
                    remainingText = '';
                }
            }

            // Draw line on the current page
            page.drawText(line, {
                x: margin,
                y,
                maxWidth: textWidth,
            });

            // Update y-coordinate for the next line
            y -= lineHeight;
        }

        // Save the new PDF document as a Uint8Array
        const modifiedPdfBytes = await pdfDoc.save();
        return modifiedPdfBytes;
    } catch (error) {
        console.error('Error editing PDF:', error);
        throw error;
    }
}
