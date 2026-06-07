# NexHire — ATS Scoring Engine v2.0
## Research-Backed Strategy (2026 Best Practices)
## Build Specification for Antigravity

---

## WHAT CHANGED FROM v1 — WHY WE REBUILT THIS

Based on 2026 industry research across Jobscan, Resume Optimizer Pro,
Resume Worded, NeuraCV, and Resumly.ai cross-tool studies:

```
OLD THINKING (2023):           NEW REALITY (2026):
─────────────────────────────────────────────────────
Exact keyword counting     →   Semantic + exact hybrid matching
Page length = score        →   Signal DENSITY per page matters
Simple section check       →   Parse completeness scoring
Keyword stuffing rewarded  →   Keyword stuffing PENALIZED
Static weights             →   Job-title-adaptive weights
No document validation     →   Pre-score document gate (our addition)
```

Key research findings we used:
- Jobscan data: including the EXACT job title increases interview
  likelihood by 10.6x — highest single leverage point
- Resume Optimizer Pro (May 2026, 4,200 resumes): 5 core signals
  drive every modern ATS engine
- Modern ATS (Greenhouse, Workday 2026): semantic embedding
  alongside exact keyword match — "led a team" = "team leadership"
- Keyword stuffing is PENALIZED by modern ATS platforms
- ATS do NOT penalize 2-page resumes — they penalize LOW SIGNAL DENSITY

---

## STAGE 0: DOCUMENT VALIDATION GATE (PRE-SCORE)
### The "Is this actually a resume?" check

This runs BEFORE any scoring.
If it fails → score is capped at maximum 35/100 regardless.

```
VALIDATION CHECKS:
─────────────────────────────────────────────────────────────
Check 1: PAGE LENGTH GATE
  ├── Count pages in uploaded PDF
  ├── 1 page  → PASS (no penalty)
  ├── 2 pages → PASS (no penalty, normal for 3+ yr experience)
  ├── 3 pages → SOFT WARNING (−5 pts from format score)
  ├── 4 pages → HARD WARNING (−15 pts from format score)
  └── 5+ pages → FAIL GATE → score capped at 35/100
      Reason: "Document exceeds resume length. This appears to be
               a CV, report, or academic document — not a resume.
               A resume should be 1–2 pages maximum."

Check 2: RESUME STRUCTURE DETECTION (Claude)
  Ask Claude: "Does this document contain the standard sections
               of a professional resume? (Contact info, Work
               Experience, Education, Skills). Answer only YES or NO."
  ├── YES → PASS → proceed to scoring
  └── NO  → FAIL GATE → score capped at 20/100
      Reason: "This document does not appear to be a resume.
               No standard resume sections were detected."

Check 3: MINIMUM CONTENT THRESHOLD
  ├── Word count < 50   → FAIL → "Document too short to be a resume"
  ├── Word count 50–150 → WARN → "Very sparse resume, likely incomplete"
  └── Word count > 150  → PASS

Check 4: FILE PARSABILITY
  ├── Text extraction successful → PASS
  ├── Scanned image PDF (no text) → FAIL → "Cannot parse scanned PDF.
  │                                         Please upload a text-based PDF."
  └── Password protected → FAIL → "Cannot open protected document."

Check 5: LANGUAGE DETECTION
  ├── English detected → PASS
  └── Non-English → WARN → "Non-English content detected.
                             ATS scoring optimized for English resumes."
```

### Gate Results:
```
All checks PASS    → Proceed to full scoring (0–100)
1 soft warning     → Proceed with noted deduction
Any FAIL           → Score capped (20 or 35) + clear reason shown
Multiple FAILs     → Score = 10 + message: "Not a valid resume"
```

---

## STAGE 1: RESUME PARSING
### What to extract before scoring

