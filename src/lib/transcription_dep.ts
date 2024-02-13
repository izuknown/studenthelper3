const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const FormData = require('form-data');
import PDFDocument from 'pdfkit';
import fetch from 'node-fetch';
const ffmpeg = require('fluent-ffmpeg');

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

export interface TranscriptionResult {
    transcript: string;
    pdfPath: string;
}

function saveTranscriptAsPDF(transcript: string, pdfFilePath: string) {
    console.log("Entering saveTranscriptAsPDF"); // Added log
    try {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(pdfFilePath); // Capture stream for listening to events
        doc.pipe(stream);
        doc.end();
        console.log("PDF content written, ending document."); // added log
        
        stream.on('finish', () => {
            console.log(`PDF saved successfully at ${pdfFilePath}`); // Added log
        });

        stream.on('error', (err: Error) => {
            console.error(`Error saving PDF: ${err}`); // Added log
        });
    } catch (error) {
        console.error('Error creating PDF:', error);
    }
}

function convertMp4ToMp3(inputPath: string, outputPath: string): Promise<string>{
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat('mp3')
            .on('end', () => {
                console.log('Conversion finished.');
                resolve(outputPath);
            })
            .on('error', (err:Error) => {
                console.error('Error:', err);
                reject(err);
            })
            .saveToFile(outputPath);
    });
}

interface TranscriptionResponse {
    text?: string;
    error?: {
        message: string;
        type: string;
        param?: string;
        code?: string;
    };
}

async function transcribeChunk(filePath: string, start: number, end: number, retryCount = 3): Promise<string>{
    let attempts = 0;
    while (attempts < retryCount) {
        try {
            console.log('transcribe chunk function activated')
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
    console.log("Entering transcribeAndExtract"); 
    if (!audioFile) {
        console.error('No audio file provided for transcription');
        return undefined;
    }

    let fileToTranscribe = audioFile;

    // Check if the file is an MP4 file
    if (path.extname(audioFile).toLowerCase() === '.mp4') {
        const mp3FilePath = audioFile.replace(path.extname(audioFile), '.mp3');

        // Convert MP4 to MP3
        try {
            console.log('converting mp4 to mp3')
            await convertMp4ToMp3(audioFile, mp3FilePath);
            console.log('File converted successfully');
            fileToTranscribe = mp3FilePath;
        } catch (err) {
            console.error('Error converting file:', err);
            return undefined;
        }
    }

    const CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB
    const fileStats = fs.statSync(fileToTranscribe);
    const totalSize = fileStats.size;
    let currentPosition = 0;
    let fullTranscript = '';

    while (currentPosition < totalSize) {
        console.log(`Processing chunk starting at position ${currentPosition}`);
        const endPosition = Math.min(currentPosition + CHUNK_SIZE, totalSize);
        const transcript = await transcribeChunk(fileToTranscribe, currentPosition, endPosition);
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

    return undefined;
}
