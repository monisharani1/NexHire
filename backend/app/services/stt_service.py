import io
from app.core.config import settings

def transcribe_audio(audio_bytes: bytes, file_name: str = "audio.webm") -> str:
    """
    Transcribes audio bytes to text using Groq Whisper API (Free & Fast).
    """
    if settings.GROQ_API_KEY:
        try:
            from groq import Groq  # type: ignore
            client = Groq(api_key=settings.GROQ_API_KEY)
            
            # Groq Python SDK expects a tuple of (filename, file_content)
            audio_file = (file_name, audio_bytes)
            
            transcription = client.audio.transcriptions.create(
              file=audio_file,
              model="whisper-large-v3-turbo",
            )
            return transcription.text
        except Exception as e:
            print(f"⚠️ Groq Whisper transcription exception: {e}")
            
    return ""