```python
PARSED_RESUME = {
  # Identity
  "name": str,
  "email": str,
  "phone": str,
  "location": str,
  "linkedin_url": str,
  "github_url": str,
  "portfolio_url": str,

  # Professional
  "job_title_current": str,           # most recent title
  "total_experience_years": float,    # calculated from dates
  "work_experience": [
    {
      "title": str,
      "company": str,
      "start_date": str,
      "end_date": str,                # "Present" if current
      "duration_months": int,
      "bullets": [str],               # responsibility bullets
      "keywords_in_bullets": [str]    # extracted terms
    }
  ],

  # Education
  "education": [
    {
      "degree": str,                  # B.E., B.Tech, M.Tech, MBA
      "field": str,                   # CSE, ECE, Data Science
      "institution": str,
      "graduation_year": int,
      "gpa": float                    # null if not mentioned
    }
  ],

  # Skills
  "technical_skills": [str],
  "soft_skills": [str],
  "tools_and_platforms": [str],
  "certifications": [str],

  # Projects
  "projects": [
    {
      "name": str,
      "description": str,
      "tech_stack": [str]
    }
  ],

  # Signals
  "has_quantified_achievements": bool,  # "increased by 40%", "led team of 5"
  "action_verb_count": int,             # "built", "led", "designed"
  "sections_detected": [str],           # ["Summary","Experience","Education","Skills"]
  "page_count": int,
  "word_count": int,
}
```

---

## STAGE 2: JOB DESCRIPTION PARSING
### Extract what the job actually needs

```python
PARSED_JD = {
  "job_title": str,                   # CRITICAL — 10.6x interview multiplier
  "required_skills": [str],           # MUST have
  "preferred_skills": [str],          # NICE to have
  "required_experience_years": int,
  "required_degree": str,
  "required_field": str,
  "hard_keywords": [str],             # technical terms, tools, frameworks
  "soft_keywords": [str],             # leadership, communication, etc.
  "industry_terms": [str],            # sector-specific language
  "certifications_required": [str],
  "seniority_level": str,             # entry/mid/senior/lead
}
```

---

## STAGE 3: THE SCORING ENGINE (100 points)
### 5-Component Research-Backed Weights

```
Component                    Points    Source / Justification
─────────────────────────────────────────────────────────────────────
1. Keyword Coverage           30 pts   Resume Optimizer Pro 2026:
                                       "keyword match percentage is
                                       the primary driver"

2. Skills Match               25 pts   Jobscan: hard skills, job titles,
                                       education, soft skills — in that
                                       priority order

3. Experience & Seniority     20 pts   All major ATS platforms weight
                                       this as 3rd most important

4. Parse Quality & Format     15 pts   Resume Optimizer Pro: "section
                                       structure recognition" and
                                       "formatting risk score" combined

5. Content Quality            10 pts   Quantified achievements,
                                       action verbs, recency signals
─────────────────────────────────────────────────────────────────────
TOTAL                         100 pts
```

---

### COMPONENT 1: Keyword Coverage (30 pts)

```python
def score_keywords(parsed_resume, parsed_jd):
    """
    Hybrid: exact match + semantic match
    Research basis: 2026 ATS (Greenhouse, Workday) use both
    """

    required_kw  = set(parsed_jd["hard_keywords"])
    preferred_kw = set(parsed_jd["preferred_skills"])
    resume_kw    = set(parsed_resume["technical_skills"] +
                       parsed_resume["tools_and_platforms"])

    # --- Exact match ---
    exact_required  = resume_kw & required_kw
    exact_preferred = resume_kw & preferred_kw

    # --- Semantic match (Claude) ---
    # Ask Claude: which job keywords are semantically present
    # in the resume even if not exact? e.g. "Postgres" = "PostgreSQL"
    semantic_matches = claude_semantic_check(
        resume_text=full_resume_text,
        job_keywords=list(required_kw - exact_required)
    )

    # --- Job Title Match (10.6x multiplier signal) ---
    # Jobscan data: this is the single highest-leverage keyword
    job_title_in_resume = (
        parsed_jd["job_title"].lower() in full_resume_text.lower()
    )
    title_bonus = 3 if job_title_in_resume else 0

    # --- Keyword Stuffing Penalty ---
    # Modern ATS penalizes unnatural density
    # Heuristic: if same keyword appears 5+ times unnaturally → penalty
    stuffing_penalty = detect_keyword_stuffing(full_resume_text, required_kw)

    # --- Calculate ---
    total_required = len(required_kw) if required_kw else 1

    matched = len(exact_required) + len(semantic_matches)
    base_score = (matched / total_required) * 24       # 24 pts base
    preferred_bonus = min(len(exact_preferred) * 0.5, 3)  # up to 3 pts

    raw = base_score + preferred_bonus + title_bonus - stuffing_penalty
    return min(round(raw), 30)

    # DETAIL OUTPUT:
    return {
        "score": min(round(raw), 30),
        "matched_required": list(exact_required | set(semantic_matches)),
        "missing_required": list(required_kw - exact_required - set(semantic_matches)),
        "matched_preferred": list(exact_preferred),
        "job_title_found": job_title_in_resume,
        "stuffing_detected": stuffing_penalty > 0
    }
```

