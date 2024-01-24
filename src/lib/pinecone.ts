// Import necessary modules
import { Pinecone } from '@pinecone-database/pinecone';
import { downloadFromS3 } from './s3-server';
import { transcribeAndExtract, TranscriptionResult } from './transcription';
// Add any additional imports needed for Pinecone's API

let pinecone: Pinecone | null = null;

export const getPineconeClient = async () => {
    if (!pinecone) {
        pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        });
    }
    return pinecone;
};

export async function loadS3IntoPinecone(file_key: string) {
    try {
        // Download the file from S3
        console.log('Downloading S3 file into the file system');
        const file_name = await downloadFromS3(file_key);
        if (!file_name) {
            throw new Error("Could not download from S3");
        }

        // Transcribe the file
        console.log('File downloaded from S3:', file_name);
        const transcriptionResult = await transcribeAndExtract(file_name) as TranscriptionResult;
        if (!transcriptionResult) {
            throw new Error('Could not transcribe the file or generate PDF');
        }

        console.log('Transcription:', transcriptionResult.transcript);
        console.log('Transcription saved as PDF:', transcriptionResult.pdfPath);



        // 3. Load the transcription into Pinecone (assuming the transcription is in a suitable format)
        // console.log('Loading transcription into Pinecone');
        // const pineconeClient = await getPineconeClient();

        // Assuming you have a function in Pinecone to load data, adjust accordingly
        // const result = await pineconeClient.loadData(pdfPath, { /* other options */ });
        // console.log('Transcription loaded into Pinecone:');

    } catch (error) {
        console.error('Error:', error);
    }
}
