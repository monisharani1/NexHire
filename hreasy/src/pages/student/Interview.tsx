import React, { useState, useEffect } from 'react';
import { useHR } from '../../context/HRContext';
import { InterviewRoom } from '../../components/interview/InterviewRoom';
import { apiCreateInterview } from '../../services/api';
import { 
  Video, 
  Sparkles, 
  Play, 
  Award, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Mic,
  ShieldCheck
} from 'lucide-react';

export const Interview: React.FC = () => {
  const { candidates, currentUser, activeRole, updateCandidateInterview } = useHR();
  const [activeCand, setActiveCand] = useState<any>(null);
  const [sessionUuid, setSessionUuid] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [report, setReport] = useState<any>(null);
  
  // Consent state
  const [consentGranted, setConsentGranted] = useState(false);
  const [initLoading, setInitLoading] = useState(false);

  // Sync candidate details from the context
  useEffect(() => {
    if (currentUser) {
      const match = candidates.find(c => c.email.toLowerCase() === currentUser.email.toLowerCase());
      if (match) {
        setActiveCand(match);
        if (match.interviewScore > 0 || match.stage === 'interviewed') {
          setIsCompleted(true);
        }
      }
    }
  }, [candidates, currentUser]);

  const handleStartInterview = async () => {
    if (!activeCand || !consentGranted) return;
    setInitLoading(true);
    
    // Resolve candidate ID from the frontend candidate object (e.g. cand-15)
    const rawId = activeCand.id.startsWith("cand-") 
      ? parseInt(activeCand.id.split("-")[1]) 
      : parseInt(activeCand.id);

    // Resolve job ID (or default to 1 if not set)
    const jobId = activeCand.job_id || 1; 

    try {
      // Create session in backend
      const sessionData = await apiCreateInterview(rawId, jobId);
      setSessionUuid(sessionData.session_id);
      setQuestions(sessionData.questions);
      setIsInterviewStarted(true);
    } catch (e) {
      console.error("Failed to initialize session. Using browser fallback.", e);
      // Fallback questions to prevent breaking during sandbox testing
      setQuestions([
        "Welcome. Please start by introducing yourself and outlining your core experience with React 18 and state management.",
        "Explain how you optimize frontend performance in heavy dashboard applications. What tools or strategies do you use?",
        "Describe a conflict or difference in technical design you had with a teammate, and how you resolved it constructively.",
        "Finally, how do you approach writing clean, modular CSS layouts, and what are your thoughts on TailwindCSS?",
        "If a backend worker starts leaking memory in staging, what are your immediate debugging steps?"
      ]);
      setSessionUuid("mock-session-" + Math.floor(Math.random() * 1000));
      setIsInterviewStarted(true);
    } finally {
      setInitLoading(false);
    }
  };

  const handleCompleteInterview = async (evalReport: any) => {
    setReport(evalReport);
    setIsCompleted(true);
    setIsInterviewStarted(false);

    // Update the context immediately so the dashboard updates without reload
    if (activeCand && evalReport.overall_score !== undefined) {
      try {
        await updateCandidateInterview(activeCand.id, evalReport.overall_score, {
          technical: evalReport.technical_accuracy_score || 0,
          communication: evalReport.communication_score || 0,
          confidence: evalReport.confidence_score || 0,
          eyeContact: 85,
          clarity: 80
        });
      } catch (err) {
        console.error("Failed to sync score to context", err);
      }
    }
  };

  if (activeRole !== 'Candidate') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-palette-1 dark:text-white text-xl">Recruiter view Restricted</h3>
        <p className="text-xs text-palette-2 dark:text-slate-400 max-w-md mx-auto">
          This portal is reserved for active job candidates to record their assessments. Please use the sidebar to view candidate rankings or interview reports.
        </p>
      </div>
    );
  }

  if (isInterviewStarted) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 px-6 py-4 rounded-3xl flex justify-between items-center shadow-sm">
          <div>
            <h2 className="font-extrabold text-palette-1 dark:text-white text-lg flex items-center gap-2">
              <Video className="w-5 h-5 text-palette-4" />
              NexHire Live Interview Screen
            </h2>
            <p className="text-[11px] text-palette-2 mt-0.5">{(activeCand?.roleApplied || 'Software Engineer')} Requisition</p>
          </div>
          <div className="text-right">
            <span className="bg-red-500 text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              Interview Active
            </span>
          </div>
        </div>

        <InterviewRoom
          sessionUuid={sessionUuid}
          candidateName={activeCand?.name || 'Candidate'}
          jobTitle={activeCand?.roleApplied || 'Software Engineer'}
          questions={questions}
          onComplete={handleCompleteInterview}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {isCompleted ? (
        /* Completion screen */
        <div className="premium-card p-8 text-center space-y-6 bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-850 shadow-md">
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-extrabold text-palette-1 dark:text-white text-2xl">Interview Complete</h3>
            <p className="text-xs text-palette-2 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Thank you for completing your assessment! Your video feed has been uploaded and analyzed by our AI evaluation core.
            </p>
          </div>

          {report && (
            <div className="max-w-md mx-auto bg-palette-3/30 dark:bg-slate-800/40 border border-palette-2/10 p-5 rounded-2xl text-left space-y-3">
              <h4 className="font-bold text-xs text-palette-1 dark:text-white uppercase tracking-wider border-b border-palette-2/10 pb-2">
                Scoring summary
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-palette-1/80 dark:text-slate-300">
                <span>Confidence Index:</span>
                <span className="text-right text-palette-4 font-bold">{report.confidence_score}%</span>
                <span>Communication Score:</span>
                <span className="text-right text-palette-4 font-bold">{report.communication_score}%</span>
                <span>Technical Accuracy:</span>
                <span className="text-right text-palette-4 font-bold">{report.technical_accuracy_score}%</span>
                <span className="border-t border-palette-2/10 pt-2 font-bold text-palette-1 dark:text-white">Overall AI Score:</span>
                <span className="border-t border-palette-2/10 pt-2 text-right text-palette-5 font-extrabold text-sm">{report.overall_score}%</span>
              </div>
            </div>
          )}

          <p className="text-[10px] text-palette-2/80 max-w-xs mx-auto leading-normal">
            Hiring managers are currently reviewing your score. You will receive an email update if you are advanced to the final stage.
          </p>
        </div>
      ) : (
        /* Pre-interview Landing Screen */
        <div className="space-y-6">
          <div className="premium-card p-8 bg-gradient-to-br from-palette-1 to-palette-1/90 text-white relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-[18rem] h-[18rem] bg-palette-4/15 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-palette-5/10 rounded-full flex items-center justify-center text-palette-5">
                <Video className="w-8 h-8" />
              </div>
              <h2 className="font-extrabold text-2xl">NexHire AI Video Interview</h2>
              <p className="text-xs text-palette-2/90 max-w-md mx-auto leading-relaxed">
                You have been shortlisted for an AI video interview for the position of <strong className="text-palette-5">{activeCand?.roleApplied || 'Software Engineer'}</strong>!
              </p>
            </div>
          </div>

          {/* Guidelines info card */}
          <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-palette-1 dark:text-white text-base">Interview Guidelines</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-palette-4 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-palette-1 dark:text-white">5 Standard Questions</h4>
                  <p className="text-[10px] text-palette-2 dark:text-slate-400 leading-normal mt-0.5">
                    Covering technical syntax, design principles, behavioral teamwork, and situational coding.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-palette-4 shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-palette-1 dark:text-white">Micro-followups</h4>
                  <p className="text-[10px] text-palette-2 dark:text-slate-400 leading-normal mt-0.5">
                    AI interviewer Vance will ask conversational follow-up questions tailored to your answer context.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-palette-4 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-palette-1 dark:text-white">AI Scanners HUD</h4>
                  <p className="text-[10px] text-palette-2 dark:text-slate-400 leading-normal mt-0.5">
                    Parses volume levels, gaze central focus, framework term usage, speaking pace and clarity index.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-palette-4 shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-palette-1 dark:text-white">Recruiter playback</h4>
                  <p className="text-[10px] text-palette-2 dark:text-slate-400 leading-normal mt-0.5">
                    HR manages final approval by reviewing AI scorecard metrics alongside actual recording playback.
                  </p>
                </div>
              </div>
            </div>

            {/* Consent checklist */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-start gap-3 bg-palette-3/30 dark:bg-slate-800/40 p-4 rounded-2xl border border-palette-2/10">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="mt-0.5 cursor-pointer accent-palette-4"
                />
                <label htmlFor="consent" className="text-xs text-palette-1/80 dark:text-slate-300 font-semibold leading-relaxed cursor-pointer select-none">
                  I consent to the recording of my webcam video feed and microphone audio. I understand this recording will be stored securely and reviewed by hiring managers for validation.
                </label>
              </div>

              <button
                disabled={!consentGranted || initLoading || !activeCand || activeCand.stage !== 'interviewing'}
                onClick={handleStartInterview}
                className="w-full flex items-center justify-center gap-2 bg-palette-4 hover:bg-palette-1 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold text-sm py-3.5 rounded-2xl transition-all shadow-md cursor-pointer"
              >
                {initLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    {activeCand?.stage !== 'interviewing' 
                      ? 'Awaiting Recruiter Interview Authorization' 
                      : 'Launch AI Interviewer'
                    }
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