---

### COMPONENT 2: Skills Match (25 pts)

```python
def score_skills(parsed_resume, parsed_jd):
    """
    Priority order (Jobscan research):
    1. Hard/technical skills    → 12 pts
    2. Job titles               →  6 pts
    3. Education requirements   →  4 pts
    4. Soft skills              →  3 pts
    """

    # --- Hard Skills (12 pts) ---
    required_hard = set(parsed_jd["required_skills"])
    resume_hard   = set(parsed_resume["technical_skills"] +
                        parsed_resume["tools_and_platforms"])
    hard_match    = len(resume_hard & required_hard)
    hard_score    = (hard_match / max(len(required_hard), 1)) * 12

    # --- Job Title Match (6 pts) ---
    candidate_titles = [exp["title"].lower()
                        for exp in parsed_resume["work_experience"]]
    target_title     = parsed_jd["job_title"].lower()
    title_words      = set(target_title.split())

    title_score = 0
    for ct in candidate_titles:
        ct_words = set(ct.split())
        overlap  = len(title_words & ct_words) / max(len(title_words), 1)
        if overlap >= 0.8:
            title_score = 6; break
        elif overlap >= 0.5:
            title_score = max(title_score, 4)
        elif overlap >= 0.3:
            title_score = max(title_score, 2)

    # --- Education (4 pts) ---
    edu_score = 0
    req_degree = parsed_jd.get("required_degree", "").lower()
    req_field  = parsed_jd.get("required_field", "").lower()

    for edu in parsed_resume["education"]:
        degree_match = req_degree in edu["degree"].lower() if req_degree else True
        field_match  = req_field  in edu["field"].lower()  if req_field  else True
        if degree_match and field_match:
            edu_score = 4; break
        elif degree_match or field_match:
            edu_score = max(edu_score, 2)

    # --- Soft Skills (3 pts) ---
    req_soft    = set(parsed_jd["soft_keywords"])
    resume_soft = set(parsed_resume["soft_skills"])
    soft_match  = len(resume_soft & req_soft)
    soft_score  = min((soft_match / max(len(req_soft), 1)) * 3, 3)

    total = hard_score + title_score + edu_score + soft_score
    return min(round(total), 25)
```

---

### COMPONENT 3: Experience & Seniority Match (20 pts)

```python
def score_experience(parsed_resume, parsed_jd):
    """
    Match candidate experience against required experience.
    Also check seniority alignment.
    """

    required_years   = parsed_jd.get("required_experience_years", 0)
    candidate_years  = parsed_resume.get("total_experience_years", 0)
    seniority_level  = parsed_jd.get("seniority_level", "mid")

    # --- Years of experience (14 pts) ---
    if required_years == 0:
        years_score = 14   # no requirement stated = full points
    elif candidate_years >= required_years:
        years_score = 14
    elif candidate_years >= required_years * 0.8:
        years_score = 11
    elif candidate_years >= required_years * 0.6:
        years_score = 8
    elif candidate_years >= required_years * 0.4:
        years_score = 5
    else:
        years_score = 2

    # --- Seniority alignment (6 pts) ---
    # Prevents junior applying for senior (and vice versa)
    seniority_map = {
        "entry":  (0, 2),    # 0–2 years
        "mid":    (2, 5),    # 2–5 years
        "senior": (5, 10),   # 5–10 years
        "lead":   (8, 99),   # 8+ years
    }

    expected_range = seniority_map.get(seniority_level, (0, 99))
    if expected_range[0] <= candidate_years <= expected_range[1]:
        seniority_score = 6
    elif abs(candidate_years - expected_range[0]) <= 1:
        seniority_score = 4   # close match
    else:
        seniority_score = 1   # significant mismatch

    # --- Recency signal (bonus) ---
    # 2026 ATS: experience from last 24 months weighted higher
    # Check if most recent role matches required skills
    recent_keywords = []
    if parsed_resume["work_experience"]:
        latest = parsed_resume["work_experience"][0]
        recent_keywords = latest.get("keywords_in_bullets", [])

    required_kw     = set(parsed_jd["required_skills"])
    recency_overlap = len(set(recent_keywords) & required_kw)
    recency_bonus   = min(recency_overlap * 0.5, 2)   # up to 2 bonus pts

    total = years_score + seniority_score + recency_bonus
    return min(round(total), 20)
```

