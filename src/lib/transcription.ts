import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import ffmpeg from 'fluent-ffmpeg';
import * as wav from 'node-wav';
import { Readable } from 'stream';

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

const SUPPORTED_EXTENSIONS = [".mp4", ".m4a", ".mp3", ".wav"];
const AUDIO_CHUNK_SIZE = 60 * 1000; // 1 minute in milliseconds

const logger = console; // Replace with a proper logging library if needed

function extractAudio(inputFile: string, outputFile: string): void {
    logger.info('extractAudio function called');
    
    ffmpeg()
        .input(inputFile)
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .output(outputFile)
        .on('end', () => {
            logger.info('Audio extraction finished');
        })
        .run();
}

function processMP4File(inputFile: string): string {
    const extractedAudioFile = `${path.basename(inputFile, path.extname(inputFile))}_extracted_audio.wav`;
    extractAudio(inputFile, extractedAudioFile);
    return extractedAudioFile;
}

function processWAVFile(inputFile: string): string {
    return inputFile;
}

function processUnsupportedFile(fileExtension: string): void {
    logger.warn(`Unsupported file type: ${fileExtension}`);
    return;
}

export async function transcribeAndExtract(audioFile: string): Promise<string | undefined> {
    let fullTranscript = '';

    if (audioFile) {
        const fileExtension = path.extname(audioFile).toLowerCase();

        let extractedAudioFile = '';

        if (SUPPORTED_EXTENSIONS.includes(fileExtension)) {
            logger.info(`Submitted file identified as ${fileExtension.toUpperCase()} file`);
            if (fileExtension === ".mp4") {
                extractedAudioFile = processMP4File(audioFile);
            } else if (fileExtension === ".wav") {
                extractedAudioFile = processWAVFile(audioFile);
            } else {
                // Handle other supported file types
                extractedAudioFile = audioFile;
            }
        } else {
            processUnsupportedFile(fileExtension);
            return;
        }

        logger.info("Audio file reloaded as a WAV file");
        const audioData = fs.readFileSync(extractedAudioFile);
        const audio = wav.decode(audioData);

        const numChunks = Math.ceil(audio.sampleRate * audio.channelData[0].length / AUDIO_CHUNK_SIZE);

        for (let i = 0; i < numChunks; i++) {
            const startTime = i * AUDIO_CHUNK_SIZE;
            const endTime = (i + 1) * AUDIO_CHUNK_SIZE;
            const currentChunk = audio.channelData[0].slice(startTime, endTime);

            logger.info(`Chunk ${i} exported`);
            const currentChunkData = wav.encode([currentChunk], { sampleRate: audio.sampleRate, float: false });
            fs.writeFileSync("current_chunk.wav", currentChunkData);

            const currentChunkBuffer = fs.readFileSync("current_chunk.wav");
            const currentChunkStream = new Readable();
            currentChunkStream.push(currentChunkBuffer);
            currentChunkStream.push(null);
            logger.info(`Chunk ${i} being transcribed`);

            try {
                const transcript = await openai.audio.transcriptions.create({
                    model: 'whisper-1',
                    file: {
                        buffer: currentChunkStream,
                        options: {
                            filename: 'audio.wav',
                            contentType: 'audio/wav',
                        },
                    },
                } as any);

                logger.info(`Chunk ${i} transcribed`);
                logger.info(`\n\nChunk ${i} transcription is...\n${transcript}`);
                fullTranscript += transcript;
            } catch (error) {
                logger.error(`Error transcribing chunk ${i}: ${error}`);
            }
        }

        const txtFilePath = `/tmp/pdf-full_transcript-${Date.now()}.txt`;
        fs.writeFileSync(txtFilePath, fullTranscript, { encoding: "utf-8" });

        const pdfFilePath = `/tmp/pdf-full_transcript-${Date.now()}.pdf`;

        logger.info(`Full transcript saved as text: ${txtFilePath}`);
        logger.info(`Full transcript saved as PDF: ${pdfFilePath}`);

        return pdfFilePath;
    }
}