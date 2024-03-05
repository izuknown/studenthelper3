import { Pinecone } from '@pinecone-database/pinecone';
import { downloadFromS3 } from './olds3-server';
import { transcribeAndExtract, TranscriptionResult } from './transcription';
import { getEmbeddings } from "./embeddings";

// Initialize Pinecone client with the API key
const pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});



export async function loadS3IntoPinecone(file_key: string) {
    try {
        // 1. Download the file from S3
        console.log('Downloading S3 file into the file system');
        const file_name = await downloadFromS3(file_key);
        if (!file_name) {
            throw new Error("Could not download from S3");
        }

        // 2. Transcribe the file and save as txt (ideally pdf)
        console.log('File downloaded from S3:', file_name);
        const transcriptionResult = await transcribeAndExtract(file_name);
        if (!transcriptionResult) {
            console.error('Could not transcribe the file');
            return; // Exit if transcription failed
        }

        // Log transcription result
        console.log('Transcription:', transcriptionResult.transcript);

        // 3. split and segment the txt(pdf)

        // 4. vectorise and embed individual documents 

        // 5. upload to pinecone 

        // Assuming getEmbeddings can handle text directly for simplicity
        const vector = await getEmbeddings(transcriptionResult.transcript);
        {/*
        // Construct the record for Pinecone with the obtained vector
        const record = {
            id: file_key, // Unique identifier
            values: vector, // The vector representation obtained from `getEmbeddings`
            metadata: {
                title: "Transcribed Document", // Example metadata
                txtUrl: transcriptionResult.txtFilePath // Adjusted to use txtFilePath
            }
        };

        // Target the specific index where you want to upsert the record
        const indexName = 'studenthelper3'; 
        const index = pineconeClient.index(indexName);

        // Insert the vector record into Pinecone
        const result = await index.upsert([record]);
        console.log('Transcription text loaded into Pinecone:', result);
        */}
    } catch (error) {
        console.error('Error:', error);
    }
}
