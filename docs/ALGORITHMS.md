# NexHire — Algorithms

---

## 1. Resume Scoring Algorithm

### Weighted Multi-Factor Scoring
```
final_score = (
    semantic_score    * 0.50 +   # Claude semantic analysis
    keyword_score     * 0.25 +   # keyword overlap
    experience_score  * 0.25     # years of experience match
)

recommendation:
    score >= 70 → "hire"
    score >= 50 → "maybe"
    score <  50 → "reject"
```

**Claude Prompt Strategy:**
- Send resume text + job description
- Ask for structured JSON output (score, strengths, gaps)
- Parse and store in PostgreSQL

---

## 2. Developer Portfolio Score Algorithm

### Multi-Platform Weighted Aggregation
```
github_score = (
    len(repos)          * 5   +
    total_stars         * 2   +
    language_diversity  * 10  +
    contributions_year  * 0.5
)

leetcode_score = (
    total_solved        * 2   +
    hard_solved         * 5   +
    contest_rating      * 0.1
)

codeforces_score = (
    problems_solved     * 1   +
    (cf_rating / 100)   * 10  +
    contests            * 2
)

portfolio_score = min(
    github_score     * 0.40 +
    leetcode_score   * 0.35 +
    codeforces_score * 0.25,
    1000  # max cap
)
```

---

## 3. Chatbot Conversation Algorithm

### Context-Aware Multi-Turn
```
1. Fetch last 5 messages (sliding window context)
2. Extract candidate profile (skills, experience from resume)
3. Build prompt:
   - System: "You are HR screening bot..."
   - Context: last 5 messages
   - Instruction: "Ask relevant follow-up"
4. Call Claude API (async)
5. Naive sentiment analysis:
   - Check for positive keywords → "positive"
   - Check for negative keywords → "negative"
   - Default → "neutral"
6. Store message + sentiment
7. Update candidate interview score
```

---

## 4. Performance Anomaly Detection

### Z-Score Based Detection
```
For each metric (attendance, rating):
    mean = average of last 6 months
    std  = standard deviation

    if current_value < (mean - 2 * std):
        flag = HIGH severity anomaly
    elif current_value < (mean - 1.5 * std):
        flag = MEDIUM severity anomaly
    else:
        flag = None

Trend detection:
    slope = linear_regression(monthly_values)
    if slope > +0.5:  trend = "improving"
    if slope < -0.5:  trend = "declining"
    else:             trend = "stable"
```

---

## 5. Payroll Recommendation Algorithm

### Rules-Based + AI Reasoning
```
perf_adjustment:
    rating >= 8.5 → +20%
    rating >= 7.5 → +10%
    rating >= 6.5 →   0%
    rating <  6.5 →  -5%

attendance_adjustment:
    attendance >= 95% → +5%
    attendance >= 90% → +2%
    attendance <  90% → -2%

productivity_adjustment:
    projects >= peer_avg * 1.2 → +10%
    projects >= peer_avg       →  +5%
    projects <  peer_avg       →   0%

tenure_adjustment:
    tenure >= 3 years → +5%
    tenure >= 1 year  → +2%
    tenure <  1 year  →  0%

total = (
    perf_adjustment        * 0.40 +
    attendance_adjustment  * 0.20 +
    productivity_adjustment* 0.25 +
    tenure_adjustment      * 0.15
)

cap: recommended_salary <= market_rate * 1.1

Claude generates: human-readable reasoning for adjustment
```

---

## 6. Candidate Ranking Algorithm

### For HR: Sort candidates by composite score
```
composite_score = (
    resume_score      * 0.45 +
    portfolio_score   * 0.30 +   # from GitHub/LeetCode
    interview_score   * 0.25     # from chatbot sentiment
)

Sort descending → top candidates float to top
Filter by: status, score threshold, date
```

---

## 7. Rate Limiting Algorithm

### Token Bucket (Redis)
```
On each request:
    key = "rate:{user_id}"
    current = Redis.GET(key)

    if current >= limit:
        return 429 Too Many Requests
    else:
        Redis.INCR(key)
        Redis.EXPIRE(key, 60)  # reset every 60 seconds
        proceed with request
```

---

## 8. Social Profile Sync Scheduler

### Exponential Backoff on Failure
```
attempt = 1
while attempt <= max_retries:
    try:
        fetch_platform_data()
        break
    except RateLimitError:
        wait = min(2^attempt * base_delay, max_delay)
        sleep(wait)
        attempt += 1
    except NetworkError:
        wait = 2^attempt * base_delay
        sleep(wait)
        attempt += 1

Schedule: every 6 hours per user (Redis TTL-based)
```
