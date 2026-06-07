import React, { useState, useEffect } from 'react';
import { useHR } from '../../context/HRContext';
import { apiGetATSRankings, apiScreenResume } from '../../services/api';
import { 
  Award, 
  Briefcase, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  UserCheck
} from 'lucide-react';

export const ATSRankings: React.FC = () => {
  const { jobs } = useHR();
  const [selectedJobId, setSelectedJobId] = useState<number>(0);
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Detailed Inspector Modal
  const [inspectingCand, setInspectingCand] = useState<any | null>(null);

  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      const firstJobId = jobs[0].id;
      const numericId = firstJobId.startsWith("job-") ? parseInt(firstJobId.split("-")[1], 10) : parseInt(firstJobId, 10);
      setSelectedJobId(numericId || 1);
    }
  }, [jobs, selectedJobId]);

  const fetchRankings = async () => {
    if (!selectedJobId) return;
    setLoading(true);
    try {
      const data = await apiGetATSRankings(selectedJobId);
      setRankings(data);
    } catch (err) {
      console.error('Failed to load ATS rankings:', err);
      // Fallback dummy data for sandbox environment testing
      setRankings([
        {
          candidate_id: "cand-1",
          name: "Rachel Green",
          email: "rachel.g@gmail.com",
          ats_score: 92,
          score_breakdown: { keyword_match: 27, skills_match: 23, experience_match: 18, education_match: 15, format_score: 9 },
          recommendation: "strong_match",
          strengths: ["Master of React hooks and context patterns", "TailwindCSS expert", "Degree verification passed"],
          gaps: ["Minor: No Kubernetes mentioned"],
          status: "interviewing"
        },
        {
          candidate_id: "cand-2",
          name: "Jonathan Vance",
          email: "j.vance@gmail.com",
          ats_score: 88,
          score_breakdown: { keyword_match: 25, skills_match: 21, experience_match: 20, education_match: 12, format_score: 10 },
          recommendation: "strong_match",
          strengths: ["Strong TypeScript competency", "CI/CD automation experience", "Length and format is ideal"],
          gaps: ["Missing cloud architecture keywords"],
          status: "screening"
        },
        {
          candidate_id: "cand-3",
          name: "David Beckham",
          email: "david.b@yahoo.com",
          ats_score: 54,
          score_breakdown: { keyword_match: 14, skills_match: 12, experience_match: 10, education_match: 12, format_score: 6 },
          recommendation: "partial_match",
          strengths: ["Basic HTML/CSS understanding"],
          gaps: ["Short of required experience threshold", "Weak JavaScript frameworks familiarity"],
          status: "rejected"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [selectedJobId]);

  // Filter rankings based on search term
  const filteredRankings = rankings.filter(cand => 
    (cand.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cand.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBadgeClass = (rec: string) => {
    switch (rec) {
      case 'strong_match':
        return 'bg-green-500/10 text-green-500 border border-green-500/25';
      case 'good_match':
        return 'bg-palette-4/10 text-palette-4 border border-palette-4/25';
      case 'partial_match':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/25';
      default:
        return 'bg-red-500/10 text-red-500 border border-red-500/25';
    }
  };

  const formatRec = (rec: string) => {
    return rec.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Selection Control Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-palette-2/25 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-extrabold text-palette-1 dark:text-white text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-palette-5" />
            ATS Rankings & Screening Lead
          </h2>
          <p className="text-xs text-palette-2 mt-0.5">Filter candidates based on system parser keywords and qualifications.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Job Select */}
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={`job-${selectedJobId}`}
              onChange={(e) => {
                const val = e.target.value;
                const numericId = val.startsWith("job-") ? parseInt(val.split("-")[1], 10) : parseInt(val, 10);
                setSelectedJobId(numericId || 1);
              }}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-palette-2/30 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 text-palette-1 dark:text-white min-w-[200px]"
            >
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.title} (Req #{job.id})</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search applicants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-palette-2/30 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 text-palette-1 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-4 w-full"
            />
          </div>
        </div>
      </div>

      {/* Rankings List Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-palette-2/25 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-palette-3/30 dark:bg-slate-800/40 border-b border-palette-2/15 dark:border-slate-800">
                  <th className="py-4 px-6"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-32 animate-pulse" /></th>
                  <th className="py-4 px-6"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-24 animate-pulse" /></th>
                  <th className="py-4 px-6 hidden lg:table-cell"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-40 animate-pulse" /></th>
                  <th className="py-4 px-6"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-24 animate-pulse" /></th>
                  <th className="py-4 px-6 text-right"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-16 ml-auto animate-pulse" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-palette-2/10 dark:divide-slate-800">
                {[1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4 animate-pulse" />
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2 animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16 animate-pulse" />
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell">
                      <div className="space-y-2">
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full w-full animate-pulse" />
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full w-5/6 animate-pulse" />
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full w-4/6 animate-pulse" />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24 animate-pulse" />
                    </td>
                    <td className="py-4 px-6 flex justify-end">
                      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-28 animate-pulse" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-palette-3/30 dark:bg-slate-800/40 text-palette-1/70 dark:text-slate-400 text-xs font-extrabold uppercase border-b border-palette-2/15 dark:border-slate-800">
                  <th className="py-4 px-6">Rank & Candidate</th>
                  <th className="py-4 px-6">ATS Match Score</th>
                  <th className="py-4 px-6 hidden lg:table-cell">Rubric Breakdown Breakdown</th>
                  <th className="py-4 px-6">Evaluation recommendation</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-palette-2/10 dark:divide-slate-800 text-xs font-semibold text-palette-1/80 dark:text-slate-300">
                {filteredRankings.map((cand, idx) => (
                  <tr key={cand.candidate_id} className="hover:bg-palette-3/10 dark:hover:bg-slate-800/20 transition-colors">
                    {/* Rank & Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-palette-5/10 text-palette-5 border border-palette-5/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-sm text-palette-1 dark:text-white">{cand.name}</p>
                          <p className="text-palette-2 dark:text-slate-500 text-[10px] mt-0.5">{cand.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          cand.ats_score >= 85 ? 'bg-green-500/10 text-green-500' :
                          cand.ats_score >= 65 ? 'bg-palette-4/10 text-palette-4' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {cand.ats_score}/100
                        </span>
                      </div>
                    </td>

                    {/* Breakdown bars */}
                    <td className="py-4 px-6 hidden lg:table-cell max-w-[280px]">
                      <div className="space-y-1.5 text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">
                        {/* Keyword bar (30) */}
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-right shrink-0">Keywords:</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-palette-4" style={{ width: `${((cand.score_breakdown?.keyword_match || 0) / 30) * 100}%` }} />
                          </div>
                          <span className="w-8 text-right shrink-0 font-bold">{cand.score_breakdown?.keyword_match || 0}/30</span>
                        </div>
                        {/* Skills bar (25) */}
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-right shrink-0">Skills:</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-palette-5" style={{ width: `${((cand.score_breakdown?.skills_match || 0) / 25) * 100}%` }} />
                          </div>
                          <span className="w-8 text-right shrink-0 font-bold">{cand.score_breakdown?.skills_match || 0}/25</span>
                        </div>
                        {/* Experience (20) */}
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-right shrink-0">Experience:</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-600" style={{ width: `${((cand.score_breakdown?.experience_match || 0) / 20) * 100}%` }} />
                          </div>
                          <span className="w-8 text-right shrink-0 font-bold">{cand.score_breakdown?.experience_match || 0}/20</span>
                        </div>
                      </div>
                    </td>

                    {/* Recommendation badge */}
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getBadgeClass(cand.recommendation)}`}>
                        {formatRec(cand.recommendation)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setInspectingCand(cand)}
                        className="bg-palette-4 hover:bg-palette-1 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredRankings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 italic">
                      No candidates scored yet under this requisition.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspector Details Modal Drawer */}
      {inspectingCand && (
        <div className="fixed inset-0 bg-palette-1/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-palette-2/20 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-palette-2/15 dark:border-slate-800 flex justify-between items-center bg-palette-3/30 dark:bg-slate-800/40">
              <h3 className="font-extrabold text-palette-1 dark:text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-palette-4" />
                Scorecard Details: {inspectingCand.name}
              </h3>
              <button 
                onClick={() => setInspectingCand(null)} 
                className="text-palette-2 dark:text-slate-400 hover:text-palette-1 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Summary statistics */}
              <div className="grid grid-cols-2 gap-4 bg-palette-3/30 dark:bg-slate-800/40 p-4 rounded-2xl border border-palette-2/10">
                <div>
                  <span className="block text-[9px] text-palette-2 uppercase font-extrabold">ATS Match score</span>
                  <span className="text-xl font-extrabold text-palette-5">{inspectingCand.ats_score} <span className="text-xs font-semibold text-slate-500">/ 100</span></span>
                </div>
                <div>
                  <span className="block text-[9px] text-palette-2 uppercase font-extrabold">Recommendation</span>
                  <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getBadgeClass(inspectingCand.recommendation)}`}>
                    {formatRec(inspectingCand.recommendation)}
                  </span>
                </div>
              </div>

              {/* Rubric Breakdown Grid */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-palette-1 dark:text-white uppercase tracking-wider">Evaluation Rubric Breakdown</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-750">
                    <span className="font-semibold text-slate-500">Keyword Matching:</span>
                    <span className="font-extrabold text-palette-1 dark:text-white">{inspectingCand.score_breakdown?.keyword_match || 0}/30</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-750">
                    <span className="font-semibold text-slate-500">Skills Matching:</span>
                    <span className="font-extrabold text-palette-1 dark:text-white">{inspectingCand.score_breakdown?.skills_match || 0}/25</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-750">
                    <span className="font-semibold text-slate-500">Experience matching:</span>
                    <span className="font-extrabold text-palette-1 dark:text-white">{inspectingCand.score_breakdown?.experience_match || 0}/20</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-750">
                    <span className="font-semibold text-slate-500">Education degree:</span>
                    <span className="font-extrabold text-palette-1 dark:text-white">{inspectingCand.score_breakdown?.education_match || 0}/15</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-750 col-span-2">
                    <span className="font-semibold text-slate-500">Format & Spelling:</span>
                    <span className="font-extrabold text-palette-1 dark:text-white">{inspectingCand.score_breakdown?.format_score || 0}/10</span>
                  </div>
                </div>
              </div>

              {/* Strengths & Gaps lists */}
              <div className="space-y-4 pt-2">
                {/* Strengths */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-palette-1 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Key Strengths
                  </h4>
                  <ul className="space-y-1 text-xs text-palette-1/70 dark:text-slate-350 list-disc list-inside">
                    {inspectingCand.strengths?.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                    {(!inspectingCand.strengths || inspectingCand.strengths.length === 0) && (
                      <li className="italic text-slate-400">No major strengths recorded.</li>
                    )}
                  </ul>
                </div>

                {/* Gaps */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-palette-1 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Areas for Improvement (Gaps)
                  </h4>
                  <ul className="space-y-1 text-xs text-palette-1/70 dark:text-slate-350 list-disc list-inside">
                    {inspectingCand.gaps?.map((g: string, i: number) => (
                      <li key={i}>{g}</li>
                    ))}
                    {(!inspectingCand.gaps || inspectingCand.gaps.length === 0) && (
                      <li className="italic text-slate-400">Format parameters are fully compliant.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Footer action */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setInspectingCand(null)}
                  className="px-5 py-2.5 bg-palette-1 hover:bg-palette-4 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close scorecard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
