import React, { useState, useRef, useEffect } from 'react';
import { useHR } from '../context/HRContext';

import { 
  Video, 
  VideoOff, 
  Sparkles, 
  Play, 
  Award,
  ArrowRight,
  Volume2,
  Eye,
  Activity,
  Mic,
  Cpu
} from 'lucide-react';

export const AIInterview: React.FC = () => {
  const { candidates, updateCandidateInterview, activeRole, currentUser } = useHR();
  const [activeCandId, setActiveCandId] = useState('');
  const [isInterviewRunning, setIsInterviewRunning] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  
  // Webcam states
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Real-time telemetry indicators (animated)
  const [telemetry, setTelemetry] = useState({
    confidence: 75,
    technical: 80,
    eyeContact: 90,
    clarity: 85,
    volume: 50
  });

  const interviewCandidates = candidates.filter(c => c.stage === 'interviewing');

  const questions = [
    "Welcome. Please start by introducing yourself and outlining your core experience with React 18 and state management.",
    "Explain how you optimize frontend performance in heavy dashboard applications. What tools or strategies do you use?",
    "Describe a conflict or difference in technical design you had with a teammate, and how you resolved it constructively.",
    "Finally, how do you approach writing clean, modular CSS layouts, and what are your thoughts on TailwindCSS?"
  ];

  // Fluctuates telemetry slightly during interview to look naturally 'alive' without random jumps
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setTelemetry(prev => ({
          confidence: Math.min(95, Math.max(70, prev.confidence + (Math.random() * 4 - 2))),
          technical: Math.min(95, Math.max(75, prev.technical + (Math.random() * 2 - 1))),
          eyeContact: Math.min(98, Math.max(80, prev.eyeContact + (Math.random() * 4 - 2))),
          clarity: Math.min(95, Math.max(75, prev.clarity + (Math.random() * 2 - 1))),
          volume: Math.floor(Math.random() * 20) + 45
        }));
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setWebcamActive(true);
      }
    } catch (err) {
      console.warn("Webcam access not available or denied, simulating feed.", err);
      setWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    setWebcamActive(false);
  };

  const handleStartInterview = () => {
    if (!activeCandId) return;
    setIsInterviewRunning(true);
    setCurrentQuestionIdx(0);
    startWebcam();
  };

  const handleToggleRecord = () => {
    setIsRecording(!isRecording);
  };

  const handleNextQuestion = () => {
    setIsRecording(false);
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      // End of interview - save scores to state
      const finalScore = Math.floor(
        (telemetry.technical * 0.4) + 
        (telemetry.confidence * 0.2) + 
        (telemetry.eyeContact * 0.2) + 
        (telemetry.clarity * 0.2)
      );
      
      updateCandidateInterview(activeCandId, finalScore, {
        technical: Math.floor(telemetry.technical),
        communication: Math.floor((telemetry.confidence + telemetry.clarity) / 2),
        confidence: Math.floor(telemetry.confidence),
        eyeContact: Math.floor(telemetry.eyeContact),
        clarity: Math.floor(telemetry.clarity)
      });

      stopWebcam();
      setIsInterviewRunning(false);
      alert(`Interview completed successfully! Candidate Score: ${finalScore}%`);
    }
  };

  useEffect(() => {
    if (activeRole === 'Candidate' && currentUser) {
      const selfCand = candidates.find(c => c.email === currentUser.email);
      if (selfCand) {
        setActiveCandId(selfCand.id);
      }
    } else if (interviewCandidates.length > 0 && !activeCandId) {
      setActiveCandId(interviewCandidates[0].id);
    }
  }, [candidates, activeRole, currentUser, interviewCandidates, activeCandId]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  const activeCand = candidates.find(c => c.id === activeCandId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {!isInterviewRunning ? (
        /* Setup / Pre-interview screen */
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="premium-card p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-palette-5/10 rounded-full flex items-center justify-center mx-auto text-palette-5">
              <Video className="w-8 h-8" />
            </div>
            
            <h3 className="font-extrabold text-palette-1 text-2xl">AI Interview Portal</h3>
            <p className="text-xs text-palette-2 max-w-md mx-auto leading-relaxed">
              Launch standardized screening loops. This interface streams video inputs and parses speech pace, eye focus, confidence indices, and core competency mappings.
            </p>

            <div className="pt-6 border-t border-palette-2/15 space-y-4 max-w-sm mx-auto">
              {activeRole === 'Candidate' ? (
                <div className="text-center font-bold text-palette-1 dark:text-slate-200 py-2.5 text-xs bg-palette-3/30 dark:bg-slate-800/40 rounded-xl border border-palette-2/10">
                  Ready to start interview for: <span className="text-palette-4">{activeCand?.name}</span>
                </div>
              ) : (
                <div className="text-left">
                  <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-2">Select Candidate for Interview</label>
                  <select
                    value={activeCandId}
                    onChange={(e) => setActiveCandId(e.target.value)}
                    className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm bg-white font-semibold text-palette-1"
                  >
                    <option value="">-- Choose Candidate --</option>
                    {interviewCandidates.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.roleApplied})</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                disabled={!activeCandId}
                onClick={handleStartInterview}
                className="w-full flex items-center justify-center gap-2 bg-palette-4 hover:bg-palette-1 disabled:bg-palette-2 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md"
              >
                <Play className="w-4 h-4 fill-white" />
                Initialize AI Interviewer
              </button>
            </div>
          </div>

          {/* Interview Leaderboard / Previous Scores */}
          <div className="bg-white rounded-2xl border border-palette-2/20 shadow-sm p-6">
            <h4 className="font-extrabold text-palette-1 text-base mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-palette-5" />
              Interview Results Leaderboard
            </h4>
            <div className="space-y-3">
              {candidates.filter(c => c.interviewScore > 0).map(c => (
                <div key={c.id} className="flex justify-between items-center bg-palette-3/30 p-3 rounded-xl border border-palette-2/10">
                  <div>
                    <p className="text-xs font-bold text-palette-1">{c.name}</p>
                    <p className="text-[10px] text-palette-2 mt-0.5">{c.roleApplied}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.videoMetrics && (
                      <div className="hidden sm:flex gap-1.5 text-[8.5px] font-bold text-palette-1/60">
                        <span>TECH: {c.videoMetrics.technical}%</span>
                        <span>COMM: {c.videoMetrics.communication}%</span>
                        <span>EYE: {c.videoMetrics.eyeContact}%</span>
                      </div>
                    )}
                    <span className="bg-palette-4 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {c.interviewScore}% Score
                    </span>
                  </div>
                </div>
              ))}
              {candidates.filter(c => c.interviewScore > 0).length === 0 && (
                <p className="text-xs text-palette-2 text-center py-4">No completed interviews yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Live Interview Arena */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Interviewer AI & Candidate Stream (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Prompter Card */}
            <div className="bg-palette-1 text-white p-6 rounded-2xl border border-palette-2/10 shadow-lg relative overflow-hidden flex gap-4">
              <div className="absolute right-0 top-0 w-24 h-24 bg-palette-5/10 rounded-full blur-xl" />
              <div className="w-12 h-12 rounded-full bg-palette-4/20 border border-palette-4 flex items-center justify-center shrink-0">
                <Cpu className="w-6 h-6 text-palette-4 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-palette-5 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-palette-5" />
                  AI Interviewer (Vance) • Question {currentQuestionIdx + 1}/{questions.length}
                </p>
                <p className="text-sm font-bold mt-1.5 leading-relaxed">
                  "{questions[currentQuestionIdx]}"
                </p>
              </div>
            </div>

            {/* Candidate Live Stream Panel */}
            <div className="bg-black rounded-2xl aspect-video relative overflow-hidden shadow-2xl border border-palette-2/20 group">
              {webcamActive ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover scale-x-[-1]" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-palette-2 gap-3 bg-palette-1/95">
                  <VideoOff className="w-10 h-10 text-palette-5" />
                  <p className="text-xs font-bold text-white">Camera active (simulated stream)</p>
                  <p className="text-[10px] text-palette-2 text-center max-w-xs leading-relaxed">
                    A virtual candidate avatar is answering. Live telemetry metrics are parsing audio frequencies.
                  </p>
                </div>
              )}

              {/* Live Overlay HUD metrics */}
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">
                    {isRecording ? 'Record Active' : 'Feed Ready'}
                  </span>
                </div>
                
                <div className="flex gap-4 text-[10px] font-bold text-white/80">
                  <div className="flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5 text-palette-4" />
                    <span>AUDIO: {telemetry.volume}dB</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-palette-5" />
                    <span>PITCH: STABLE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Stream Controls */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-palette-2/20">
              <button
                onClick={handleToggleRecord}
                className={`flex items-center gap-1.5 font-bold text-xs px-5 py-2.5 rounded-xl transition-all ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-md' 
                    : 'bg-palette-3 text-palette-1 hover:bg-palette-2'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-red-500'}`} />
                {isRecording ? 'Pause Recording' : 'Start Answer Record'}
              </button>

              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-1.5 bg-palette-4 hover:bg-palette-1 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm"
              >
                <span>{currentQuestionIdx === questions.length - 1 ? 'Finish Interview' : 'Submit & Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Live AI Scanning Telemetry HUD */}
          <div className="lg:col-span-1 space-y-6">
            <div className="premium-card p-6 space-y-6">
              <h4 className="font-extrabold text-palette-1 text-base flex items-center gap-2 border-b border-palette-2/15 pb-4">
                <Cpu className="w-5 h-5 text-palette-5" />
                Live AI Scanner HUD
              </h4>

              {/* Progress bars telemetry */}
              <div className="space-y-4">
                {/* Confidence */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-palette-1 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-palette-4" />
                      Confidence Level
                    </span>
                    <span>{Math.floor(telemetry.confidence)}%</span>
                  </div>
                  <div className="w-full bg-palette-3 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-palette-4 transition-all duration-300"
                      style={{ width: `${telemetry.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Technical Match */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-palette-1 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-palette-5" />
                      Technical Accuracy
                    </span>
                    <span>{Math.floor(telemetry.technical)}%</span>
                  </div>
                  <div className="w-full bg-palette-3 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-palette-5 transition-all duration-300"
                      style={{ width: `${telemetry.technical}%` }}
                    />
                  </div>
                </div>

                {/* Eye Contact focus */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-palette-1 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-teal-600" />
                      Eye Contact Tracking
                    </span>
                    <span>{Math.floor(telemetry.eyeContact)}%</span>
                  </div>
                  <div className="w-full bg-palette-3 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-600 transition-all duration-300"
                      style={{ width: `${telemetry.eyeContact}%` }}
                    />
                  </div>
                  {telemetry.eyeContact < 60 && (
                    <span className="text-[9px] text-red-500 font-semibold mt-1 block animate-pulse">
                      *AI Warning: Gaze drifting. Encouraging central eye alignment.
                    </span>
                  )}
                </div>

                {/* Speech clarity */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-palette-1 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Mic className="w-3.5 h-3.5 text-indigo-500" />
                      Speech Clarity Index
                    </span>
                    <span>{Math.floor(telemetry.clarity)}%</span>
                  </div>
                  <div className="w-full bg-palette-3 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${telemetry.clarity}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status information panel */}
              <div className="bg-palette-3/50 p-4 rounded-xl border border-palette-2/20 text-[10px] space-y-2">
                <p className="font-bold text-palette-1/70 uppercase">Telemetry Metadata</p>
                <div className="grid grid-cols-2 gap-2 text-palette-1/80 font-semibold">
                  <div>CANDIDATE:</div>
                  <div className="text-right text-palette-1">{activeCand?.name}</div>
                  <div>POSITION:</div>
                  <div className="text-right text-palette-1 truncate">{activeCand?.roleApplied}</div>
                  <div>DECODER STAGE:</div>
                  <div className="text-right text-palette-4">NLP_V3_ACTIVE</div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};
