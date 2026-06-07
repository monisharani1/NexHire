/**
 * NexHire API Client
 * All calls to the FastAPI backend go through this file.
 * Base URL: http://localhost:8000/api
 */

const BASE_URL = 'http://localhost:8000/api';

// ── Token Storage ─────────────────────────────────────────────

export const getToken = (): string | null =>
  localStorage.getItem('nexhire_access_token');

export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('nexhire_access_token', access);
  localStorage.setItem('nexhire_refresh_token', refresh);
};

export const clearTokens = () => {
  localStorage.removeItem('nexhire_access_token');
  localStorage.removeItem('nexhire_refresh_token');
};

// ── Core Fetch Helper ─────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return null as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────

export const apiLogin = (email: string, password: string) =>
  apiFetch<{ access_token: string; refresh_token: string; role: string }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );

export const apiRegister = (email: string, password: string, full_name: string, role: string) =>
  apiFetch<{ id: number; email: string; role: string }>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify({ email, password, full_name, role }) }
  );

export const apiUpdateProfile = (data: any) =>
  apiFetch<any>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const apiGetMe = () =>
  apiFetch<any>('/auth/me');

export const apiLogout = () =>
  apiFetch('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  }).catch(() => {}); // ignore errors on logout

// ── Employees ─────────────────────────────────────────────────

export const apiGetEmployees = () => apiFetch<any[]>('/employees');

export const apiAddEmployee = (data: any) =>
  apiFetch<any>('/employees', { method: 'POST', body: JSON.stringify(data) });

export const apiUpdateEmployee = (id: string, data: any) =>
  apiFetch<any>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const apiDeleteEmployee = (id: string) =>
  apiFetch<any>(`/employees/${id}`, { method: 'DELETE' });

// ── Teams ─────────────────────────────────────────────────────

export const apiGetTeams = () => apiFetch<any[]>('/teams');

export const apiCreateTeam = (data: any) =>
  apiFetch<any>('/teams', { method: 'POST', body: JSON.stringify(data) });

export const apiUpdateTeam = (id: string, data: any) =>
  apiFetch<any>(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const apiGetTeamUpdates = () => apiFetch<any[]>('/teams/updates');

export const apiAddTeamUpdate = (data: any) =>
  apiFetch<any>('/teams/updates', { method: 'POST', body: JSON.stringify(data) });

// ── Complaints ────────────────────────────────────────────────

export const apiGetComplaints = () => apiFetch<any[]>('/complaints');

export const apiSubmitComplaint = (data: any) =>
  apiFetch<any>('/complaints', { method: 'POST', body: JSON.stringify(data) });

export const apiResolveComplaint = (id: string) =>
  apiFetch<any>(`/complaints/${id}/resolve`, { method: 'POST' });

// ── Leaves ────────────────────────────────────────────────────

export const apiGetLeaves = () => apiFetch<any[]>('/leaves');

export const apiSubmitLeave = (data: any) =>
  apiFetch<any>('/leaves', { method: 'POST', body: JSON.stringify(data) });

export const apiUpdateLeaveStatus = (id: string, status: string) =>
  apiFetch<any>(`/leaves/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

// ── Payroll ───────────────────────────────────────────────────

export const apiGetPayroll = () => apiFetch<any[]>('/payroll');

export const apiUpdatePayroll = (id: string, data: any) =>
  apiFetch<any>(`/payroll/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const apiProcessAllPayroll = () =>
  apiFetch<any>('/payroll/process-all', { method: 'POST' });

// ── Candidates ────────────────────────────────────────────────

export const apiGetCandidates = () => apiFetch<any[]>('/candidates');

export const apiAddCandidate = (data: any) =>
  apiFetch<any>('/candidates', { method: 'POST', body: JSON.stringify(data) });

export const apiUpdateCandidateStage = (id: string, stage: string) =>
  apiFetch<any>(`/candidates/${id}/stage`, {
    method: 'PUT',
    body: JSON.stringify({ stage }),
  });

export const apiUpdateCandidateInterview = (id: string, score: number, metrics: any) =>
  apiFetch<any>(`/candidates/${id}/interview`, {
    method: 'PUT',
    body: JSON.stringify({ score, metrics }),
  });

export const apiScreenResume = async (id: string, file?: File, textContent?: string) => {
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (textContent) formData.append('text_content', textContent);

  const token = getToken();
  const res = await fetch(`${BASE_URL}/candidates/${id}/screen`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || 'Screen failed');
  }
  return res.json();
};

// ── Jobs ──────────────────────────────────────────────────────

export const apiGetJobs = () => apiFetch<any[]>('/jobs');

export const apiCreateJob = (data: any) =>
  apiFetch<any>('/jobs', { method: 'POST', body: JSON.stringify(data) });

export const apiUpdateJob = (id: string, data: any) =>
  apiFetch<any>(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const apiUpdateJobStatus = (id: string, status: string) =>
  apiFetch<any>(`/jobs/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

// ── Settings ──────────────────────────────────────────────────

export const apiGetSettings = () => apiFetch<any>('/settings');

export const apiUpdateSettings = (data: any) =>
  apiFetch<any>('/settings', { method: 'PUT', body: JSON.stringify(data) });

// ── Analytics & Search ────────────────────────────────────────

export const apiGetAnalytics = () => apiFetch<any>('/analytics');

export const apiGlobalSearch = (query: string) => 
  apiFetch<{ users: any[], jobs: any[] }>(`/search?q=${encodeURIComponent(query)}`);

// ── Social Profiles & Google Login ───────────────────────────

export const apiGoogleLogin = (firebase_token: string) =>
  apiFetch<{ access_token: string; refresh_token: string; role: string }>(
    '/auth/social/google',
    { method: 'POST', body: JSON.stringify({ firebase_token }) }
  );

export const apiConnectSocial = (platform: string, username: string) =>
  apiFetch<any>('/social/connect', {
    method: 'POST',
    body: JSON.stringify({ platform, username }),
  });

export const apiGetSocialPortfolio = (id: string) =>
  apiFetch<any>(`/social/portfolio/${id}`);

export const apiSyncSocial = (platform: string) =>
  apiFetch<any>(`/social/sync/${platform}`);

export const apiDisconnectSocial = (platform: string) =>
  apiFetch<any>(`/social/${platform}`, { method: 'DELETE' });

// ── ATS Rankings & Results ─────────────────────────────────────

export const apiGetATSRankings = (jobId: number) =>
  apiFetch<any[]>(`/ats/rankings/${jobId}`);

export const apiBulkScreenResumes = (jobId: number, resumeTexts: string[]) =>
  apiFetch<any[]>('/ats/bulk-screen', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId, resume_texts: resumeTexts })
  });

export const apiGetCandidateATSResults = (candidateId: string) =>
  apiFetch<any[]>(`/ats/results/${candidateId}`);

// ── AI Video Interview Sessions ────────────────────────────────

export const apiCreateInterview = (candidateId: string | number, jobId: number) =>
  apiFetch<any>('/interview/create', {
    method: 'POST',
    body: JSON.stringify({ candidate_id: candidateId, job_id: jobId })
  });

export const apiSubmitAudio = async (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.webm');

  const token = getToken();
  try {
    const res = await fetch(`${BASE_URL}/interview/audio`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      let errText = await res.text();
      throw new Error(`Audio processing failed on backend: ${errText}`);
    }
    const data = await res.json();
    if (!data.text) {
      throw new Error('No transcription returned from API. Please speak louder or check your mic.');
    }
    return data;
  } catch (err) {
    console.warn('Network error during audio STT', err);
    throw err;
  }
};

export const apiGetInterviewSession = (sessionUuid: string) =>
  apiFetch<any>(`/interview/session/${sessionUuid}`);

export const apiSubmitInterviewAnswer = async (
  sessionUuid: string,
  questionIndex: number,
  answerText: string,
  duration?: number,
  fillerCount?: number,
  wpm?: number
) => {
  try {
    return await apiFetch<any>('/interview/answer', {
      method: 'POST',
      body: JSON.stringify({
        session_uuid: sessionUuid,
        question_index: questionIndex,
        answer_text: answerText,
        duration,
        filler_count: fillerCount,
        wpm,
      }),
    });
  } catch (err) {
    console.warn("Backend AI answer processing failed, falling back to mock", err);
    return {
      next_question: null,
      follow_up: "That's an interesting point. Can you elaborate further on how you applied that in a team project?"
    };
  }
};

export const apiCompleteInterview = (sessionUuid: string) =>
  apiFetch<any>('/interview/complete', {
    method: 'POST',
    body: JSON.stringify({ session_uuid: sessionUuid })
  });

export const apiUploadInterviewRecording = async (sessionUuid: string, videoBlob: Blob) => {
  const formData = new FormData();
  formData.append('video', videoBlob, 'recording.webm');
  formData.append('session_id', sessionUuid);

  const token = getToken();
  const res = await fetch(`${BASE_URL}/interview/upload-recording`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Recording upload failed');
  return res.json();
};

export const apiGetInterviewReport = (sessionUuid: string) =>
  apiFetch<any>(`/interview/report/${sessionUuid}`);

export const apiSubmitInterviewOverride = (sessionUuid: string, hrScore: number, reason: string) =>
  apiFetch<any>(`/interview/override/${sessionUuid}`, {
    method: 'PUT',
    body: JSON.stringify({ hr_score: hrScore, reason })
  });

export const apiGetInterviewsList = (jobId: number) =>
  apiFetch<any[]>(`/interview/list/${jobId}`);

