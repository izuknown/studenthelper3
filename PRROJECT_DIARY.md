The file file is being uploaded and then downloaded but there doesn't appear to be any transcription taking place. Review the code up until the transctiption stage. 
Add console.logs throughout to see where it is breaking. 
GET CODE TO TRANSCRIBE THE text. 


pinecone.ts
import { Pinecone } from '@pinecone-database/pinecone';
import { UploadToS3 } from './s3';
import { downloadFromS3 } from './s3-server';
import { transcribeAndExtract, TranscriptionResult } from './transcription'; // Import transcribeAndExtract from transcription.ts


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
--------------------------------------------------------------------------------
import { Pinecone, Vector } from '@pinecone-database/pinecone';
import fs from 'fs';
import { downloadFromS3 } from './s3-server';
import { transcribeAndExtract, TranscriptionResult } from './transcription';
import { getEmbeddings } from './embeddings';
import dotenv from 'dotenv'; 
import md5 from 'md5';
import {PDFLoader} from 'langchain/document_loaders/fs/pdf';
import { Document, RecursiveCharacterTextSplitter } from '@pinecone-database/doc-splitter';
import { convertToAscii } from './utils';

// Load environment variables from .env file
dotenv.config();

// Initialise Pinecone with the API key from the environment variables
const pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

export async function loadS3IntoPinecone(fileKey: string) {
    try {
        // Download the file from S3 using the key
        console.log('Downloading file from S3...');
        const filePath = await downloadFromS3(fileKey);
        if (!filePath) {
            throw new Error("Could not download file from S3");
        }
        console.log('File downloaded from S3:', filePath);

        // Transcribe the downloaded media file
        const transcriptionResult: TranscriptionResult | undefined = await transcribeAndExtract(filePath);
        if (!transcriptionResult) {
            throw new Error("Could not transcribe the file");
        }

        // Save the transcription result as a PDF named 'transcription_result.pdf'
        const pdfFilePath = 'transcription_result.pdf';
        fs.writeFileSync(pdfFilePath, transcriptionResult.transcript, 'utf-8');
        console.log(`Transcription saved as PDF file at: ${pdfFilePath}`);

         // Convert pdf using langchain
         if (!pdfFilePath){
            throw new Error('Issue with file path. (see pinecone.ts line 40)')
        }
        console.log ('FIle path is...', pdfFilePath)
        const loader = new PDFLoader(pdfFilePath);
        const pages = await loader.load();
        console.log('Pages:', pages)
        //return { pages, transcriptionResult}

        // split and segment the transcription
        const documents = await Promise.all(pages.map(page=>prepareText(page)));

        // vectorise and embed individual documents
        const vectors = await Promise.all(documents.flat().map(embedDocuments))

        // upload to pinecone
        const client = await pineconeClient 
        const pineconeIndex = client.Index('studenthelper3')

        console.log('Inserting vectors into pinecone')
        const namespace = convertToAscii(fileKey)
        await pineconeIndex.upsert(vectors)
        return documents[0]
        

    
        } catch (error) {
        console.error('Error loading S3 file:', error);
        throw error; // Propagate the error to the caller
        }

}

async function embedDocuments (doc: Document) {
    try {
        const embeddings = await getEmbeddings(doc.pageContent)
        const hash = md5(doc.pageContent)

        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber
            }
        } as Vector
    } catch (error) {
        console.log ('error with embedding docuemnts from pinecone.ts line 69', error)
        throw error
    }
}

export const truncateStringByBytes = (str: string, bytes: number)=> {
    const enc = new TextEncoder()
    return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, bytes))
}

async function prepareText(fullTranscript: string): Promise<Document[]> {
    // Truncate the full transcript to fit within a certain number of bytes (36000 bytes in this case)
    const truncatedText = truncateStringByBytes(fullTranscript, 36000);

    // Split the transcript into documents
    const splitter = new RecursiveCharacterTextSplitter();
    const documents = await splitter.splitDocuments([
        new Document({
            pageContent: truncatedText,
            metadata: {
                text: truncatedText,
                // You may want to add additional metadata here if needed
            }
        })
    ]);

    return documents;
}