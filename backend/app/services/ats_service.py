import json
import re
from typing import Dict, Any, List
from app.core.config import settings

# Initialize Groq client
groq_client = None

if settings.GROQ_API_KEY:
    try:
        from groq import Groq  # type: ignore
        groq_client = Groq(api_key=settings.GROQ_API_KEY)
        print("⚡ ATS Service: Groq successfully initialized with Llama-3.3-70b!")
    except ImportError:
        print("⚠️ groq package not installed for ATS")

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
                temperature=0.3
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"⚠️ Groq API failed in ATS: {e}. Falling back to OpenRouter...")
            
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
            "temperature": 0.3
        }
        with httpx.Client(timeout=30.0) as client:
            res = client.post(url, headers=headers, json=payload)
            if res.status_code == 200:
                return res.json()["choices"][0]["message"]["content"].strip()
            else:
                print(f"⚠️ OpenRouter ATS API failed: {res.status_code} - {res.text}")
                
    raise RuntimeError("No AI provider available. Please set GROQ_API_KEY or OPENROUTER_API_KEY.")

def _parse_json(raw: str) -> dict:
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
        raise ValueError("Could not parse JSON response from AI")

# --- STAGE 0: Document Gate Check ---
def _ai_document_check(resume_text: str) -> dict:
    system = (
        "You are an extremely strict document classifier. Answer questions about the uploaded document with absolute precision.\n"
        "Return ONLY valid JSON. No markdown. No explanation."
    )
    user = f"""Analyze this document text:

{resume_text}

Answer these questions:
{{
  "is_resume": <true|false>,
  "has_contact_info": <true|false>,
  "has_work_experience": <true|false>,
  "has_education": <true|false>,
  "has_skills_section": <true|false>,
  "document_type": "<resume|cv|job_description|article|code|other>",
  "confidence": <0-100>
}}

CRITICAL RULE: is_resume = true ONLY if the document explicitly looks like a personal resume or CV. It MUST start with a candidate's name and contact information, followed by structured sections for experience, education, or skills. If the document is an article, a block of code, a job description, an essay, or a random text dump, you MUST return is_resume = false, even if it contains keywords!"""
    try:
        raw = _call_ai(user, system_prompt=system, max_tokens=300)
        return _parse_json(raw)
    except Exception as e:
        print(f"⚠️ Document gate check failed: {e}")
        return {"is_resume": True, "document_type": "unknown", "confidence": 0}


def validate_document(resume_text: str, page_count: int) -> dict:
    """Gate check before scoring. Prevents scoring random documents."""
    word_count = len(resume_text.split())

    if word_count < 50:
        return {
            "failed": True,
            "capped_score": 0,
            "reason": "Document is too short to be a resume (under 50 words). Please upload a valid resume."
        }

    if page_count >= 5:
        return {
            "failed": True,
            "capped_score": 0,
            "reason": f"Document is {page_count} pages. A resume should be 1–2 pages. This appears to be a report, academic CV, or thesis. Please upload a concise resume."
        }

    if page_count == 4:
        return {
            "failed": True,
            "capped_score": 0,
            "reason": "Document is 4 pages. Resumes should be 1–2 pages maximum. Please trim to relevant experience only."
        }

    # Deterministic Heuristic Gate
    lower_text = resume_text.lower()
    resume_keywords = ["experience", "education", "skills", "employment", "work history", "project"]
    if sum(1 for kw in resume_keywords if kw in lower_text) < 2:
        return {
            "failed": True,
            "capped_score": 0,
            "reason": "This document lacks standard resume sections (e.g., Experience, Education). It does not appear to be a resume."
        }

    if ai_available:
        gate = _ai_document_check(resume_text)
        if not gate.get("is_resume", True):
            doc_type = gate.get("document_type", "unknown")
            return {
                "failed": True,
                "capped_score": 0,
                "reason": f"This document appears to be a {doc_type}, not a resume. ATS scoring requires a proper resume starting with candidate information and structured experience sections."
            }

    if page_count == 3:
        return {
            "failed": False,
            "warning": "Resume is 3 pages. Consider trimming to 2 pages for better ATS performance. Signal density may be diluted.",
            "page_penalty": 5
        }

    return {"failed": False, "warning": None, "page_penalty": 0}


