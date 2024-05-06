import { editPDF } from './PDFEdit';
import { UploadPDFToS3, getS3Url } from './s3';


export async function createAndUploadPDF(transcript: string, fileKey: string) {
  try {
    // Format the transcript as a PDF
    console.log('Formatting transcript as PDF...');
    const formattedPdfBytes = await editPDF(transcript, 'Helvetica', 12, [0, 0, 0], [1, 1, 1]);

    // Create a Blob from the formatted PDF bytes
    const blob = new Blob([formattedPdfBytes], { type: 'application/pdf' });

    // Create a File from the Blob
    const file = new File([blob], 'formatted.pdf', { type: 'application/pdf' });

    // Upload the formatted PDF to S3
    console.log('Uploading PDF to S3...');
    const { file_key } = await UploadPDFToS3(file);

    // Store the S3 URL in your database
    const pdfFilePath = getS3Url(file_key);
    console.log('PDF uploaded to S3: pdfUpload', pdfFilePath);

    return pdfFilePath; // Return the pdfFilePath
    
  } catch (error) {
    console.error('Error creating or uploading PDF:', error);
    throw error;
  }
}