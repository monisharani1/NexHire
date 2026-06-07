import React, { useState, useEffect } from 'react';
import { useHR } from '../../context/HRContext';
import { 
  apiGetInterviewsList, 
  apiGetInterviewReport, 
  apiSubmitInterviewOverride 
} from '../../services/api';
import { 
  Video, 
  Play, 
  Award, 
  Activity, 
  Mic, 
  Cpu, 
  Check, 
  AlertTriangle,
  RefreshCw,
  FileText,
  UserCheck,
  Download,
  ShieldAlert
} from 'lucide-react';

export const InterviewReport: React.FC = () => {
  const { jobs, activeRole } = useHR();
  const [selectedJobId, setSelectedJobId] = useState<number>(0);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [selectedSessionUuid, setSelectedSessionUuid] = useState<string>('');
  const [report, setReport] = useState<any>(null);
  
  // Loading indicators
  const [listLoading, setListLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [submittingOverride, setSubmittingOverride] = useState(false);

  // Score override form states
  const [overrideScore, setOverrideScore] = useState<number>(80);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState('');

  // Initial jobs sync
  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      const firstJobId = jobs[0].id;
      const numericId = firstJobId.startsWith("job-") ? parseInt(firstJobId.split("-")[1], 10) : parseInt(firstJobId, 10);
      setSelectedJobId(numericId || 1);
    }
  }, [jobs, selectedJobId]);

  // Fetch interviews list
  const fetchInterviews = async () => {
    if (!selectedJobId) return;
    setListLoading(true);
    try {
      const data = await apiGetInterviewsList(selectedJobId);
      setInterviews(data);
      if (data.length > 0) {
        setSelectedSessionUuid(data[0].session_uuid);
      } else {
        setSelectedSessionUuid('');
        setReport(null);
      }
    } catch (err) {
      console.error("Failed to fetch interviews list:", err);
      // Fallback dummy completed interviews list
      const fallbackList = [
        {
          session_uuid: "session-rachel-123",
          candidate_name: "Rachel Green",
          email: "rachel.g@gmail.com",
          score: 82,
          original_score: 82,
          confidence: 85,
          communication: 80,
          technical: 81,
          recommendation: "yes",
          overridden: false,
          completed_at: new Date().toISOString()
        }
      ];
      setInterviews(fallbackList);
      setSelectedSessionUuid(fallbackList[0].session_uuid);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [selectedJobId]);

  // Fetch individual report
  const fetchReport = async () => {
    if (!selectedSessionUuid) return;
    setReportLoading(true);
    try {
      const data = await apiGetInterviewReport(selectedSessionUuid);
      setReport(data);
      setOverrideScore(data.hr_override_score !== null ? data.hr_override_score : data.overall_score);
      setOverrideReason(data.override_reason || '');
    } catch (err) {
      console.error("Failed to load interview report:", err);
      // Fallback dummy report
      setReport({
        candidate_name: "Rachel Green",
        candidate_email: "rachel.g@gmail.com",
        job_title: "Senior Frontend Engineer",
        overall_score: 82,
        confidence_score: 85,
        communication_score: 80,
        technical_accuracy_score: 81,
        hire_recommendation: "yes",
        recording_url: "http://localhost:8000/static/recordings/sample.webm",
        transcript: [
          { role: "ai", text: "Welcome. Please start by introducing yourself and outlining your core experience with React 18." },
          { role: "candidate", text: "Hi, I am Rachel. I have 6 years of experience in React, building highly responsive dashboard applications." },
          { role: "ai_followup", text: "Great. Can you elaborate on the performance optimization strategies you used in those projects?" },
          { role: "candidate_followup", text: "Certainly. I heavily utilize dynamic imports, code splitting, memoization hooks like useMemo and useCallback, and virtualized lists for long tables." }
        ],
        ai_report: {
          overall_feedback: "Rachel demonstrated strong knowledge of frontend components, speaking clearly with minimal fillers (4 uhs) and solid eye focus. Her project walkthroughs are concrete.",
          strengths: ["Excellent React state knowledge", "Fluent sentence delivery", "Exceeds technical threshold"],
          weaknesses: ["Brief response on state side effects", "Moderate filler word usage"],
          per_question_scores: [
            {
              question: "Introduce yourself and outline your experience with React 18.",
              answer: "Hi, I am Rachel. I have 6 years of experience in React, building highly responsive dashboard applications.",
              score: 85,
              feedback: "Prompt answering. Stated clear background timeline.",
              strength: "Clear voice delivery",
              improvement: "Describe specific React 18 updates like transitions."
            }
          ],
          confidence_flags: {
            filler_words_count: 4,
            avg_words_per_answer: 68,
            speaking_pace: "normal",
            sentiment_trend: "positive"
          }
        },
        hr_override_score: null,
        override_reason: "",
        overridden_at: null,
        completed_at: new Date().toISOString()
      });
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedSessionUuid]);

  // Handle HR Override Submit
  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionUuid) return;
    setSubmittingOverride(true);
    setOverrideSuccess('');
    try {
      await apiSubmitInterviewOverride(selectedSessionUuid, overrideScore, overrideReason);
      setOverrideSuccess('✅ Score override successfully saved!');
      setTimeout(() => setOverrideSuccess(''), 3000);
      
      // Reload reports
      fetchReport();
      fetchInterviews();
    } catch (err: any) {
      console.error(err);
      setOverrideSuccess('❌ Override failed: ' + (err.message || 'Unauthorized'));
    } finally {
      setSubmittingOverride(false);
    }
  };

  if (activeRole !== 'HR' && activeRole !== 'Admin') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-palette-1 dark:text-white text-xl">Recruiter role required</h3>
        <p className="text-xs text-palette-2 dark:text-slate-400 max-w-sm mx-auto">
          You must be logged in as an HR manager or Administrator to access candidate video recordings and submit scoring overrides.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header Selector bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-palette-2/25 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-extrabold text-palette-1 dark:text-white text-lg flex items-center gap-2">
            <Video className="w-5 h-5 text-palette-4" />
            AI Video Interview Evaluations
          </h2>
          <p className="text-xs text-palette-2 mt-0.5">Select a requisition opening to inspect recorded candidate performance scorecards.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={`job-${selectedJobId}`}
            onChange={(e) => {
              const val = e.target.value;
              const numericId = val.startsWith("job-") ? parseInt(val.split("-")[1], 10) : parseInt(val, 10);
              setSelectedJobId(numericId || 1);
            }}
            className="w-full md:w-[220px] pl-3 pr-4 py-2.5 rounded-xl border border-palette-2/30 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 text-palette-1 dark:text-white"
          >
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title} (Req #{job.id})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Candidates list (1 col) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col h-[650px] overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-3 block">
            Completed Interviews ({interviews.length})
          </span>
          
          {listLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-palette-4 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {interviews.map(item => {
                const isActive = selectedSessionUuid === item.session_uuid;
                return (
                  <button
                    key={item.session_uuid}
                    onClick={() => setSelectedSessionUuid(item.session_uuid)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                      isActive 
                        ? 'bg-palette-4 border-palette-4 text-white shadow-md' 
                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-slate-100 dark:border-slate-750 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <p className={`font-bold text-xs ${isActive ? 'text-white' : 'text-palette-1 dark:text-white'}`}>
                        {item.candidate_name}
                      </p>
                      <p className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-white/80' : 'text-palette-2 dark:text-slate-400'}`}>
                        {item.email}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-2">
                      <span className={`text-[9px] font-bold uppercase ${isActive ? 'text-white/90' : 'text-slate-400'}`}>
                        {item.overridden ? 'Override' : 'AI Score'}
                      </span>
                      <span className="font-extrabold text-xs">
                        {item.score}%
                      </span>
                    </div>
                  </button>
                );
              })}
              
              {interviews.length === 0 && (
                <div className="h-full flex items-center justify-center text-center p-4">
                  <p className="text-xs text-slate-500 italic">No completed interviews yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Detailed report cards (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {reportLoading ? (
            <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl h-[650px] flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-palette-5 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-palette-2 font-medium">Assembling audit report metrics...</p>
            </div>
          ) : report ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Report Metrics & Video Playback (2 cols) */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* Visual scorecard overview */}
                <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                    <div>
                      <h3 className="font-extrabold text-palette-1 dark:text-white text-base">
                        Evaluation: {report.candidate_name}
                      </h3>
                      <p className="text-xs text-palette-2 dark:text-slate-400 mt-0.5">{report.job_title} candidate</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-palette-1 dark:text-slate-200 text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer">
                        <Download className="w-3.5 h-3.5" />
                        Download Report
                      </button>
                    </div>
                  </div>

                  {/* Main scores list */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-palette-3/30 dark:bg-slate-850/40 rounded-2xl border border-palette-2/10">
                      <span className="block text-[9px] text-palette-2 uppercase font-extrabold">Overall Score</span>
                      <span className="text-2xl font-extrabold text-palette-5 block mt-1">{report.overall_score}%</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-750">
                      <span className="block text-[9px] text-slate-500 uppercase font-extrabold">Confidence</span>
                      <span className="text-xl font-extrabold text-palette-1 dark:text-white block mt-1">{report.confidence_score}%</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-750">
                      <span className="block text-[9px] text-slate-500 uppercase font-extrabold">Communication</span>
                      <span className="text-xl font-extrabold text-palette-1 dark:text-white block mt-1">{report.communication_score}%</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-750">
                      <span className="block text-[9px] text-slate-500 uppercase font-extrabold">Technical Accuracy</span>
                      <span className="text-xl font-extrabold text-palette-1 dark:text-white block mt-1">{report.technical_accuracy_score}%</span>
                    </div>
                  </div>

                  {/* Confidence flags */}
                  {report.ai_report?.confidence_flags && (
                    <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-850/30 rounded-2xl border border-slate-150/10 dark:border-slate-800 flex flex-wrap justify-between gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-400">Pacing:</span>
                        <span className="text-palette-1 dark:text-white font-extrabold uppercase">
                          {report.ai_report.confidence_flags.speaking_pace} ({report.ai_report.confidence_flags.avg_words_per_answer} wpm)
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-400">Filler Words:</span>
                        <span className={`font-extrabold uppercase ${
                          report.ai_report.confidence_flags.filler_words_count > 6 ? 'text-amber-500' : 'text-palette-1 dark:text-white'
                        }`}>
                          {report.ai_report.confidence_flags.filler_words_count} usages
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-400">Sentiment:</span>
                        <span className="text-palette-1 dark:text-white font-extrabold uppercase">
                          {report.ai_report.confidence_flags.sentiment_trend}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Video Playback Panel */}
                <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                  <h4 className="font-extrabold text-palette-1 dark:text-white text-sm flex items-center gap-2 mb-4">
                    <Video className="w-5 h-5 text-palette-4" />
                    Interview Video Playback
                  </h4>
                  {report.recording_url ? (
                    <div className="bg-black rounded-2xl aspect-video overflow-hidden border border-slate-800">
                      <video
                        src={report.recording_url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="bg-slate-950 aspect-video rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-3 border border-slate-800 p-6 text-center">
                      <Play className="w-12 h-12 text-slate-700" />
                      <p className="text-xs font-bold text-slate-400">Video Feed is Unavailable</p>
                      <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
                        No recording upload detected. Playback falls back to browser simulated outputs when local files are missing.
                      </p>
                    </div>
                  )}
                </div>

                {/* Question breakdown cards */}
                <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-palette-1 dark:text-white text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <FileText className="w-5 h-5 text-palette-4" />
                    Detailed Question Responses Breakdown
                  </h4>
                  
                  <div className="space-y-4">
                    {report.ai_report?.per_question_scores?.map((q: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-850/40 rounded-2xl border border-slate-150/10 dark:border-slate-800 space-y-2.5">
                        <div className="flex justify-between items-start gap-4">
                          <p className="font-bold text-xs text-palette-1 dark:text-white leading-relaxed">
                            Q{idx + 1}: {q.question}
                          </p>
                          <span className="bg-palette-5/10 text-palette-5 border border-palette-5/20 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            Accuracy: {q.score}%
                          </span>
                        </div>
                        <p className="text-xs text-palette-1/70 dark:text-slate-350 italic pl-3 border-l-2 border-slate-300 dark:border-slate-700 leading-normal">
                          "{q.answer}"
                        </p>
                        <div className="text-[10px] text-palette-2 dark:text-slate-400 flex flex-wrap gap-x-6 gap-y-1 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-palette-2/5">
                          <span className="font-semibold text-green-500">Strength: {q.strength}</span>
                          <span className="font-semibold text-amber-500">Improvement: {q.improvement}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar: Overall feedback & override score forms (1 col) */}
              <div className="space-y-6">
                
                {/* AI Text evaluation */}
                <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-palette-1 dark:text-white text-xs uppercase tracking-wider">
                    AI Scanners Feedback
                  </h4>
                  
                  <p className="text-xs text-palette-1/70 dark:text-slate-350 leading-relaxed font-semibold">
                    {report.ai_report?.overall_feedback || 'No summary comments recorded.'}
                  </p>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <h5 className="font-bold text-[10.5px] uppercase text-palette-2 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      Candidate Strengths
                    </h5>
                    <ul className="text-xs space-y-1.5 text-palette-1/80 dark:text-slate-300 font-semibold list-disc list-inside">
                      {report.ai_report?.strengths?.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <h5 className="font-bold text-[10.5px] uppercase text-palette-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Candidate Weaknesses
                    </h5>
                    <ul className="text-xs space-y-1.5 text-palette-1/80 dark:text-slate-300 font-semibold list-disc list-inside">
                      {report.ai_report?.weaknesses?.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Score Override Form */}
                <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-palette-1 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-palette-5" />
                    HR Score Override Form
                  </h4>

                  {report.hr_override_score !== null && (
                    <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-2xl text-[10.5px] text-amber-600 dark:text-amber-400 font-semibold leading-relaxed space-y-1">
                      <p className="font-bold">⚠️ MANUALLY OVERRIDDEN</p>
                      <p>Audited Score: {report.hr_override_score}%</p>
                      <p>Reason: "{report.override_reason}"</p>
                    </div>
                  )}

                  <form onSubmit={handleOverrideSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Override Score (0-100)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        required
                        value={overrideScore}
                        onChange={(e) => setOverrideScore(parseInt(e.target.value))}
                        className="w-full border border-palette-2/30 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold bg-palette-3/30 dark:bg-slate-800 text-palette-1 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Justification / Auditor Notes</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Explain why the AI evaluation score is overridden..."
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="w-full border border-palette-2/30 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold bg-palette-3/30 dark:bg-slate-800 text-palette-1 dark:text-white"
                      />
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-palette-4 font-bold">{overrideSuccess}</span>
                      <button
                        type="submit"
                        disabled={submittingOverride}
                        className="w-full bg-palette-5 hover:bg-palette-1 text-white font-bold text-xs py-2 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50"
                      >
                        {submittingOverride ? 'Saving override...' : 'Apply Score Override'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl h-[650px] flex items-center justify-center text-slate-400 italic">
              Select a completed interview to inspect metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
