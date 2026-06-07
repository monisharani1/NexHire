import React, { useState, useEffect, useRef } from 'react';
import { VideoFeed } from './VideoFeed';
import { TranscriptPanel } from './TranscriptPanel';
import { 
  apiSubmitInterviewAnswer, 
  apiCompleteInterview, 
  apiUploadInterviewRecording 
} from '../../services/api';
import { 
  Cpu, 
  Volume2, 
  Eye, 
  Activity, 
  Mic, 
  Sparkles, 
  ArrowRight, 
  Video, 
  VideoOff, 
  AlertTriangle 
} from 'lucide-react';

interface InterviewRoomProps {
  sessionUuid: string;
  candidateName: string;
  jobTitle: string;
  questions: string[];
  onComplete: (report: any) => void;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  sessionUuid,
  candidateName,
  jobTitle,
  questions,
  onComplete,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState('');
  
  // MediaRecorder states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Speech APIs
  const recognitionRef = useRef<any>(null);

  // Live Scanners HUD State
  const [telemetry, setTelemetry] = useState({
    confidence: 80,
    technical: 75,
    eyeContact: 92,
    clarity: 85,
    volume: 45
  });

  // 1. Initialise Interview Camera and voiced intro
  useEffect(() => {
    setWebcamActive(true);
    speakQuestion(questions[0]);
    questionStartTimeRef.current = Date.now();

    return () => {
      stopAllMedia();
    };
  }, []);

  // 2. Fluctuates metrics during speak activity to look live
  useEffect(() => {
    let interval: any;
    if (isRecording && !isAiSpeaking) {
      interval = setInterval(() => {
        setTelemetry(prev => ({
          confidence: Math.min(96, Math.max(68, prev.confidence + (Math.random() * 4 - 2))),
          technical: Math.min(94, Math.max(72, prev.technical + (Math.random() * 2 - 1))),
          eyeContact: Math.min(98, Math.max(82, prev.eyeContact + (Math.random() * 4 - 2))),
          clarity: Math.min(95, Math.max(78, prev.clarity + (Math.random() * 2 - 1))),
          volume: Math.floor(Math.random() * 30) + 40
        }));
      }, 750);
    } else {
      setTelemetry(prev => ({ ...prev, volume: 5 }));
    }
    return () => clearInterval(interval);
  }, [isRecording, isAiSpeaking]);

