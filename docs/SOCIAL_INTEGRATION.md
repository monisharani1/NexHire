# NexHire — Social Platform Integration

---

## Overview

NexHire integrates with the following platforms to build a unified developer portfolio:

| Platform | Method | Auth | Data |
|----------|--------|------|------|
| GitHub | OAuth 2.0 (official) | OAuth token | Repos, stars, languages, contributions |
| LeetCode | GraphQL API (unofficial) | Username only | Problems solved, rating, contests |
| CodeForces | REST API (public) | Handle only | Rating, rank, problems, contests |
| LinkedIn | OAuth 2.0 | OAuth token | Profile, experience, skills |

---

## GitHub Integration

### OAuth Flow
```
1. User clicks "Connect GitHub"
2. Redirect → https://github.com/login/oauth/authorize
   params: client_id, redirect_uri, scope=read:user,repo
3. User authorizes → GitHub redirects back with ?code=xxx
4. Exchange code for access token
   POST https://github.com/login/oauth/access_token
5. Use token to fetch profile + repos
6. Store in social_profiles table (JSONB)
```

### Data Fetched
```
GET https://api.github.com/user
→ login, avatar_url, bio, public_repos, followers, following

GET https://api.github.com/user/repos
→ name, description, stargazers_count, language, html_url, updated_at

GET https://api.github.com/users/{username}/events
→ contribution activity
```

### Score Calculation
```python
github_score = (
    len(repos)          * 5   +   # 5 pts per repo
    total_stars         * 2   +   # 2 pts per star
    language_diversity  * 10  +   # 10 pts per unique language
    contributions_year  * 0.5     # 0.5 pts per contribution
)
```

### Environment Variables Required
```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback
```

### Setup Steps
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill:
   - Application name: NexHire
   - Homepage URL: http://localhost:5173
   - Callback URL: http://localhost:8000/auth/github/callback
4. Copy Client ID + Client Secret → paste into .env

---

## LeetCode Integration

### Method: GraphQL API (Unofficial but reliable)
```
Endpoint: https://leetcode.com/graphql
No OAuth needed — username based
```

### GraphQL Query
```graphql
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    profile {
      userAvatar
      realName
      aboutMe
      skillTags
    }
    submitStats {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
    }
  }
}
```

### Data Fetched
```
total_solved     → total accepted problems
easy_solved      → easy problems solved
medium_solved    → medium problems solved
hard_solved      → hard problems solved
contest_rating   → contest ranking rating
skill_tags       → self-reported skills
```

### Score Calculation
```python
leetcode_score = (
    total_solved  * 2  +   # 2 pts per solved problem
    hard_solved   * 5  +   # 5 pts per hard problem
    contest_rating * 0.1   # 0.1 pts per rating point
)
```

### Sync Strategy
- User provides LeetCode username
- No OAuth — just username lookup
- Sync every 6 hours (Redis TTL)
- Exponential backoff on rate limit

---

## CodeForces Integration

### Method: Official Public REST API
```
Base URL: https://codeforces.com/api
No auth required for public data
```

### Endpoints Used
```
GET /user.info?handles={handle}
→ handle, rating, rank, maxRating, maxRank, avatar, country

GET /user.submissions?handle={handle}
→ all submissions (filter by verdict=OK for accepted)

GET /user.rating?handle={handle}
→ contest rating history
```

### Data Fetched
```
current_rating      → current Codeforces rating
max_rating          → all-time highest rating
rank                → "pupil", "specialist", "expert", "master", etc.
problems_solved     → count of unique accepted problems
contests_participated → number of contests entered
```

### Score Calculation
```python
codeforces_score = (
    problems_solved     * 1   +   # 1 pt per solved problem
    (cf_rating / 100)   * 10  +   # 10 pts per 100 rating
    contests            * 2       # 2 pts per contest
)
```

### Rank Color Mapping (for UI badges)
```
rating < 1200      → Gray    (Newbie)
1200 ≤ rating < 1400 → Green  (Pupil)
1400 ≤ rating < 1600 → Cyan   (Specialist)
1600 ≤ rating < 1900 → Blue   (Expert)
1900 ≤ rating < 2100 → Purple (Candidate Master)
2100 ≤ rating < 2300 → Orange (Master)
rating ≥ 2300      → Red    (Grandmaster+)
```

---

## LinkedIn Integration

### Method: OAuth 2.0 (Official API)
```
Requires LinkedIn Developer App approval
Scope: r_liteprofile, r_emailaddress, w_member_social
```

### Data Fetched
```
name, headline, profile picture
current position, company
education history
skills list
```

### Note
LinkedIn API is restrictive. For hackathon:
- Use OAuth for basic profile
- Don't rely on it for scoring
- Show as "optional enrichment"

---

## Portfolio Score Aggregation

### Combined Developer Score (0–1000)
```python
portfolio_score = min(
    github_score     * 0.40 +   # 40% weight
    leetcode_score   * 0.35 +   # 35% weight
    codeforces_score * 0.25,    # 25% weight
    1000                        # max cap
)
```

### Achievement Badges
```
GitHub:
  "Prolific Developer"    → public_repos > 50
  "Popular Projects"      → total_stars > 1000
  "Polyglot"              → unique_languages > 5
  "Open Source Hero"      → contributions_year > 500

LeetCode:
  "Problem Solver"        → total_solved > 100
  "LeetCode Knight"       → total_solved > 300
  "LeetCode Master"       → total_solved > 500
  "Hard Hitter"           → hard_solved > 100

CodeForces:
  "Competitive Coder"     → contests > 10
  "Rising Star"           → rating > 1400
  "Expert Coder"          → rating > 1600
  "Master Programmer"     → rating > 2100
```

---

## Sync Strategy

### Schedule
```
On connect       → Immediate sync
Every 6 hours    → Background sync (Redis TTL-based)
Manual trigger   → User can force sync (max 1/hour)
```

### Rate Limit Handling
```python
# Exponential backoff
attempt = 1
max_retries = 3
base_delay = 2  # seconds

while attempt <= max_retries:
    try:
        fetch_data()
        break
    except RateLimitError:
        wait = min(2**attempt * base_delay, 60)
        sleep(wait)
        attempt += 1
```

### Caching
```
Redis key: social_cache:{user_id}:{platform}
TTL: 6 hours (21600 seconds)
On cache hit → return cached data (fast)
On cache miss → fetch fresh + update cache
```

---

## API Endpoints

```
POST /api/social/connect           Connect a platform (provide username)
GET  /api/social/portfolio/{id}    Get full aggregated portfolio
GET  /api/social/sync/{platform}   Trigger manual sync
DELETE /api/social/{platform}      Disconnect a platform

GET  /auth/github                  Start GitHub OAuth flow
GET  /auth/github/callback         GitHub OAuth callback
```

---

## Frontend Display

### Portfolio Page Sections
```
1. Developer Score card (big number, 0-1000)
2. Achievement badges (grid)
3. GitHub section:
   - Stats: repos, stars, followers
   - Languages bar chart
   - Top 5 repos (name, stars, description, link)
4. LeetCode section:
   - Donut chart: easy/medium/hard
   - Total solved count
   - Contest rating
5. CodeForces section:
   - Current rating + rank badge
   - Problems solved
   - Contests participated
6. Sync status (last synced: X hours ago)
7. Connect buttons for unconnected platforms
```