---

### COMPONENT 4: Parse Quality & Format (15 pts)

```python
def score_format(parsed_resume):
    """
    Based on Resume Optimizer Pro's 2026 5-signal model:
    Section detection + formatting risk + parse completeness
    """

    score = 0

    # --- Section Detection (6 pts) ---
    # Checks: Summary, Experience, Education, Skills, Certifications
    standard_sections = ["experience", "education", "skills"]
    bonus_sections    = ["summary", "projects", "certifications", "achievements"]

    detected = [s.lower() for s in parsed_resume["sections_detected"]]

    standard_found = sum(1 for s in standard_sections if s in detected)
    bonus_found    = sum(1 for s in bonus_sections    if s in detected)

    section_score = (standard_found / 3) * 5 + min(bonus_found * 0.5, 1)

    # --- Contact Completeness (3 pts) ---
    contact_score = 0
    if parsed_resume.get("email"):  contact_score += 1
    if parsed_resume.get("phone"):  contact_score += 1
    if parsed_resume.get("name"):   contact_score += 1

    # --- Parse Completeness (3 pts) ---
    # Did key fields survive extraction without corruption?
    parse_score = 0
    if parsed_resume["work_experience"]:  parse_score += 1
    if parsed_resume["education"]:        parse_score += 1
    if parsed_resume["technical_skills"]: parse_score += 1

    # --- Formatting Risk Penalties ---
    # Based on Resume Optimizer Pro: multi-column, tables, text boxes
    # These confuse ATS parsers
    format_risk_penalty = 0
    # Detected via Claude: "Does this resume use tables, text boxes,
    # or multi-column layouts?" → if yes → penalty
    if parsed_resume.get("has_tables"):         format_risk_penalty += 2
    if parsed_resume.get("has_text_boxes"):     format_risk_penalty += 1
    if parsed_resume.get("contact_in_header"):  format_risk_penalty += 1

    # --- Page Length Signal ---
    # Not a direct penalty (ATS don't penalize length)
    # But high page count = lower signal density = indirect penalty
    page_count  = parsed_resume.get("page_count", 1)
    page_signal = 0
    if page_count <= 2:
        page_signal = 2
    elif page_count == 3:
        page_signal = 0
    else:
        page_signal = -2   # 4+ pages = likely not a resume OR bloated

    total = section_score + contact_score + parse_score
    total = total - format_risk_penalty + page_signal
    return max(min(round(total), 15), 0)
```

---

### COMPONENT 5: Content Quality (10 pts)

```python
def score_content_quality(parsed_resume, parsed_jd):
    """
    2026 signal: quantified achievements + action verbs +
    recency of relevant content
    """

    score = 0

    # --- Quantified Achievements (4 pts) ---
    # "increased revenue by 30%", "led team of 8", "reduced latency by 40ms"
    # Detected by Claude or regex pattern
    if parsed_resume.get("has_quantified_achievements"):
        # Count how many bullets have numbers
        all_bullets  = [b for exp in parsed_resume["work_experience"]
                          for b in exp.get("bullets", [])]
        quant_count  = sum(1 for b in all_bullets
                           if any(c.isdigit() for c in b))
        quant_ratio  = quant_count / max(len(all_bullets), 1)

        if quant_ratio >= 0.5:   score += 4
        elif quant_ratio >= 0.3: score += 3
        elif quant_ratio >= 0.1: score += 2
        else:                    score += 1

    # --- Action Verbs (3 pts) ---
    # Strong verbs: built, led, designed, implemented, reduced, increased
    action_verb_count = parsed_resume.get("action_verb_count", 0)
    if action_verb_count >= 10:  score += 3
    elif action_verb_count >= 5: score += 2
    elif action_verb_count >= 2: score += 1

    # --- Career Progression Signal (2 pts) ---
    # Check if titles show upward progression
    # e.g. Junior → Mid → Senior = good signal
    titles = [exp["title"] for exp in parsed_resume["work_experience"]]
    if len(titles) >= 2:
        score += 1   # has multiple roles
    if len(titles) >= 3:
        score += 1   # consistent career history

    # --- Professional Links (1 pt) ---
    if (parsed_resume.get("github_url") or
        parsed_resume.get("linkedin_url") or
        parsed_resume.get("portfolio_url")):
        score += 1

    return min(score, 10)
```

