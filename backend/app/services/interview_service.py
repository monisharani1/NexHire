import json
import re
from typing import List, Dict, Any
from app.core.config import settings

# Initialize Groq client
groq_client = None

if settings.GROQ_API_KEY:
    try:
        from groq import Groq  # type: ignore
        groq_client = Groq(api_key=settings.GROQ_API_KEY)
        print("⚡ Interview Service: Groq successfully initialized!")
    except ImportError:
        print("⚠️ groq package not installed for Interview")

ai_available = groq_client is not None or bool(getattr(settings, "OPENROUTER_API_KEY", None))


def _call_ai(prompt: str, system_prompt: str = "", max_tokens: int = 1500) -> str:
    """Unified AI call via Groq with OpenRouter fallback."""
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

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
            print(f"⚠️ Groq API failed in Interview Service: {e}. Falling back to OpenRouter...")
            
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
                print(f"⚠️ OpenRouter Interview API failed: {res.status_code} - {res.text}")
                
    raise RuntimeError("No AI provider available. Please set GROQ_API_KEY or OPENROUTER_API_KEY.")


from typing import List, Dict, Any, Union

def _parse_json(raw: str) -> Union[dict, list]:
    text = raw.strip()
    if text.startswith("```json"):
        text = text.split("```json")[1].split("```")[0].strip()
    elif text.startswith("```"):
        text = text.split("```")[1].split("```")[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try object or array
        match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError("Could not parse JSON response from AI")


def generate_initial_questions(job_title: str, job_description: str) -> List[str]:
    """
    Generates 5 initial questions (2 technical + 2 behavioral + 1 situational) based on job description.
    """
    if ai_available:
        try:
            return _generate_questions_ai(job_title, job_description)
        except Exception as e:
            print(f"⚠️ AI question generation failed: {e}. Falling back to heuristics.")

    return _generate_questions_heuristic(job_title, job_description)


def _generate_questions_ai(job_title: str, job_description: str) -> List[str]:
    system_prompt = (
        f"You are an expert technical interviewer for {job_title} position.\n"
        "You generate highly relevant, professional, and clear interview questions.\n"
        "Respond ONLY with a valid JSON array of 5 strings. No markdown, no conversational explanation."
    )
    user_prompt = f"""Generate 5 interview questions for the position of {job_title}.
Mix: 2 technical, 2 behavioral, 1 situational.

JOB DESCRIPTION:
{job_description}

Return ONLY this JSON array structure:
[
  "question 1",
  "question 2",
  "question 3",
  "question 4",
  "question 5"
]"""

    raw = _call_ai(user_prompt, system_prompt=system_prompt, max_tokens=600)
    return _parse_json(raw)


def _generate_questions_heuristic(job_title: str, job_description: str) -> List[str]:
    title_l = job_title.lower()
    desc_l = job_description.lower()

    if "frontend" in title_l or "react" in title_l or "ui" in title_l or "design" in title_l:
        return [
            "Welcome! Please start by introducing yourself and outlining your core experience with React 18 and state management.",
            "Explain how you optimize frontend performance in heavy web/dashboard applications. What tools or strategies do you use?",
            "Describe a time you had a technical disagreement with a developer teammate regarding UI layouts or logic, and how you resolved it.",
            "How do you approach writing clean, modular CSS styles, and what are your thoughts on using utility libraries like TailwindCSS?",
            "Situational question: If a critical user-facing dashboard renders blank on production due to a runtime JS error, what is your step-by-step diagnostic workflow?"
        ]
    elif "backend" in title_l or "python" in title_l or "django" in title_l or "fastapi" in title_l or "database" in title_l:
        return [
            "Welcome! Please start by introducing yourself and outlining your core experience with Python backend frameworks and API structures.",
            "Explain how you design database queries and manage indexing or connection pooling under heavy concurrent traffic.",
            "Describe a complex backend bug or memory leak you encountered in production, and how you tracked it down and resolved it.",
            "What is your approach to writing unit tests, documenting REST/GraphQL APIs, and setting up automated CI/CD workflows?",
            "Situational question: A celery background worker starts running out of memory in staging every time a report is exported. How do you diagnose and refactor the code?"
        ]
    else:
        return [
            f"Welcome! Please start by introducing yourself and outlining your core experience in software engineering related to {job_title}.",
            "Explain how you approach optimizing database structures and code efficiency to minimize API latency.",
            "Describe a time you had a technical disagreement with a team member, and how you worked together to reach a successful resolution.",
            "What are your core practices for ensuring code quality, code reviews, and robust deployment pipelines?",
            "Situational question: If a production server crashes under a sudden spike in traffic, what is your immediate checklist to restore services and mitigate future spikes?"
        ]


def generate_follow_up(job_title: str, job_description: str, transcript_so_far: List[Dict[str, Any]], current_answer: str) -> str:
    """
    Generates a natural, context-aware follow-up question based on the interview transcript.
    """
    if ai_available:
        try:
            return _generate_follow_up_ai(job_title, job_description, transcript_so_far, current_answer)
        except Exception as e:
            print(f"⚠️ AI follow-up generation failed: {e}. Falling back to heuristics.")

    return _generate_follow_up_heuristic(current_answer)


def _generate_follow_up_ai(job_title: str, job_description: str, transcript_so_far: List[Dict[str, Any]], current_answer: str) -> str:
    system_prompt = (
        f"You are an expert technical interviewer for {job_title} position.\n"
        "You ask clear, relevant questions and sharp follow-ups.\n"
        "Respond ONLY with the next question. No preamble, no explanation."
    )

    history_text = ""
    for msg in transcript_so_far[-6:]:
        role = "Interviewer" if msg.get("role") == "ai" else "Candidate"
        text = msg.get("text", "")
        history_text += f"{role}: {text}\n"

    user_prompt = f"""Job: {job_title}
Job Description: {job_description}

Interview so far:
{history_text}
Candidate's latest answer: "{current_answer}"

Based on this answer, generate a conversational response that:
1. Briefly acknowledges or validates what they just said (showing you understand their point).
2. Asks ONE follow-up question probing deeper into their answer.
3. Is natural, friendly, and conversational (like a real human interviewer).
4. Is kept under 40 words total.

If the current answer indicates they cannot answer or is empty, ask them to elaborate on general principles or move on."""

    return _call_ai(user_prompt, system_prompt=system_prompt, max_tokens=100)


def _generate_follow_up_heuristic(current_answer: str) -> str:
    txt = current_answer.lower()

    if not txt or len(txt.split()) < 5:
        return "That was a brief response. Can you elaborate further on your experience with this or outline the core principles?"

    if "react" in txt or "state" in txt or "redux" in txt or "context" in txt:
        return "You mentioned state management. How do you handle performance bottlenecks or prevent unnecessary re-renders in deep component hierarchies?"
    elif "tailwind" in txt or "css" in txt or "style" in txt or "flex" in txt:
        return "How do you ensure responsiveness and visual consistency across different devices when structuring your CSS layouts?"
    elif "fastapi" in txt or "django" in txt or "flask" in txt or "python" in txt:
        return "Can you describe how you handle dependency injection or route parameter validation in that framework?"
    elif "sql" in txt or "postgres" in txt or "database" in txt or "query" in txt:
        return "Regarding database performance, how do you approach indexing and optimize queries that join multiple tables?"
    elif "docker" in txt or "kubernetes" in txt or "aws" in txt or "deploy" in txt:
        return "Interesting. How do you set up environment configurations and orchestrate rollbacks if a deployment fails in production?"
    elif "test" in txt or "unit" in txt or "ci" in txt:
        return "How do you handle mock objects and external service assertions in your integration tests?"
    else:
        return "That makes sense. Can you share a specific technical trade-off you had to make when implementing a solution like that?"


def generate_transition(transcript_so_far: List[Dict[str, Any]], current_answer: str, next_question: str) -> str:
    """
    Generates a natural conversational transition from the candidate's last answer to the next pre-planned question.
    """
    if ai_available:
        try:
            return _generate_transition_ai(transcript_so_far, current_answer, next_question)
        except Exception:
            pass
    return f"Great, thank you for sharing that. My next question is: {next_question}"

def _generate_transition_ai(transcript_so_far: List[Dict[str, Any]], current_answer: str, next_question: str) -> str:
    system_prompt = (
        "You are an expert technical interviewer.\n"
        "You transition smoothly between topics.\n"
        "Respond ONLY with the exact spoken text. No preamble."
    )

    user_prompt = f"""Candidate's last answer: "{current_answer}"

The next planned interview question is: "{next_question}"

Generate a smooth, conversational response that:
1. Briefly acknowledges or thanks them for their previous answer (1 short sentence).
2. Smoothly transitions into asking the planned next question.
3. Keep it entirely under 50 words. Do not change the core meaning of the next question."""

    return _call_ai(user_prompt, system_prompt=system_prompt, max_tokens=150)


def score_interview(
    job_title: str,
    job_description: str,
    transcript: List[Dict[str, Any]],
    wpm: float,
    filler_count: int,
    avg_words: int,
    sentiment_list: List[str]
) -> Dict[str, Any]:
    """
    Scores the interview questions and returns the full AI evaluation report.
    """
    if ai_available:
        try:
            return _score_interview_ai(job_title, job_description, transcript, wpm, filler_count, avg_words, sentiment_list)
        except Exception as e:
            print(f"⚠️ AI interview evaluation failed: {e}. Falling back to offline heuristics.")

    return _score_interview_heuristic(job_title, job_description, transcript, wpm, filler_count, avg_words, sentiment_list)


def _score_interview_ai(
    job_title: str,
    job_description: str,
    transcript: List[Dict[str, Any]],
    wpm: float,
    filler_count: int,
    avg_words: int,
    sentiment_list: List[str]
) -> Dict[str, Any]:
    system_prompt = (
        "You are an expert HR evaluator scoring a video interview.\n"
        "Be fair, objective, and detailed.\n"
        "Return ONLY valid JSON. No markdown. No extra text."
    )

    transcript_text = ""
    idx = 1
    for i in range(0, len(transcript) - 1, 2):
        q = transcript[i].get("text", "")
        a = transcript[i+1].get("text", "") if i+1 < len(transcript) else "No answer"
        transcript_text += f"Q{idx}: {q}\nA{idx}: {a}\n\n"
        idx += 1

    user_prompt = f"""Job Title: {job_title}
Job Description: {job_description}

Interview Transcript:
{transcript_text}

Speaking metrics:
- Words per minute: {wpm}
- Filler words used: {filler_count}
- Average answer length: {avg_words} words
- Sentiment per answer: {sentiment_list}

Score this interview and return EXACTLY this JSON structure:
{{
  "overall_score": <0-100>,
  "confidence_score": <0-100>,
  "communication_score": <0-100>,
  "technical_accuracy_score": <0-100>,
  "per_question_scores": [
    {{
      "question": "<question text>",
      "answer": "<answer text>",
      "score": <0-100>,
      "feedback": "<specific feedback>",
      "strength": "<what they did well>",
      "improvement": "<what could be better>"
    }}
  ],
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "overall_feedback": "<2-3 sentence summary>",
  "hire_recommendation": "<strong_yes|yes|maybe|no>",
  "confidence_flags": {{
    "filler_words_count": {filler_count},
    "avg_words_per_answer": {avg_words},
    "speaking_pace": "<fast|normal|slow>",
    "sentiment_trend": "<positive|neutral|negative>"
  }}
}}"""

    raw = _call_ai(user_prompt, system_prompt=system_prompt, max_tokens=2000)
    return _parse_json(raw)


def _score_interview_heuristic(
    job_title: str,
    job_description: str,
    transcript: List[Dict[str, Any]],
    wpm: float,
    filler_count: int,
    avg_words: int,
    sentiment_list: List[str]
) -> Dict[str, Any]:
    """
    Offline scoring engine for interviews, evaluating pacing, content, and filler words.
    """
    # 1. Confidence Score (0-100)
    # Penalize filler words: 0-3 -> 100%, 4-8 -> 75%, 9-15 -> 50%, 16+ -> 25%
    if filler_count <= 3:
        filler_pts = 100
    elif filler_count <= 8:
        filler_pts = 75
    elif filler_count <= 15:
        filler_pts = 50
    else:
        filler_pts = 25

    # Pace: 120-160 is ideal. Fast >180, slow <80.
    pace_str = "normal"
    pace_pts = 100
    if wpm > 180:
        pace_str = "fast"
        pace_pts = 70
    elif wpm < 80:
        pace_str = "slow"
        pace_pts = 65
    elif wpm > 160 or wpm < 120:
        pace_pts = 85

    # Length
    len_pts = 100 if avg_words >= 60 else (75 if avg_words >= 30 else 40)
    confidence_score = round((filler_pts * 0.40) + (pace_pts * 0.30) + (len_pts * 0.30))

    # 2. Communication Score (0-100)
    # Check coherence (short answers get lower points)
    comm_score = 80
    if avg_words < 30:
        comm_score -= 20
    if filler_count > 10:
        comm_score -= 10
    
    # Positive sentiment bonus
    positives = sum(1 for s in sentiment_list if s == "positive")
    negatives = sum(1 for s in sentiment_list if s == "negative")
    comm_score += (positives * 2) - (negatives * 3)
    comm_score = min(98, max(45, comm_score))

    # 3. Technical Accuracy (0-100)
    # Scan answer text for keywords matching required keywords
    tech_score = 75
    keywords = ["react", "typescript", "fastapi", "django", "postgres", "sql", "docker", "kubernetes", "aws", "git", "ci/cd", "state", "redux"]
    matched = 0
    all_answers = " ".join([m.get("text", "").lower() for m in transcript if m.get("role") in ["candidate", "candidate_followup"]])
    for kw in keywords:
        if kw in all_answers:
            matched += 1
    
    tech_score += (matched * 3)
    tech_score = min(98, max(50, tech_score))

    # 4. Overall Interview Score
    overall_score = round((confidence_score * 0.30) + (comm_score * 0.30) + (tech_score * 0.40))

    # Recommendation
    if overall_score >= 85:
        recommendation = "strong_yes"
    elif overall_score >= 70:
        recommendation = "yes"
    elif overall_score >= 50:
        recommendation = "maybe"
    else:
        recommendation = "no"

    # Per question breakdown
    per_question = []
    idx = 1
    # Group into Q&A
    for i in range(0, len(transcript) - 1, 2):
        q_text = transcript[i].get("text", "")
        a_text = transcript[i+1].get("text", "") if i+1 < len(transcript) else ""
        
        # Heuristic scoring of this question
        q_score = 70
        q_words = len(a_text.split())
        if q_words > 40:
            q_score += 15
        if "um" in a_text.lower() or "uh" in a_text.lower():
            q_score -= 5

        per_question.append({
            "question": q_text,
            "answer": a_text,
            "score": min(98, q_score),
            "feedback": f"Demonstrated basic competency. Answer length was {q_words} words.",
            "strength": "Clean sentence delivery" if q_score >= 75 else "Prompt answering",
            "improvement": "Include more specific architectural examples" if q_score < 80 else "Reduce filler words"
        })
        idx += 1

    sentiment_trend = "positive" if positives > negatives else ("negative" if negatives > positives else "neutral")

    strengths = [
        "Consistent speaking pace under evaluation pressure",
        "Coherent structuring of technical responses",
        "Clear knowledge of coding terminology"
    ]
    weaknesses = []
    if filler_count > 6:
        weaknesses.append(f"Moderate usage of speech filler words ({filler_count} occurrences)")
    if avg_words < 50:
        weaknesses.append("Answers could be more detailed with concrete code examples")
    if not weaknesses:
        weaknesses.append("Minor database query explanation tuning suggested")

    return {
        "overall_score": overall_score,
        "confidence_score": confidence_score,
        "communication_score": comm_score,
        "technical_accuracy_score": tech_score,
        "per_question_scores": per_question,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "overall_feedback": f"The candidate demonstrated solid confidence (pacing was {pace_str} at {round(wpm)} WPM) with clean conceptual delivery. Technical responses show good framework alignment.",
        "hire_recommendation": recommendation,
        "confidence_flags": {
            "filler_words_count": filler_count,
            "avg_words_per_answer": avg_words,
            "speaking_pace": pace_str,
            "sentiment_trend": sentiment_trend
        }
    }
