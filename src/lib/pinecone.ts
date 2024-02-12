// Import necessary modules
import { Pinecone } from '@pinecone-database/pinecone';
import { downloadFromS3 } from './s3-server';
import { transcribeAndExtract, TranscriptionResult } from './transcription';
import fs from 'fs'; // Corrected import statement
import { getEmbeddings } from "./embeddings";

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
        const transcriptionResult = await transcribeAndExtract(file_name);
        if (!transcriptionResult) {
            throw new Error('Could not transcribe the file or generate PDF');
        }

        console.log('Transcription:', transcriptionResult.transcript);
        console.log('Transcription saved as PDF:', transcriptionResult.pdfPath);

        // Loading the transcription text into Pinecone
        console.log('Loading transcription text into Pinecone');
        const pineconeClient = await getPineconeClient();

        // Use the `embeddings` function to generate vectors from the transcribed text
        const vector = await embeddings(transcriptionResult.transcript); // Adjust this call as necessary

        // Construct the record for Pinecone with the obtained vector
        const record = {
            id: file_key, // Unique identifier
            vector: vector, // The vector representation obtained from `embeddings`
            metadata: {
                title: "Transcribed Document", // Example metadata
                pdfUrl: "URL_to_the_uploaded_PDF" // URL to the uploaded PDF, if applicable
            }
        };

        // Insert the vector record into Pinecone
        const result = await pineconeClient.upsert([record]);
        console.log('Transcription text loaded into Pinecone:', result);

    } catch (error) {
        console.error('Error:', error);
    }
}