---

## STAGE 4: FINAL SCORE ASSEMBLY

```python
def calculate_ats_score(
    resume_text: str,
    job_description: str,
    file_page_count: int
) -> dict:

    # ── STAGE 0: Gate Check ──────────────────────────────────
    gate_result = validate_document(resume_text, file_page_count)

    if gate_result["failed"]:
        return {
            "ats_score": gate_result["capped_score"],
            "gate_failed": True,
            "gate_reason": gate_result["reason"],
            "recommendation": "invalid_document",
            "score_breakdown": None
        }

    # ── STAGE 1: Parse ───────────────────────────────────────
    parsed_resume = parse_resume(resume_text)      # Claude
    parsed_jd     = parse_job_description(job_description)  # Claude

    # ── STAGE 2: Score each component ───────────────────────
    kw_result  = score_keywords(parsed_resume, parsed_jd)
    sk_result  = score_skills(parsed_resume, parsed_jd)
    exp_result = score_experience(parsed_resume, parsed_jd)
    fmt_result = score_format(parsed_resume)
    cq_result  = score_content_quality(parsed_resume, parsed_jd)

    # ── STAGE 3: Sum ─────────────────────────────────────────
    raw_score = (
        kw_result["score"]  +  # max 30
        sk_result           +  # max 25
        exp_result          +  # max 20
        fmt_result          +  # max 15
        cq_result              # max 10
    )

    ats_score = min(max(round(raw_score), 0), 100)

    # ── STAGE 4: Threshold & Recommendation ─────────────────
    if ats_score >= 85:
        recommendation = "strong_match"
        label          = "✅ Strong Match"
        auto_action    = "auto_advance"
    elif ats_score >= 65:
        recommendation = "good_match"
        label          = "🟡 Good Match"
        auto_action    = "recruiter_review"
    elif ats_score >= 45:
        recommendation = "partial_match"
        label          = "🟠 Partial Match"
        auto_action    = "recruiter_decision"
    else:
        recommendation = "weak_match"
        label          = "❌ Weak Match"
        auto_action    = "auto_reject_optional"

    return {
        "ats_score": ats_score,
        "label": label,
        "recommendation": recommendation,
        "auto_action": auto_action,
        "gate_failed": False,

        "score_breakdown": {
            "keyword_coverage":    {"score": kw_result["score"],  "max": 30},
            "skills_match":        {"score": sk_result,           "max": 25},
            "experience_match":    {"score": exp_result,          "max": 20},
            "parse_format":        {"score": fmt_result,          "max": 15},
            "content_quality":     {"score": cq_result,           "max": 10},
        },

        "parsed_resume": parsed_resume,

        "matched_keywords":    kw_result["matched_required"],
        "missing_keywords":    kw_result["missing_required"],
        "matched_skills":      [],   # from sk_result
        "missing_skills":      [],

        "strengths":           [],   # Claude generates these
        "gaps":                [],   # Claude generates these
        "improvement_tips":    [],   # Claude generates these
        "job_title_found":     kw_result["job_title_found"],
        "stuffing_detected":   kw_result["stuffing_detected"],
    }
```

---

## STAGE 5: CLAUDE PROMPTS (EXACT)

### Prompt A: Full Parsing + Scoring

```
SYSTEM:
You are an expert ATS engine used by Fortune 500 companies.
You parse resumes and score them with precision.
Return ONLY valid JSON. No markdown. No extra text outside JSON.
If a field is not found, use null.

USER:
Parse this resume AND score it against the job description.

JOB DESCRIPTION:
{job_description}

RESUME TEXT:
{resume_text}

Return this exact JSON:
{
  "parsed_resume": {
    "name": null,
    "email": null,
    "phone": null,
    "location": null,
    "linkedin_url": null,
    "github_url": null,
    "job_title_current": null,
    "total_experience_years": 0,
    "technical_skills": [],
    "soft_skills": [],
    "tools_and_platforms": [],
    "certifications": [],
    "sections_detected": [],
    "has_quantified_achievements": false,
    "action_verb_count": 0,
    "has_tables": false,
    "has_text_boxes": false
  },
  "parsed_jd": {
    "job_title": null,
    "required_skills": [],
    "preferred_skills": [],
    "required_experience_years": 0,
    "required_degree": null,
    "hard_keywords": [],
    "soft_keywords": [],
    "seniority_level": "mid"
  },
  "semantic_matches": [],
  "stuffing_detected": false,
  "strengths": [],
  "gaps": [],
  "improvement_tips": []
}
```

