import { Pinecone} from '@pinecone-database/pinecone';
import { downloadFromS3 } from './s3-server';
import { transcribeAndExtract, TranscriptionResult } from './transcription';
import { getEmbeddings } from './embeddings';
import dotenv from 'dotenv'; 
import md5 from 'md5';
import { Document, RecursiveCharacterTextSplitter } from '@pinecone-database/doc-splitter';


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

        if (transcriptionResult) {
            console.log('Here is the transcription result:........', transcriptionResult)
        }

        //split and segment full transcription
        const transcribedtext = await Promise.all(
            Array.isArray(transcriptionResult.transcript)
                ? transcriptionResult.transcript.map(prepareText)
                : [prepareText(transcriptionResult.transcript)]
        );

        // vectorise and embed the full transcript
        const vectors = await Promise.all(transcribedtext.flat().map(embedDocuments))

        // upload to pinecone
        const client = await pineconeClient;
        const pineconeIndex = client.Index('studenthelper3');

        console.log('Inserting transcript into pinecone');
        await pineconeIndex.upsert(vectors.map(vector => ({ id: vector.id, values: vector.values })));
        console.log('Completed Inserting transcript into pinecone');

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
        } 
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
            }
        })
    ]);

    return documents;
}