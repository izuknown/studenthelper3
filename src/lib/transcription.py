""" import math
from moviepy.video.io.VideoFileClip import VideoFileClip
from moviepy.editor import VideoFileClip
from dotenv import load_dotenv
import os
import openai
from pydub import AudioSegment

load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')

# Initialize messages with the system message
messages = [{"role": "system", "content": "You are a friendly and knowledgeable university professor."}]
full_transcript = ''
formatted_text = ''

def extract_audio(input_file, output_file):
    print('extract_aduio fuction called')
    video_clip = VideoFileClip(input_file)
    audio_clip = video_clip.audio
    audio_clip.write_audiofile(output_file)

def transcribe_and_extract(audio_file):
    global full_transcript

    if audio_file is not None:
        # Determine the file type and handle accordingly
        file_extension = audio_file.name.split(".")[-1].lower()

        extracted_audio_file = f"{audio_file.name.split('.')[0]}_extracted_audio.wav"


        if file_extension == "mp4":
            print("submitted file identified as MP4 file")
            # Extract audio from MP4
            extract_audio(audio_file.name, extracted_audio_file)
        
        elif file_extension == "m4a":
             print("Submitted file identified as M4A file")
             print (f"name of file is...{audio_file}")
       
            
        elif file_extension == "mp3":
             print("Submitted file identified as MP3 file")
             print (f"name of file is...{audio_file}")
           
        

        # Use the uploaded audio directly for other file types (WAV and MP4)
        elif file_extension in ["wav", "mp4"]:
            print(f"Submitted file identified as {file_extension.upper()} file")
            # Use the uploaded audio directly
            extracted_audio_file = audio_file.name
        else:
            print(f"Unsupported file type: {file_extension}")
            return

        # Load the audio file
        print ("audio file reloaded as a WAV file")
        audio = AudioSegment.from_file(extracted_audio_file, format="wav")

        # Split the audio into 1-minute chunks
        chunk_size = 60 * 1000  # 1 minute in milliseconds
        num_chunks = math.ceil(len(audio) / chunk_size)

        # Initialize variable for full transcript
        full_transcript = ""

        # Iterate through audio chunks and transcribe
        for i in range(num_chunks):
            start_time = i * chunk_size
            end_time = (i + 1) * chunk_size
            current_chunk = audio[start_time:end_time]

            # Export the current chunk
            print(f"chunk{i} exported")
            current_chunk.export("current_chunk.wav", format="wav")

            # Transcribe the current chunk using Whisper
            with open("current_chunk.wav", "rb") as current_chunk_file:
                print (f"chunk{i} being tracnscripted")
                transcript = openai.Audio.transcribe(
                    model="whisper-1",
                    file=current_chunk_file,
                    response_format="text"
                )
                print (f"chunk{i} transcribed")
                print(f"\n\nchunk{i} transcription is...\n", transcript)
                full_transcript += transcript

        # Save full_transcript to a text file
        with open("full_transcript.txt", "w", encoding="utf-8") as txt_file:
            txt_file.write(full_transcript)

        return full_transcript """



import math
import os
import logging
from dotenv import load_dotenv
from moviepy.video.io.VideoFileClip import VideoFileClip
from pydub import AudioSegment
import openai
from fpdf import FPDF  # Import FPDF for PDF generation

# Load environment variables
load_dotenv()

# Initialize OpenAI API key
openai.api_key = os.getenv('OPENAI_API_KEY')

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize messages with the system message
messages = [{"role": "system", "content": "You are a friendly and knowledgeable university professor."}]
full_transcript = ''
formatted_text = ''

def extract_audio(input_file, output_file):
    logger.info('extract_audio function called')
    video_clip = VideoFileClip(input_file)
    audio_clip = video_clip.audio
    audio_clip.write_audiofile(output_file)

def transcribe_and_extract(audio_file):
    global full_transcript

    if audio_file is not None:
        # Determine the file type and handle accordingly
        file_extension = audio_file.name.split(".")[-1].lower()

        extracted_audio_file = f"{audio_file.name.split('.')[0]}_extracted_audio.wav"

        if file_extension == "mp4":
            logger.info("Submitted file identified as MP4 file")
            # Extract audio from MP4
            extract_audio(audio_file.name, extracted_audio_file)
        
        elif file_extension == "m4a":
            logger.info(f"Submitted file identified as M4A file. Name of file is {audio_file}")
       
        elif file_extension == "mp3":
            logger.info(f"Submitted file identified as MP3 file. Name of file is {audio_file}")

        # Use the uploaded audio directly for other file types (WAV and MP4)
        elif file_extension in ["wav", "mp4"]:
            logger.info(f"Submitted file identified as {file_extension.upper()} file")
            # Use the uploaded audio directly
            extracted_audio_file = audio_file.name
        else:
            logger.warning(f"Unsupported file type: {file_extension}")
            return

        # Load the audio file
        logger.info("Audio file reloaded as a WAV file")
        audio = AudioSegment.from_file(extracted_audio_file, format="wav")

        # Split the audio into 1-minute chunks
        chunk_size = 60 * 1000  # 1 minute in milliseconds
        num_chunks = math.ceil(len(audio) / chunk_size)

        # Initialize variable for full transcript
        full_transcript = ""

        # Iterate through audio chunks and transcribe
        for i in range(num_chunks):
            start_time = i * chunk_size
            end_time = (i + 1) * chunk_size
            current_chunk = audio[start_time:end_time]

            # Export the current chunk
            logger.info(f"Chunk {i} exported")
            current_chunk.export("current_chunk.wav", format="wav")

            # Transcribe the current chunk using Whisper
            with open("current_chunk.wav", "rb") as current_chunk_file:
                logger.info(f"Chunk {i} being transcribed")
                transcript = openai.Audio.transcribe(
                    model="whisper-1",
                    file=current_chunk_file,
                    response_format="text"
                )
                logger.info(f"Chunk {i} transcribed")
                logger.info(f"\n\nChunk {i} transcription is...\n{transcript}")
                full_transcript += transcript

        # Save full_transcript to a text file
        txt_file_path = "full_transcript.txt"
        with open(txt_file_path, "w", encoding="utf-8") as txt_file:
            txt_file.write(full_transcript)
        
        # Convert full_transcript to PDF
        pdf_file_path = "full_transcript.pdf"
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.multi_cell(0, 10, full_transcript)
        pdf.output(pdf_file_path)

        logger.info(f"Full transcript saved as text: {txt_file_path}")
        logger.info(f"Full transcript saved as PDF: {pdf_file_path}")

        return pdf_file_path