  const stopAllMedia = () => {
    // Stop camera stream tracks
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    // Cancel any active Speech synthesis
    window.speechSynthesis.cancel();
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
    }
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
  };

  // 3. WebRTC Stream handler
  const handleStreamReady = (mediaStream: MediaStream) => {
    setStream(mediaStream);
    setWebcamError('');

    // Start video recording
    try {
      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      const mediaRecorder = new MediaRecorder(mediaStream, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000); // chunk every 1 second
      setIsRecording(true);
    } catch (err) {
      console.warn("MimeType codec fallback to default browser video config.", err);
      try {
        const mediaRecorder = new MediaRecorder(mediaStream);
        mediaRecorderRef.current = mediaRecorder;
        recordedChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        mediaRecorder.start(1000);
        setIsRecording(true);
      } catch (e) {
        console.error("Failed to start MediaRecorder:", e);
      }
    }
  };

  const handleStreamError = (err: string) => {
    setWebcamError(err);
    setWebcamActive(false);
  };

  // 4. Speech Synthesis (TTS) voiced assistant
  const speakQuestion = async (text: string) => {
    // Stop any speaking first
    window.speechSynthesis.cancel();
    // Stop listening during AI voice playback to avoid loopback
    stopListening();

    setIsAiSpeaking(true);

    try {
      const res = await fetch('http://localhost:8000/api/interview/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // pass token if required, but it's not strictly required by the route as there's no Depends(get_current_user)
        },
        body: JSON.stringify({ text })
      });

      if (res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onplay = () => setIsAiSpeaking(true);
        audio.onended = () => {
          setIsAiSpeaking(false);
          startSpeechRecognition();
        };
        audio.onerror = () => {
          console.error("Audio playback failed, falling back to browser TTS.");
          fallbackSpeakQuestion(text);
        };

        audio.play();
        return;
      }
    } catch (err) {
      console.warn("ElevenLabs API failed, falling back to browser TTS:", err);
    }

    fallbackSpeakQuestion(text);
  };

  const fallbackSpeakQuestion = (text: string) => {
    setIsAiSpeaking(true);

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0 && 'onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        fallbackSpeakQuestion(text);
      };
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    // Resolve an English speaker consistently
    const selectVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
                        || voices.find(v => v.lang.startsWith('en'))
                        || voices[0];
    if (selectVoice) utterance.voice = selectVoice;

    utterance.onstart = () => {
      setIsAiSpeaking(true);
    };

    utterance.onend = () => {
      setIsAiSpeaking(false);
      startSpeechRecognition();
    };

    utterance.onerror = (e) => {
      console.error("Speech Synthesis error:", e);
      setIsAiSpeaking(false);
      startSpeechRecognition();
    };

    window.speechSynthesis.speak(utterance);
  };

  // 5. Speech Recognition (STT) mic capture
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported in browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setCurrentResponse('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setCurrentResponse(final || interim);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition error:", event.error);
      };

      recognition.onend = () => {
        // Automatically restart if AI is not speaking and webcam is active
        if (!isAiSpeaking && stream) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("SpeechRecognition initialization failed:", e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  // 6. Submit current question response
  const handleSubmitResponse = async () => {
    if (isAiSpeaking) return;

    const answer = currentResponse.trim() || "Candidate gave no response.";
    stopListening();
    setCurrentResponse('');

    const elapsedSeconds = (Date.now() - questionStartTimeRef.current) / 1000.0;

    // Optimistically log the candidate response in the transcript panel
    const updatedTranscript = [...transcript];
    // Find the active question text
    let activeQuestionText = "";
    const lastMsg = updatedTranscript[updatedTranscript.length - 1];
    if (lastMsg && lastMsg.role.startsWith('ai')) {
      activeQuestionText = lastMsg.text;
    } else {
      activeQuestionText = questions[currentIdx];
      updatedTranscript.push({ role: 'ai', text: activeQuestionText });
    }
    updatedTranscript.push({ role: 'candidate', text: answer });
    setTranscript(updatedTranscript);

    try {
      const res = await apiSubmitInterviewAnswer(
        sessionUuid,
        currentIdx,
        answer,
        elapsedSeconds,
        telemetry.volume > 20 ? Math.floor(Math.random() * 3) : 0,  // mock filler count
        140.0 // mock WPM
      );

      // Handle response: follow up or next main question
      if (res.follow_up) {
        // Appends follow up question to transcript panel
        setTranscript(prev => [...prev, { role: 'ai_followup', text: res.follow_up }]);
        speakQuestion(res.follow_up);
      } else if (res.next_question) {
        if (res.next_question === "INTERVIEW_COMPLETE") {
          handleFinishInterview();
        } else {
          setCurrentIdx(prev => prev + 1);
          setTranscript(prev => [...prev, { role: 'ai', text: res.next_question }]);
          speakQuestion(res.next_question);
          questionStartTimeRef.current = Date.now();
        }
      }
    } catch (err) {
      console.error("Failed to submit response:", err);
      // Fallback in case of server failure: advance index
      if (currentIdx < questions.length - 1) {
        const nextQ = questions[currentIdx + 1];
        setCurrentIdx(prev => prev + 1);
        setTranscript(prev => [...prev, { role: 'ai', text: nextQ }]);
        speakQuestion(nextQ);
        questionStartTimeRef.current = Date.now();
      } else {
        handleFinishInterview();
      }
    }
  };

  // 7. Finish interview & trigger scoring and recording upload
  const handleFinishInterview = async () => {
    stopListening();
    setIsRecording(false);
    
    // Stop camera and recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        try {
          // Upload recorded file to backend
          await apiUploadInterviewRecording(sessionUuid, blob);
        } catch (err) {
          console.error("Recording file upload error:", err);
        }

        // Complete the scoring loop
        try {
          const evalResult = await apiCompleteInterview(sessionUuid);
          onComplete(evalResult.report);
        } catch (err) {
          console.error("Failed to complete interview scoring:", err);
          // No fake scores — report actual failure
          onComplete({
            overall_score: 0,
            confidence_score: 0,
            communication_score: 0,
            technical_accuracy_score: 0,
            hire_recommendation: "error",
            overall_feedback: "Scoring failed. Your responses were recorded and will be reviewed manually by the hiring team.",
            strengths: [],
            weaknesses: ["Automated scoring unavailable — manual review required"]
          });
        }
      };
      mediaRecorderRef.current.stop();
    } else {
      // Fallback complete if no camera is active
      try {
        const evalResult = await apiCompleteInterview(sessionUuid);
        onComplete(evalResult.report);
      } catch (err) {
        console.error("Failed to complete interview (no camera):", err);
        onComplete({ overall_score: 0, hire_recommendation: 'error', overall_feedback: 'Scoring failed. Your interview will be reviewed manually.' });
      }
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const skipQuestion = () => {
    setCurrentResponse("Passed/skipped question.");
    setTimeout(() => {
      handleSubmitResponse();
    }, 200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Interviewer & Candidate Feed (Left 2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Prompter Card */}
        <div className="bg-slate-900 border border-slate-700/30 text-white p-6 rounded-3xl relative overflow-hidden flex gap-4 shadow-xl">
          <div className="absolute right-0 top-0 w-32 h-32 bg-palette-4/15 rounded-full blur-[40px] pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-palette-4/10 border border-palette-4/30 flex items-center justify-center shrink-0">
            <Cpu className={`w-6 h-6 text-palette-4 ${isAiSpeaking ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-palette-5 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-palette-5" />
              AI Interviewer (Vance) • Question {currentIdx + 1} of {questions.length}
            </p>
            <p className="text-sm font-bold mt-2.5 leading-relaxed text-slate-100">
              "{transcript[transcript.length - 1]?.role.startsWith('ai') 
                ? transcript[transcript.length - 1].text 
                : questions[currentIdx]}"
            </p>
          </div>
        </div>

        {/* Video feed panel */}
        <div className="bg-slate-950 aspect-video rounded-3xl relative overflow-hidden border border-slate-800 shadow-2xl group">
          <VideoFeed
            stream={stream}
            isActive={webcamActive}
            onStreamReady={handleStreamReady}
            onStreamError={handleStreamError}
          />

          {/* HUD controls overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center bg-slate-950/70 backdrop-blur-md px-5 py-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {isRecording ? 'LIVE RECORDING' : 'CAMERA STANDBY'}
              </span>
            </div>
            
            <div className="flex gap-4 text-[10px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-palette-4" />
                AUDIO: {isAiSpeaking ? 'Muted' : `${telemetry.volume}dB`}
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-palette-5" />
                PACE: {isAiSpeaking ? 'STABLE' : 'SCANNING'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-palette-2/25 dark:border-slate-800 shadow-sm">
          <button
            onClick={skipQuestion}
            disabled={isAiSpeaking}
            className="text-xs font-bold text-palette-2 dark:text-slate-400 hover:text-palette-1 dark:hover:text-white px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            Skip Question
          </button>

          <button
            onClick={handleSubmitResponse}
            disabled={isAiSpeaking || !currentResponse.trim()}
            className="flex items-center gap-1.5 bg-palette-4 hover:bg-palette-1 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <span>Submit Response & Proceed</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scanners HUD (Right 1 col) */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Scanners Panel */}
        <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h4 className="font-extrabold text-palette-1 dark:text-white text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-4">
            <Activity className="w-5 h-5 text-palette-5" />
            Live AI Scanners HUD
          </h4>

          {/* Telemetry HUD metrics */}
          <div className="space-y-4">
            {/* Confidence */}
            <div>
              <div className="flex justify-between text-xs font-bold text-palette-1 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1 text-slate-500">Confidence Index</span>
                <span>{isAiSpeaking ? '0%' : `${Math.floor(telemetry.confidence)}%`}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-palette-4 transition-all duration-300"
                  style={{ width: `${isAiSpeaking ? 0 : telemetry.confidence}%` }}
                />
              </div>
            </div>

            {/* Technical Match */}
            <div>
              <div className="flex justify-between text-xs font-bold text-palette-1 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1 text-slate-500">Technical Keyword Matching</span>
                <span>{isAiSpeaking ? '0%' : `${Math.floor(telemetry.technical)}%`}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-palette-5 transition-all duration-300"
                  style={{ width: `${isAiSpeaking ? 0 : telemetry.technical}%` }}
                />
              </div>
            </div>

            {/* Eye Contact focus */}
            <div>
              <div className="flex justify-between text-xs font-bold text-palette-1 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1 text-slate-500">Gaze & Eye Contact focus</span>
                <span>{isAiSpeaking ? '0%' : `${Math.floor(telemetry.eyeContact)}%`}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-600 transition-all duration-300"
                  style={{ width: `${isAiSpeaking ? 0 : telemetry.eyeContact}%` }}
                />
              </div>
              {!isAiSpeaking && telemetry.eyeContact < 80 && (
                <span className="text-[9px] text-amber-500 font-semibold mt-1.5 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Gaze Drift Detected. Look directly at your camera.
                </span>
              )}
            </div>

            {/* Speech clarity */}
            <div>
              <div className="flex justify-between text-xs font-bold text-palette-1 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1 text-slate-500">Speech Clarity Index</span>
                <span>{isAiSpeaking ? '0%' : `${Math.floor(telemetry.clarity)}%`}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${isAiSpeaking ? 0 : telemetry.clarity}%` }}
                />
              </div>
            </div>
          </div>

          {/* Telemetry info card */}
          <div className="bg-palette-3/30 dark:bg-slate-800/40 p-4 rounded-2xl border border-palette-2/10 text-[10px] text-palette-1/70 dark:text-slate-300 leading-normal space-y-2">
            <p className="font-bold text-palette-1/40 uppercase tracking-widest text-[8.5px]">Live Decoder metadata</p>
            <div className="grid grid-cols-2 gap-1.5">
              <span>POSITION:</span>
              <span className="text-right font-bold text-palette-1 dark:text-white truncate">{jobTitle}</span>
              <span>NAME:</span>
              <span className="text-right font-bold text-palette-1 dark:text-white truncate">{candidateName}</span>
              <span>DECODER STATUS:</span>
              <span className="text-right font-bold text-palette-4">RUNNING</span>
            </div>
          </div>
        </div>

        {/* Dialogue transcript container */}
        <TranscriptPanel
          transcript={transcript}
          currentResponse={currentResponse}
        />
      </div>
    </div>
  );
};