### Prompt B: Document Gate Check

```
SYSTEM:
You are a document classifier. Answer questions about
the uploaded document with extreme precision.
Return ONLY valid JSON.

USER:
Analyze this document text:

{resume_text}

Answer these questions:
{
  "is_resume": <true|false>,
  "has_contact_info": <true|false>,
  "has_work_experience": <true|false>,
  "has_education": <true|false>,
  "has_skills_section": <true|false>,
  "document_type": "<resume|cv|report|essay|cover_letter|other>",
  "confidence": <0-100>
}

is_resume = true ONLY if this contains contact info + work
experience + education + skills. If it is missing 2 or more
of these, is_resume = false.
```

---

## NON-RESUME DETECTION — COMPLETE LOGIC

```python
def validate_document(resume_text: str, page_count: int) -> dict:
    """
    Gate check before any scoring.
    Prevents scoring random documents as resumes.
    """

    word_count = len(resume_text.split())

    # Hard fail: too short
    if word_count < 50:
        return {
            "failed": True,
            "capped_score": 5,
            "reason": "Document is too short to be a resume (under 50 words)."
        }

    # Hard fail: 5+ pages
    if page_count >= 5:
        return {
            "failed": True,
            "capped_score": 35,
            "reason": (
                f"Document is {page_count} pages. A resume should be 1–2 pages. "
                "This appears to be a report, academic CV, or thesis. "
                "Please upload a concise resume."
            )
        }

    # Soft fail: 4 pages
    if page_count == 4:
        return {
            "failed": True,
            "capped_score": 40,
            "reason": (
                "Document is 4 pages. Resumes should be 1–2 pages maximum. "
                "Please trim to relevant experience only."
            )
        }

    # Claude gate check
    gate = claude_document_check(resume_text)

    if not gate["is_resume"]:
        doc_type = gate.get("document_type", "unknown")
        return {
            "failed": True,
            "capped_score": 20,
            "reason": (
                f"This document appears to be a {doc_type}, not a resume. "
                "ATS scoring requires a proper resume with contact info, "
                "work experience, education, and skills sections."
            )
        }

    # 3-page soft warning (don't fail, just flag)
    if page_count == 3:
        return {
            "failed": False,
            "warning": (
                "Resume is 3 pages. Consider trimming to 2 pages for "
                "better ATS performance. Signal density may be diluted."
            ),
            "page_penalty": 5   # applied to format score
        }

    return {"failed": False, "warning": None, "page_penalty": 0}
```

---

## ATS SCORE: WHAT THE USER SEES

### Student View
```
┌────────────────────────────────────────────────────────────┐
│  Your ATS Score: 74/100  🟡 Good Match                    │
├────────────────────────────────────────────────────────────┤
│  Score Breakdown:                                          │
│  Keywords    ██████████████████░░  22/30                   │
│  Skills      █████████████████░░░  20/25                   │
│  Experience  ████████████████████  18/20                   │
│  Format      ████████████░░░░░░░░  11/15                   │
│  Content     ████████░░░░░░░░░░░░   3/10  ← improve this! │
├────────────────────────────────────────────────────────────┤
│  ✅ Matched Keywords:                                      │
│     Python, FastAPI, PostgreSQL, Docker, REST API          │
│                                                            │
│  ❌ Missing Keywords:                                      │
│     Redis, Kubernetes, GraphQL                             │
│                                                            │
│  💪 Strengths:                                             │
│     • Strong Python + FastAPI experience (5 years)         │
│     • Exact job title match found                          │
│     • Education requirement fully met                      │
│                                                            │
│  ⚠️  Improvement Tips:                                     │
│     1. Add "Redis" to Skills — it appears 3x in the JD    │
│     2. Add numbers to your bullets ("led team of X",       │
│        "improved performance by X%")                       │
│     3. Include a Projects section                          │
└────────────────────────────────────────────────────────────┘
```

