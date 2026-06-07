"""
AI Service — wraps Google Gemini / Claude Anthropic API for intelligent HR features.
Gracefully falls back to keyword-based heuristics if no API key is set.
"""
import json
import re
from app.core.config import settings

# Initialize Groq client
groq_client = None

if settings.GROQ_API_KEY:
    try:
        from groq import Groq  # type: ignore
        groq_client = Groq(api_key=settings.GROQ_API_KEY)
        print("⚡ AI Service: Groq successfully initialized!")
    except ImportError:
        print("⚠️ groq package not installed for AI")

ai_available = groq_client is not None or bool(getattr(settings, "OPENROUTER_API_KEY", None))

def _call_ai(prompt: str, max_tokens: int = 500) -> str:
    """Unified AI call via Groq Llama 3 with OpenRouter fallback."""
    messages = [{"role": "user", "content": prompt}]
    
    if groq_client:
        try:
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"⚠️ Groq API failed in AI Service: {e}. Falling back to OpenRouter...")
            
    # OpenRouter Fallback
    if getattr(settings, "OPENROUTER_API_KEY", None):
        import httpx
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:8000"
        }
        payload = {
            "model": "meta-llama/llama-3.3-70b-instruct:free",
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7
        }
        with httpx.Client(timeout=30.0) as client:
            res = client.post(url, headers=headers, json=payload)
            if res.status_code == 200:
                return res.json()["choices"][0]["message"]["content"].strip()
            else:
                print(f"⚠️ OpenRouter API failed: {res.status_code} - {res.text}")

    raise RuntimeError("No AI provider configured. Please set GROQ_API_KEY or OPENROUTER_API_KEY.")


def analyze_sentiment(text: str) -> str:
    """Analyze the sentiment of a given text. Returns 'positive', 'neutral', or 'negative'."""
    prompt = f"Analyze the sentiment of the following text. Return ONLY ONE WORD: 'positive', 'neutral', or 'negative'. Text: {text}"
    try:
        raw = _call_ai(prompt, max_tokens=10).lower()
        if "positive" in raw: return "positive"
        if "negative" in raw: return "negative"
    except Exception:
        pass
    return "neutral"

