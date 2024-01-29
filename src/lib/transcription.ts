import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { Readable } from 'stream';
import PDFDocument from 'pdfkit';

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

export interface TranscriptionResult {
    transcript: string;
    pdfPath: string;
}

function saveTranscriptAsPDF(transcript: string, pdfFilePath: string) {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfFilePath));
    doc.font('Times-Roman')
       .fontSize(12)
       .text(transcript, {
           align: 'left',
           indent: 20,
           height: 300,
           ellipsis: true
       });
    doc.end();
}

async function transcribeChunk(fileStream: Readable): Promise<string> {
    try {
        const transcriptResponse = await openai.audio.transcriptions.create({
            model: 'whisper-1',
            file: {
                buffer: fileStream,
                options: {
                    filename: 'chunk.wav',
                    contentType: 'audio/wav'
                }
            }
        } as any);

        console.log('Chunk transcription response received');
        console.log('Chunk Transcription:', JSON.stringify(transcriptResponse, null, 2));

        return transcriptResponse.data.transcript || 'No transcript available';
    } catch (error) {
        console.error(`Error during chunk transcription: ${error}`);
        return '';
    }
}

export async function transcribeAndExtract(audioFile: string): Promise<TranscriptionResult | undefined> {
    if (audioFile) {
        const CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB
        const fileStats = fs.statSync(audioFile);
        const totalSize = fileStats.size;
        let currentPosition = 0;
        let fullTranscript = '';

        while (currentPosition < totalSize) {
            console.log(`Processing chunk starting at position ${currentPosition}`);
            const fileStream = fs.createReadStream(audioFile, { start: currentPosition, end: currentPosition + CHUNK_SIZE - 1 });
            const transcript = await transcribeChunk(fileStream);
            fullTranscript += transcript;
            currentPosition += CHUNK_SIZE;
        }

        if (fullTranscript) {
            console.log('Transcription of all chunks complete');
            const txtFilePath = `/tmp/full_transcript-${Date.now()}.txt`;
            fs.writeFileSync(txtFilePath, fullTranscript, 'utf-8');
            console.log(`Transcript saved as text file at: ${txtFilePath}`);

            const pdfFilePath = `/tmp/full_transcript-${Date.now()}.pdf`;
            saveTranscriptAsPDF(fullTranscript, pdfFilePath);
            console.log(`Transcript saved as PDF at: ${pdfFilePath}`);

            return { transcript: fullTranscript, pdfPath: pdfFilePath };
        }
    } else {
        console.error('No audio file provided for transcription');
    }

    return undefined;
}
