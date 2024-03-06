import { Pinecone } from '@pinecone-database/pinecone';
import { downloadFromS3 } from './s3-server';

// Initialise Pinecone
const pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

export async function loadS3IntoPinecone (fileKey: string) {
    // 1. Obtain the uploaded recording
    console.log('Downloading S3 file into the file system');
        const file_name = await downloadFromS3(filekey);
        if (!file_name) {
            throw new Error("Could not download from S3");
        }

    // 2. Transcribe the recording saving the transcription as a PDF

    // 3. Split and segment the pdf

    // 4. vectorise and embed the segments

    // 5. store the vectors into pinecone 
}