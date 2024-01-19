// Import the required modules
import { Pinecone } from '@pinecone-database/pinecone';
import { downloadFromS3 } from './s3-server';
import {transcribeAndExtract} from './transcription';
import { WebPDFLoader } from "langchain/document_loaders/web/pdf";


let pinecone: Pinecone | null = null;

export const getPineconeClient = async () => {
    if (!pinecone) {
        pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
            
        });
    }
    return pinecone;
};

// Function to load S3 file into Pinecone and transcribe
export async function loadS3IntoPinecone(file_key: string) {
    try {
        // 1. Obtain the uploaded file from S3
        console.log('Downloading S3 file into the file system');
        const file_name = await downloadFromS3(file_key);
        if (!file_name) {
            throw new Error("Could not download from S3");
        }

        // 2. Transcribe the file
        console.log('File downloaded from S3:', file_name);
        const pdfPath = await transcribeAndExtract(file_name);
        if (!pdfPath){
            throw new Error ('Could not find filepath to PDF transcription');
        }

        const response = await fetch(pdfPath);
        const pdfBlob = await response.blob();
        const loader = new WebPDFLoader(pdfBlob);
        const pages = await loader.load();
        return pages;


        // 3. Load the transcription into Pinecone (assuming the transcription is in a suitable format)
        console.log('Loading transcription into Pinecone');
        const pineconeClient = await getPineconeClient();

        // Assuming you have a function in Pinecone to load data, adjust accordingly
        // const result = await pineconeClient.loadData(pdfPath, { /* other options */ });
        console.log('Transcription loaded into Pinecone:');

    } catch (error) {
        console.error('Error:', error);
    }
}
