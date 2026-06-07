import httpx
from app.core.config import settings


def synthesize_speech(text: str) -> bytes:
    """
    Synthesizes text to speech using ElevenLabs if key is configured.
    Returns audio bytes.
    """
    if settings.ELEVENLABS_API_KEY:
        try:
            voice_id = settings.ELEVENLABS_VOICE_ID or "21m00Tcm4TlvDq8ikWAM"
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            headers = {
                "xi-api-key": settings.ELEVENLABS_API_KEY,
                "Content-Type": "application/json"
            }
            body = {
                "text": text,
                "model_id": "eleven_turbo_v2_5",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                }
            }
            # Timeout set for fast response
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=body, headers=headers)
                if res.status_code == 200:
                    return res.content
                else:
                    print(f"⚠️ ElevenLabs TTS API error: {res.status_code} - {res.text}")
        except Exception as e:
            print(f"⚠️ ElevenLabs speech synthesis exception: {e}")
    return b""
