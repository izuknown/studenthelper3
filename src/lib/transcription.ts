import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { Readable } from 'stream';
import FormData from 'form-data';
import PDFDocument from 'pdfkit'
import fetch from 'node-fetch';

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

export interface TranscriptionResult {
    transcript: string;
    pdfPath: string;
}

function saveTranscriptAsPDF(transcript: string, pdfFilePath: string) {
    try {
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(pdfFilePath));
        doc.font('Times-Roman') // Use a standard font
           .fontSize(12)
           .text(transcript, {
               align: 'left',
               indent: 20,
               height: 300,
               ellipsis: true
           });
        doc.end();
    } catch (error) {
        console.error('Error creating PDF:', error);
        // Handle the error, perhaps by informing the user or attempting an alternative solution
    }
}

interface TranscriptionResponse {
    text?: string;
    error?: {
        message: string;
        type: string;
        param: string | null;
        code: string | null;
    };
}

async function transcribeChunk(filePath: string, start: number, end: number, retryCount = 3): Promise<string> {
    let attempts = 0;
    while (attempts < retryCount) {
        try {
            const fileStream = fs.createReadStream(filePath, { start, end });
            const formData = new FormData();
            formData.append('file', fileStream);
            formData.append('model', 'whisper-1');

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env['OPENAI_API_KEY']}`,
                    ...formData.getHeaders()
                },
                body: formData
            });

            const result = await response.json();

            if (result.error) {
                console.error(`Error in transcription attempt ${attempts + 1}:`, result.error.message);
                attempts++;
                continue;
            }

            return result.text || 'No transcript available';
        } catch (error) {
            console.error(`Error during chunk transcription attempt ${attempts + 1}: ${error}`);
            attempts++;
        }
    }
    return '';
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
            const endPosition = Math.min(currentPosition + CHUNK_SIZE, totalSize);
            const transcript = await transcribeChunk(audioFile, currentPosition, endPosition);
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
