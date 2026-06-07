import os
from app.core.config import settings

cloudinary_configured = False

# Only configure Cloudinary if all variables are set
if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
    try:
        import cloudinary
        import cloudinary.uploader
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET
        )
        cloudinary_configured = True
    except ImportError:
        print("⚠️ Cloudinary package not installed. Falling back to local storage.")


def save_recording(file_bytes: bytes, session_uuid: str) -> str:
    """
    Uploads the video recording to Cloudinary if credentials exist.
    Otherwise, saves to 'backend/static/recordings/' and returns local URL.
    """
    if cloudinary_configured:
        try:
            result = cloudinary.uploader.upload_large(
                file_bytes,
                resource_type="video",
                public_id=f"{session_uuid}",
                folder="nexhire/interviews",
                overwrite=True,
                tags=["interview", "nexhire"]
            )
            return result["secure_url"]
        except Exception as e:
            print(f"⚠️ Cloudinary upload failed: {e}. Falling back to local storage.")

    # Local storage fallback
    # Resolve backend root path
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    static_dir = os.path.join(backend_root, "static")
    recordings_dir = os.path.join(static_dir, "recordings")
    os.makedirs(recordings_dir, exist_ok=True)

    file_name = f"{session_uuid}.webm"
    file_path = os.path.join(recordings_dir, file_name)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Return local asset path URL
    return f"http://localhost:8000/static/recordings/{file_name}"