def _parse_json(raw: str) -> dict:
    """Extract JSON from AI response, stripping markdown fences if present."""
    text = raw.strip()
    if text.startswith("```json"):
        text = text.split("```json")[1].split("```")[0].strip()
    elif text.startswith("```"):
        text = text.split("```")[1].split("```")[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Could not parse JSON from AI response")


# ── Resume Screening ──────────────────────────────────────────

def screen_resume(resume_text: str, job_description: str) -> dict:
    """
    Score a resume against a job description.
    Returns: score, strengths, gaps, recommendation
    """
    if ai_available:
        try:
            return _screen_resume_ai(resume_text, job_description)
        except Exception as e:
            print(f"⚠️ AI resume screening failed: {e}. Falling back to heuristics.")
    return _screen_resume_heuristic(resume_text, job_description)


def _screen_resume_ai(resume_text: str, job_description: str) -> dict:
    prompt = f"""
You are an expert HR recruiter. Analyze this resume against the job description.

CRITICAL INSTRUCTION: First, determine if the provided text is actually a resume/CV. If it appears to be a project document, master document, article, code, or general gibberish instead of a personal resume, you MUST score it 0 and set the recommendation to 'reject'. Do not be fooled by keyword matching if the document structure is not a personal resume. Evaluate the candidate's actual listed skills, experience, and education fairly.

JOB DESCRIPTION:
{job_description}

RESUME:
{resume_text}

Return ONLY valid JSON (no markdown, no extra text):
{{
  "score": <integer 0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "gaps": ["gap1", "gap2"],
  "recommendation": "<hire|maybe|reject>"
}}

Scoring guide:
- 70-100: Strong match → hire
- 50-69:  Partial match → maybe
- 0-49:   Weak match   → reject
"""
    raw = _call_ai(prompt)
    return _parse_json(raw)


def _screen_resume_heuristic(resume_text: str, job_description: str) -> dict:
    """Keyword-based offline fallback for resume scoring."""
    txt = resume_text.lower()
    score = 55
    strengths = []
    gaps = []

    if "react" in txt or "frontend" in txt:
        score += 8; strengths.append("React/Frontend development experience")
    if "typescript" in txt:
        score += 6; strengths.append("TypeScript proficiency")
    if "python" in txt or "fastapi" in txt or "django" in txt:
        score += 6; strengths.append("Python backend experience")
    if "sql" in txt or "database" in txt or "postgres" in txt:
        score += 5; strengths.append("Database knowledge")
    if "leadership" in txt or "lead" in txt or "senior" in txt:
        score += 5; strengths.append("Leadership experience")
    if "git" in txt or "ci/cd" in txt:
        score += 3; strengths.append("Version control & DevOps")
    if "aws" not in txt and "cloud" not in txt:
        gaps.append("No cloud infrastructure experience mentioned")
    if not strengths:
        strengths.append("General software development background")

    score = min(score, 99)
    recommendation = "hire" if score >= 70 else ("maybe" if score >= 50 else "reject")
    return {"score": score, "strengths": strengths, "gaps": gaps, "recommendation": recommendation}


# ── Chatbot ───────────────────────────────────────────────────

def get_chatbot_response(message: str, conversation_history: list, candidate_info: dict) -> str:
    """Generate context-aware chatbot response for candidate screening."""
    if ai_available:
        try:
            return _chatbot_ai(message, conversation_history, candidate_info)
        except Exception as e:
            print(f"⚠️ AI chatbot failed: {e}")
    return _chatbot_heuristic(message, conversation_history)


def _chatbot_ai(message: str, conversation_history: list, candidate_info: dict) -> str:
    context = "\n".join([
        f"{msg['role'].upper()}: {msg['message']}"
        for msg in conversation_history[-5:]
    ])
    prompt = f"""
You are a professional HR screening assistant for NexHire.
You are interviewing a candidate for a position.

Candidate info:
- Name: {candidate_info.get('name', 'Candidate')}
- Applied for: {candidate_info.get('job_title', 'Software Engineer')}

Previous conversation:
{context if context else "This is the start of the interview."}

Candidate's latest message: "{message}"

Your task:
- Ask ONE relevant follow-up question based on their response
- Be professional, friendly, and concise
- Keep response under 100 words
- Focus on technical skills, experience, problem-solving ability
"""
    return _call_ai(prompt, max_tokens=200)


def _chatbot_heuristic(message: str, conversation_history: list) -> str:
    """Rule-based fallback interview questions."""
    count = len(conversation_history)
    questions = [
        "Great! Can you walk me through your most recent project and what technologies you used?",
        "Interesting! How do you typically approach debugging a complex issue in production?",
        "That's helpful. Can you describe a time you had to learn a new technology quickly for a project?",
        "Good experience! How do you handle code reviews and feedback from peers?",
        "Thank you for sharing. What are your thoughts on test-driven development?",
        "Excellent! Where do you see yourself professionally in the next 2–3 years?",
        "Great answers so far! Is there anything specific about this role or our company you'd like to know more about?",
    ]
    return questions[min(count, len(questions) - 1)]


# ── Sentiment Analysis ────────────────────────────────────────

def analyze_sentiment(text: str) -> str:
    """Keyword-based sentiment analysis. Returns: positive, neutral, negative."""
    positive_words = [
        "great", "excellent", "love", "enjoy", "excited", "happy",
        "passionate", "strong", "confident", "definitely", "absolutely",
        "experience", "built", "led", "achieved", "delivered", "improved"
    ]
    negative_words = [
        "difficult", "struggle", "hard", "never", "cannot", "failed",
        "unsure", "worried", "problem", "issue", "bad", "weak", "hate"
    ]
    text_lower = text.lower()
    pos = sum(1 for w in positive_words if w in text_lower)
    neg = sum(1 for w in negative_words if w in text_lower)
    if pos > neg: return "positive"
    elif neg > pos: return "negative"
    return "neutral"


# ── Performance Insights ──────────────────────────────────────

def generate_performance_insights(employee_data: dict) -> dict:
    """Generate AI-powered performance summary and anomaly flags."""
    if ai_available:
        try:
            return _performance_insights_ai(employee_data)
        except Exception as e:
            print(f"⚠️ AI performance insights failed: {e}")
    return _performance_insights_heuristic(employee_data)


def _performance_insights_ai(employee_data: dict) -> dict:
    prompt = f"""
Analyze this employee's performance data and provide insights.

Employee: {employee_data.get('name', 'Employee')}
Department: {employee_data.get('department', 'N/A')}
Attendance Rate: {employee_data.get('attendance_rate', 0)}%
Average Rating: {employee_data.get('avg_rating', 0)}/10
Projects Completed: {employee_data.get('projects_completed', 0)}
Attendance Trend: {employee_data.get('attendance_trend', 'stable')}
Rating Trend: {employee_data.get('rating_trend', 'stable')}

Return ONLY valid JSON:
{{
  "summary": "<2-3 sentence performance summary>",
  "flags": ["<flag1>", "<flag2>"]
}}

Flag examples: "attendance_concern", "high_performer", "declining_rating",
"consistent_performer", "promotion_candidate", "needs_support"
"""
    raw = _call_ai(prompt, max_tokens=300)
    return _parse_json(raw)


def _performance_insights_heuristic(employee_data: dict) -> dict:
    """Rules-based performance analysis fallback."""
    rating = employee_data.get('avg_rating', 5.0)
    attendance = employee_data.get('attendance_rate', 80.0)
    flags = []

    if rating >= 8.5:
        flags.append("high_performer")
        if rating >= 9.0: flags.append("promotion_candidate")
    elif rating < 6.0:
        flags.append("needs_support")
        flags.append("declining_rating")
    else:
        flags.append("consistent_performer")

    if attendance < 85:
        flags.append("attendance_concern")

    summary = (
        f"{employee_data.get('name', 'This employee')} demonstrates "
        f"{'strong' if rating >= 7 else 'developing'} performance with an average rating of "
        f"{rating}/10 and {attendance}% attendance. "
        f"{'Performance is on an upward trajectory.' if rating >= 7 else 'Additional support may be beneficial.'}"
    )
    return {"summary": summary, "flags": flags}


# ── Payroll Recommendation ────────────────────────────────────

def recommend_payroll_adjustment(employee_data: dict) -> dict:
    """Rules-based salary adjustment recommendation."""
    rating = employee_data.get('avg_rating', 5.0)
    attendance = employee_data.get('attendance_rate', 80.0)
    projects = employee_data.get('projects_completed', 0)
    peer_avg = employee_data.get('peer_avg_projects', 10)
    tenure_years = employee_data.get('tenure_years', 0)

    perf_adj = 0.20 if rating >= 8.5 else (0.10 if rating >= 7.5 else (0.00 if rating >= 6.5 else -0.05))
    att_adj = 0.05 if attendance >= 95 else (0.02 if attendance >= 90 else -0.02)
    prod_adj = 0.10 if projects >= peer_avg * 1.2 else (0.05 if projects >= peer_avg else 0.00)
    tenure_adj = 0.05 if tenure_years >= 3 else (0.02 if tenure_years >= 1 else 0.00)

    total = perf_adj * 0.40 + att_adj * 0.20 + prod_adj * 0.25 + tenure_adj * 0.15
    pct = round(total * 100, 1)
    adjustment_str = f"+{pct}%" if pct >= 0 else f"{pct}%"

    reasoning = (
        f"Based on a performance rating of {rating}/10, {attendance}% attendance, "
        f"and {tenure_years} year(s) of tenure, a salary adjustment of {adjustment_str} is recommended. "
        f"{'Strong performance merits meaningful recognition.' if pct > 5 else 'Continued growth will unlock higher adjustments.'}"
    )

    return {
        "recommended_adjustment": adjustment_str,
        "reasoning": reasoning,
        "components": {
            "performance": f"{round(perf_adj * 100, 1)}%",
            "attendance":  f"{round(att_adj * 100, 1)}%",
            "productivity":f"{round(prod_adj * 100, 1)}%",
            "tenure":      f"{round(tenure_adj * 100, 1)}%"
        }
    }
