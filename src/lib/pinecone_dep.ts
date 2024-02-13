// Import necessary modules
import { Pinecone } from '@pinecone-database/pinecone';
import { downloadFromS3 } from './s3-server';
import { transcribeAndExtract, TranscriptionResult } from './transcription_dep';
import fs from 'fs';
import { getEmbeddings } from "./embeddings";
import path from 'path';


// Initialize Pinecone client with the API key
const pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

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

        // Use the `getEmbeddings` function to generate vectors from the transcribed text
        const vector = await getEmbeddings(transcriptionResult.transcript);

        // Construct the record for Pinecone with the obtained vector
        const record = {
            id: file_key, // Unique identifier
            values: vector, // The vector representation obtained from `getEmbeddings`
            metadata: {
                title: path.basename(file_name), // Example metadata
                pdfUrl: transcriptionResult.pdfPath // Use the actual PDF path
            }
        };

        // Target the specific index where you want to upsert the record
        const indexName = 'studenthelper3'; 
        const index = pineconeClient.index(indexName);

        // Insert the vector record into Pinecone
        const result = await index.upsert([record]);
        console.log('Transcription text loaded into Pinecone:', result);

    } catch (error) {
        console.error('Error:', error);
    }
}
