let storedPDFFilePath: string | null = null;

export function returnPDFFilePath(pdfFilePath: string) {
    storedPDFFilePath = pdfFilePath;
    console.log('PDF file path stored:', storedPDFFilePath);
}

export function getStoredPDFFilePath(): string | null {
    return storedPDFFilePath;
}
