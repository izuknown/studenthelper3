const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const FormData = require('form-data');
import fetch from 'node-fetch';
const ffmpeg = require('fluent-ffmpeg');

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

export interface TranscriptionResult {
    transcript: string;
    txtFilePath: string; // Change from pdfPath to txtFilePath
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
        // Save transcript as a .txt file instead of a PDF
        const txtFilePath = `/tmp/full_transcript-${Date.now()}.txt`;
        fs.writeFileSync(txtFilePath, fullTranscript, 'utf-8');
        console.log(`Transcript saved as text file at: ${txtFilePath}`);

        return { transcript: fullTranscript, txtFilePath: txtFilePath };
    }

    return undefined;
}
