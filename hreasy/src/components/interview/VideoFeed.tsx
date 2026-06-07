import React, { useEffect, useRef } from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface VideoFeedProps {
  stream: MediaStream | null;
  isActive: boolean;
  onStreamReady: (stream: MediaStream) => void;
  onStreamError: (err: string) => void;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  stream,
  isActive,
  onStreamReady,
  onStreamError,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (isActive && !stream) {
      navigator.mediaDevices
        .getUserMedia({
          video: { width: 1280, height: 720 },
          audio: { echoCancellation: true, noiseSuppression: true },
        })
        .then((mediaStream) => {
          onStreamReady(mediaStream);
        })
        .catch((err) => {
          console.error('Webcam permission error:', err);
          onStreamError(err.message || 'Permission denied');
        });
    }
  }, [isActive, stream, onStreamReady, onStreamError]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950 flex flex-col items-center justify-center text-slate-400">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1] transition-transform duration-300"
        />
      ) : (
        <div className="flex flex-col items-center gap-3 p-6 text-center animate-pulse">
          <CameraOff className="w-12 h-12 text-slate-600" />
          <p className="text-sm font-bold text-white">Camera Permission Required</p>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Please allow camera and microphone access to complete the AI video interview.
          </p>
        </div>
      )}
    </div>
  );
};
