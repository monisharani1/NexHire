import React, { useState, useRef, useEffect } from 'react';

import { Video, VideoOff, Mic, MicOff, Play, CheckCircle, Loader } from 'lucide-react';

const mockQuestions = [
  "Tell me about a time you had to overcome a technical challenge.",
  "How do you handle disagreements within a team?",
  "Describe a project you are particularly proud of.",
  "Where do you see your career going in the next 3 years?"
];

export default function VideoInterview({ setActivePage }: { setActivePage: (page: string) => void }) {
  const candidateId = "cand-123";

  // Media
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // State
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Interview flow
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [conversation, setConversation] = useState<{role: 'ai' | 'candidate', text: string}[]>([
    { role: 'ai', text: mockQuestions[0] }
  ]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setCameraActive(true);
      setMicActive(true);
    } catch (err) {
      console.error("Failed to access camera", err);
    }
  };

  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopMedia();
    };
  }, []);

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraActive(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicActive(audioTrack.enabled);
      }
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
    
    // Append mock candidate answer
    setConversation(prev => [...prev, { 
      role: 'candidate', 
      text: "Thank you for the question. In my previous role, I frequently handled situations like this by collaborating with my team..." 
    }]);

    setIsProcessing(true);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      setIsProcessing(false);
      if (currentQuestionIndex < mockQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setConversation(prev => [...prev, { 
          role: 'ai', 
          text: mockQuestions[currentQuestionIndex + 1] 
        }]);
      } else {
        setCompleted(true);
        stopMedia();
      }
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-lg w-full text-center shadow-2xl">
          <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Interview Complete!</h2>
          <p className="text-slate-400 mb-8">
            Thank you for completing your video interview. Your responses have been submitted to the HR team.
          </p>
          <button 
            onClick={() => setActivePage('dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-blue-500/30">
            <Video className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold text-xl drop-shadow-md">AI Video Interview</h1>
            <p className="text-sm text-slate-400 drop-shadow">Candidate ID: {candidateId}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium border border-slate-700/50">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Session
          </div>
          <button 
            onClick={() => setActivePage('dashboard')}
            className="text-sm font-bold text-slate-300 hover:text-white px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Exit Interview
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Camera & Controls */}
        <div className="flex-1 p-6 flex flex-col relative overflow-hidden bg-slate-900">
          <div className="flex-1 relative rounded-3xl overflow-hidden border border-slate-700 shadow-2xl bg-black">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md z-10">
                <VideoOff className="w-20 h-20 text-slate-600 mb-4" />
                <p className="text-slate-400 text-lg font-medium">Camera is disabled</p>
              </div>
            )}

            {/* Top right recording indicator */}
            {isRecording && (
              <div className="absolute top-6 right-6 z-50 bg-red-500/90 backdrop-blur-md px-4 py-2 rounded-full font-bold text-white flex items-center gap-2 shadow-xl animate-pulse text-sm">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                Recording {formatTime(recordingTime)}
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                <Loader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-lg font-bold text-white">Analyzing Response...</p>
              </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent flex justify-center z-30">
              <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl px-6 py-3 rounded-3xl border border-slate-700/50 shadow-2xl">
                <button 
                  onClick={toggleMic} 
                  className={`p-3 rounded-2xl transition-all ${micActive ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                >
                  {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                
                <button 
                  onClick={toggleCamera} 
                  className={`p-3 rounded-2xl transition-all ${cameraActive ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                >
                  {cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <div className="w-px h-8 bg-slate-700 mx-1"></div>

                {!isRecording ? (
                  <button 
                    onClick={startRecording}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 text-sm"
                  >
                    <Play className="w-4 h-4" />
                    Start Answer
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-400 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all text-sm shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  >
                    <div className="w-4 h-4 rounded-sm bg-white"></div>
                    Finish Answer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Conversation Sidebar */}
        <div className="w-[400px] border-l border-slate-800 bg-slate-950 flex flex-col">
          <div className="p-5 border-b border-slate-800 bg-slate-900/50">
            <h2 className="font-extrabold text-white">Live Transcript</h2>
            <p className="text-xs text-slate-400 mt-1">Question {currentQuestionIndex + 1} of {mockQuestions.length}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {conversation.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'candidate' ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                  {msg.role === 'ai' ? 'AI Interviewer' : 'You'}
                </span>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
                  msg.role === 'ai' 
                    ? 'bg-slate-800 text-white rounded-tl-none border border-slate-700' 
                    : 'bg-blue-600 text-white rounded-tr-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isRecording && (
              <div className="flex flex-col items-end animate-in fade-in slide-in-from-bottom-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">You</span>
                <div className="p-4 rounded-2xl text-sm bg-blue-600/50 text-blue-100 rounded-tr-none border border-blue-500/30 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce delay-150"></span>
                  <span className="ml-2 font-medium">Listening...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
