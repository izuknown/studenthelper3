const  fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const FormData = require('form-data');
import fetch from 'node-fetch';
const ffmpeg = require('fluent-ffmpeg');
import { getS3Url } from './s3';
import { editPDF } from './PDFEdit'; // Import the editPDF function
import { getFileKey, UploadPDFToS3 } from './s3'; // Import the UploadToS3 function
import { createAndUploadPDF } from './pdfUpload';


const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

export interface TranscriptionResult {
    transcript: string;
    txtFilePath: string;
    pdfFilePath: string | null;
}

function convertMp4ToMp3(inputPath: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat('mp3')
            .on('end', () => {
                console.log('Conversion finished.');
                resolve(outputPath);
            })
            .on('error', (err: Error) => {
                console.error('Error:', err);
                reject(err);
            })
            .saveToFile(outputPath);
    });
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

            const result = await response.json() as any;

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
    if (!audioFile) {
        console.error('No audio file provided for transcription');
        return undefined;
    }

    let fileToTranscribe = audioFile;

    // Check if the file is an MP4 file
    if (path.extname(audioFile).toLowerCase() === '.mp4') {
        // Convert MP4 to MP3
        const mp3FilePath = audioFile.replace(path.extname(audioFile), '.mp3');
        try {
            await convertMp4ToMp3(audioFile, mp3FilePath);
            fileToTranscribe = mp3FilePath;
        } catch (err) {
            console.error('Error converting file:', err);
            return undefined;
        }
    }

    // Transcription logic remains the same
    const CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB
    const totalSize = fs.statSync(fileToTranscribe).size;
    let currentPosition = 0;
    let fullTranscript = '';

    while (currentPosition < totalSize) {
        const endPosition = Math.min(currentPosition + CHUNK_SIZE, totalSize);
        const transcript = await transcribeChunk(fileToTranscribe, currentPosition, endPosition);
        fullTranscript += transcript;
        currentPosition += CHUNK_SIZE;
    }

    if (fullTranscript) {
        try {
            console.log('Transcript obtained, transcription.ts');
    
            // Format the transcript as a PDF
            console.log('Formatting transcript as PDF...');
            const formattedPdfBytes = await editPDF(fullTranscript, 'Helvetica', 12, [0, 0, 0], [1, 1, 1]);
    
            // Create a Blob from the formatted PDF bytes
            console.log('Formatting blob thingy transcription.ts');
            const blob = new Blob([formattedPdfBytes], { type: 'application/pdf' });
            
            // Create a File from the Blob
            console.log('Creating file from blob transcription.ts');
            const file = new File([blob], 'formatted.pdf', { type: 'application/pdf' });
    
            // Upload the formatted PDF to S3
            console.log('Uploading PDF to S3 transcription.ts');
            const { file_key } = await getFileKey(file);
            console.log("File Key transcriptio.ts l-127:", file_key)
    
            // Store the S3 URL in your database
            console.log('storing pdf to s3 transcription.ts')
            const pdfFilePath = await createAndUploadPDF(fullTranscript, file_key);
            console.log('PDF uploaded to S3 transcription.ts transcrition.ts l-133:', pdfFilePath);


            return { transcript: fullTranscript, txtFilePath: '', pdfFilePath: pdfFilePath };

        } catch (error) {
            console.error('Error formatting or uploading PDF:', error);
            return undefined;
        }
    }

    return undefined;
}