# --- STAGE 1: Holistic AI Evaluation ---
def score_resume_with_breakdown(resume_text: str, job_description: str, file_page_count: int = 1) -> Dict[str, Any]:
    if not ai_available:
        print("⚠️ ATS: No AI provider configured. Returning fallback structure.")
        return {"ats_score": 0, "error": "AI provider not available for parsing."}

    # STAGE 0: Gate Check
    gate_result = validate_document(resume_text, file_page_count)
    if gate_result.get("failed"):
        return {
            "ats_score": gate_result.get("capped_score", 20),
            "gate_failed": True,
            "gate_reason": gate_result.get("reason"),
            "recommendation": "invalid_document",
            "score_breakdown": None,
            "parsed_resume": {}
        }

    # STAGE 1: Smart AI Evaluation
    system_prompt = (
        "You are an expert Fortune 500 ATS (Applicant Tracking System) AI.\n"
        "Your job is to thoroughly evaluate a candidate's resume against a Job Description.\n"
        "Return ONLY valid JSON. No markdown formatting."
    )
    user_prompt = f"""EVALUATE THIS CANDIDATE:

JOB DESCRIPTION:
{job_description}

RESUME:
{resume_text}

Provide a highly accurate JSON scoring report. 
Do NOT be overly harsh. A strong, relevant resume should easily score 80-95+.
If the job description is short or vague, make reasonable assumptions about standard industry requirements for the role and give the candidate the benefit of the doubt.

RETURN EXACTLY THIS JSON FORMAT:
{{
  "scores": {{
    "keyword_coverage": <score out of 30, evaluate core requirements>,
    "skills_match": <score out of 25, evaluate technical and soft skills>,
    "experience_match": <score out of 20, evaluate years and seniority>,
    "parse_format": <score out of 15, deduct if unreadable or missing contact info>,
    "content_quality": <score out of 10, reward action verbs and quantified impact>
  }},
  "overall_ats_score": <sum of the above scores, max 100>,
  "strengths": ["string", "string"],
  "gaps": ["string", "string"],
  "matched_keywords": ["string", "string"],
  "missing_keywords": ["string", "string"],
  "improvement_tips": ["string", "string"],
  "job_title_found": <true/false>,
  "stuffing_detected": <true/false>
}}"""

    try:
        raw = _call_ai(user_prompt, system_prompt, max_tokens=1500)
        ai_res = _parse_json(raw)
    except Exception as e:
        print(f"⚠️ ATS AI Evaluation failed: {e}")
        return {"ats_score": 50, "error": "AI evaluation failed"}

    scores = ai_res.get("scores", {})
    ats_score = ai_res.get("overall_ats_score", 0)
    
    # Apply page penalty from the gate check
    ats_score = max(0, ats_score - gate_result.get("page_penalty", 0))

    # STAGE 2: Thresholds
    if ats_score >= 85:
        recommendation = "strong_match"
        label = "✅ Strong Match"
        auto_action = "auto_advance"
    elif ats_score >= 65:
        recommendation = "good_match"
        label = "🟡 Good Match"
        auto_action = "recruiter_review"
    elif ats_score >= 45:
        recommendation = "partial_match"
        label = "🟠 Partial Match"
        auto_action = "recruiter_decision"
    else:
        recommendation = "weak_match"
        label = "❌ Weak Match"
        auto_action = "auto_reject_optional"

    return {
        "ats_score": ats_score,
        "label": label,
        "recommendation": recommendation,
        "auto_action": auto_action,
        "gate_failed": False,
        "score_breakdown": {
            "keyword_coverage": {"score": scores.get("keyword_coverage", 0), "max": 30},
            "skills_match": {"score": scores.get("skills_match", 0), "max": 25},
            "experience_match": {"score": scores.get("experience_match", 0), "max": 20},
            "parse_format": {"score": scores.get("parse_format", 0), "max": 15},
            "content_quality": {"score": scores.get("content_quality", 0), "max": 10},
        },
        "parsed_resume": {}, 
        "matched_keywords": ai_res.get("matched_keywords", []),
        "missing_keywords": ai_res.get("missing_keywords", []),
        "strengths": ai_res.get("strengths", []),
        "gaps": ai_res.get("gaps", []),
        "improvement_tips": ai_res.get("improvement_tips", []),
        "job_title_found": ai_res.get("job_title_found", False),
        "stuffing_detected": ai_res.get("stuffing_detected", False),
    }
