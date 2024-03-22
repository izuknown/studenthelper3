import { Pinecone } from '@pinecone-database/pinecone';
import { UploadToS3 } from './s3';
import { downloadFromS3 } from './s3-server';
import { transcribeAndExtract, TranscriptionResult } from './transcription'; // Import transcribeAndExtract from transcription.ts

// Note: Import OpenAI using CommonJS syntax since it's imported that way in transcription.ts
const OpenAI = require('openai');

// Initialise Pinecone
const pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

export async function loadS3IntoPinecone(fileKey: string) {
    try {
        // Create an instance of OpenAI
        const openai = new OpenAI({
            apiKey: process.env['OPENAI_API_KEY'],
        });

        // Upload the file to S3
        console.log('Uploading file to S3...');
        const s3Data = await UploadToS3(fileKey);
        if (!s3Data) {
            throw new Error("Could not upload file to S3");
        }
        console.log('File uploaded to S3:', s3Data);

        // Download the file from S3
        console.log('Downloading file from S3...');
        const filePath = await downloadFromS3(s3Data.file_key);
        if (!filePath) {
            throw new Error("Could not download file from S3");
        }
        console.log('File downloaded from S3:', filePath);

        // Transcribe the downloaded media file using OpenAI
        const transcriptionResult: TranscriptionResult | undefined = await transcribeAndExtract(filePath);

        // Perform additional processing steps if needed

        // Return the transcription data
        return transcriptionResult;
    } catch (error) {
        console.error('Error loading S3 file into Pinecone:', error);
        throw error; // Propagate the error to the caller
    }
}