### Document Gate Failed View
```
┌────────────────────────────────────────────────────────────┐
│  ATS Score: 35/100  ⛔ Invalid Document                    │
├────────────────────────────────────────────────────────────┤
│  ⚠️  Issue Detected:                                       │
│                                                            │
│  Your document is 6 pages. A resume should be 1–2 pages.  │
│  This appears to be a report or academic document,         │
│  not a professional resume.                                │
│                                                            │
│  ATS systems at most companies only parse page 1–2.        │
│  Content on later pages is often missed entirely.          │
│                                                            │
│  What to do:                                               │
│  → Create a 1–2 page resume with your relevant experience  │
│  → Use standard sections: Summary, Experience,             │
│    Education, Skills                                       │
│  → Upload your new resume and re-scan                      │
└────────────────────────────────────────────────────────────┘
```

### HR Dashboard View
```
┌─────────────────────────────────────────────────────────────────┐
│ ATS Rankings — Senior Python Engineer (12 applicants)           │
├──────┬────────────────┬───────────┬────────────┬────────────────┤
│ Rank │ Candidate      │ ATS Score │ Status     │ Auto Action    │
├──────┼────────────────┼───────────┼────────────┼────────────────┤
│  1   │ John Doe       │  91/100   │ ✅ Strong  │ Auto-Advance   │
│  2   │ Priya R.       │  88/100   │ ✅ Strong  │ Auto-Advance   │
│  3   │ Amit K.        │  74/100   │ 🟡 Good    │ HR Review      │
│  4   │ Sara M.        │  66/100   │ 🟡 Good    │ HR Review      │
│  5   │ Tom L.         │  49/100   │ 🟠 Partial │ HR Decision    │
│  6   │ [Document]     │  35/100   │ ⛔ Invalid │ Not a Resume   │
├──────┴────────────────┴───────────┴────────────┴────────────────┤
│ Filter: [All] [Strong] [Good] [Partial] [Invalid]               │
│ Sort:   [Score ↓] [Date] [Name]                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## BACKEND FILES TO CREATE

```
app/services/ats_service.py
├── validate_document()       ← Stage 0 gate
├── parse_resume()            ← Stage 1 via Claude
├── parse_job_description()   ← Stage 2 via Claude
├── score_keywords()          ← Component 1
├── score_skills()            ← Component 2
├── score_experience()        ← Component 3
├── score_format()            ← Component 4
├── score_content_quality()   ← Component 5
└── calculate_ats_score()     ← Final assembly

app/api/routes/ats.py
├── POST /api/ats/screen       ← text input
├── POST /api/ats/upload       ← PDF upload
├── GET  /api/ats/results/{id} ← candidate history
├── GET  /api/ats/rankings/{job_id} ← sorted candidates
└── POST /api/ats/bulk-screen  ← multiple resumes
```

---

## ENVIRONMENT VARIABLES NEEDED

```env
CLAUDE_API_KEY=sk-ant-...     # already set — used for all Claude calls
# No extra keys needed for ATS scoring
```

---

## SUMMARY: KEY DESIGN DECISIONS

```
1. DOCUMENT GATE (our unique addition):
   5+ pages → capped at 35/100, clear error shown
   Not-a-resume → capped at 20/100, clear error shown
   This prevents nonsense files from polluting HR dashboard

2. HYBRID KEYWORD MATCHING:
   Exact match + Claude semantic match
   "Postgres" recognized as "PostgreSQL"
   "Led team" recognized as "Team leadership"

3. JOB TITLE IS KING:
   Based on Jobscan research (10.6x interview multiplier)
   Title match gets dedicated bonus points in both
   keyword AND skills components

4. KEYWORD STUFFING PENALTY:
   Modern 2026 ATS penalizes this
   We do too — detected by Claude, deducts from score

5. SIGNAL DENSITY OVER PAGE COUNT:
   Long resume with strong content > short resume with weak content
   But 5+ pages triggers gate (not a resume logic)
   3–4 pages get soft warnings + minor penalties

6. RECENCY WEIGHTING:
   Most recent 24 months of experience weighted higher
   Aligns with Workday + Greenhouse 2026 behavior

7. QUANTIFIED ACHIEVEMENTS:
   Bullets with numbers score significantly higher
   "Increased API response by 40%" > "Improved API performance"
```

---

*This is the complete ATS Scoring Engine v2.0 spec for NexHire.*
*Research sources: Jobscan 2026, Resume Optimizer Pro (4,200 resume study May 2026),*
*Resumly.ai cross-tool study 2025, CVCraft 2026 rules, NeuraCV, PassTheScan.*
*Hand this file to Antigravity as the single source of truth for ATS implementation.*
