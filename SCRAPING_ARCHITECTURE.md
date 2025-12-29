# Scraping Architecture & Implementation Plan

## Overview: Why GitHub API > Web Scraping

**Traditional Scraping Problems:**
- Brittle (breaks when HTML changes)
- Rate limiting issues
- No structured data
- Ethical/legal concerns
- Slow and resource-intensive

**GitHub API Advantages:**
- ✅ Official, structured JSON data
- ✅ Pagination support (up to 5000 req/hour authenticated)
- ✅ Real-time, accurate data
- ✅ Built-in rate limiting handling
- ✅ No parsing needed

---

## Complete Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SCRAPING PIPELINE                         │
└─────────────────────────────────────────────────────────────┘

Step 1: Scrape Organizations (MANUAL TRIGGER)
├─ Source: https://www.gsocorganizations.dev/
├─ Method: Cheerio HTML parsing (one-time scrape)
├─ Stores: Organization name, GitHub URL, description, tech
└─ API: POST /api/scrape/organizations
   └─ Output: ~200 orgs → organizations table

                    ↓

Step 2: Fetch Repositories (GITHUB API)
├─ For each organization → extract GitHub org name from URL
├─ GitHub API: GET /orgs/{org}/repos (paginated)
├─ Filter: Active repos (not archived, pushed in last 6 months)
├─ Fetch: Stars, forks, languages, topics, last_push
└─ API: POST /api/scrape/repositories
   └─ Output: ~2000-5000 repos → repositories table

                    ↓

Step 3: Fetch Issues (GITHUB API)
├─ For each repository → fetch open issues
├─ GitHub API: GET /repos/{owner}/{repo}/issues
├─ Filter: Issues with target labels (good-first-issue, etc.)
├─ Fetch: Title, body, labels, comments_count, created_at
└─ API: POST /api/scrape/issues
   └─ Output: ~10,000-50,000 issues → issues table

                    ↓

Step 4: Fetch Comments (GITHUB API)
├─ For each issue → fetch all comments
├─ GitHub API: GET /repos/{owner}/{repo}/issues/{number}/comments
├─ Analyze: Check for assignment request patterns
└─ API: POST /api/scrape/comments
   └─ Output: Comments → issue_comments table

                    ↓

Step 5: Analyze & Score (LOCAL COMPUTATION)
├─ Jam Factor: Count assignment requests in comments
├─ Freshness Score: Based on issue creation date
├─ Repo Activity: Last push + commits + stars
├─ Opportunity Score: Weighted composite score
└─ API: POST /api/scrape/analyze
   └─ Output: Updates issues with scores
```

---

## API Rate Limiting Strategy

### GitHub API Limits
- **Authenticated**: 5000 requests/hour
- **Unauthenticated**: 60 requests/hour (DON'T USE)

### Smart Rate Management
```
1. Use Personal Access Token (PAT) for authentication
2. Octokit throttling plugin (already configured)
3. Batch processing with delays
4. Incremental updates (only changed data)
5. Redis caching to avoid redundant API calls
```

### Estimated API Usage (Full Scrape)
```
Organizations:    ~200 orgs × 1 req  = 200 requests
Repositories:     ~200 orgs × 10 req = 2,000 requests
Issues:           ~2000 repos × 1 req = 2,000 requests
Comments:         ~10,000 issues × 1 req = 10,000 requests (if needed)
                                    TOTAL: ~14,200 requests
```
**Time Required**: ~3-4 hours (to stay under rate limit)

---

## Implementation Plan

### ✅ Already Built
- [x] Database schema (organizations, repositories, issues, issue_comments)
- [x] GitHub client with throttling & retry (`src/lib/github/client.ts`)
- [x] Jam factor analyzer (`workers/src/analyzers/jam-factor.ts`)
- [x] Opportunity score calculator (`workers/src/analyzers/opportunity-score.ts`)
- [x] Organization scraper (`/api/scrape/organizations`)
- [x] UI components (filters, cards, etc.)

### 🔨 Need to Build

#### 1. Repository Scraper API Route
**File**: `src/app/api/scrape/repositories/route.ts`
**Purpose**: Fetch all repos from GitHub for each organization
**Logic**:
```typescript
1. Fetch all orgs from DB
2. For each org:
   - Extract GitHub org name from github_url
   - Call GitHub API: GET /orgs/{org}/repos
   - Filter: not archived, pushed in last 6 months
   - Upsert into repositories table
3. Return stats: added, updated, skipped
```

#### 2. Issues Scraper API Route
**File**: `src/app/api/scrape/issues/route.ts`
**Purpose**: Fetch open issues with target labels
**Logic**:
```typescript
1. Fetch all repos from DB
2. For each repo:
   - Call GitHub API: GET /repos/{owner}/{repo}/issues
   - Filter: state=open, has target labels
   - Upsert into issues table
3. Return stats: added, updated, closed
```

#### 3. Comments Scraper API Route
**File**: `src/app/api/scrape/comments/route.ts`
**Purpose**: Fetch issue comments for jam factor analysis
**Logic**:
```typescript
1. Fetch all issues from DB (or filter by needs_analysis)
2. For each issue:
   - Call GitHub API: GET /repos/{owner}/{repo}/issues/{number}/comments
   - Store in issue_comments table
   - Mark comment as assignment_request if matches patterns
3. Return stats: total comments, assignment requests
```

#### 4. Analysis API Route
**File**: `src/app/api/scrape/analyze/route.ts`
**Purpose**: Calculate all scores for issues
**Logic**:
```typescript
1. Fetch all issues with their comments, repo, and org data
2. For each issue:
   - Calculate jam factor (from comments)
   - Calculate freshness score (from created_at)
   - Calculate repo activity score
   - Calculate opportunity score (weighted composite)
   - Update issues table with all scores
3. Return stats: analyzed count, avg scores
```

#### 5. Master Scraper API Route
**File**: `src/app/api/scrape/all/route.ts`
**Purpose**: Run entire pipeline in sequence
**Logic**:
```typescript
1. POST /api/scrape/organizations
2. Wait 30 seconds
3. POST /api/scrape/repositories
4. Wait 30 seconds
5. POST /api/scrape/issues
6. Wait 30 seconds
7. POST /api/scrape/comments (optional, can be separate)
8. POST /api/scrape/analyze
9. Return complete stats
```

#### 6. Admin UI for Scraping
**File**: `src/app/admin/scrape/page.tsx`
**Purpose**: Manual trigger interface for admins
**Features**:
- Buttons to trigger each scraper
- Real-time progress display
- Stats dashboard
- Last scrape timestamp
- Error logs

---

## Optimization Strategies

### 1. Incremental Updates
```typescript
// Only fetch repos updated since last scrape
const lastScraped = await getLastScrapeTime('repositories');
const repos = await octokit.repos.listForOrg({
  org: 'apache',
  since: lastScraped.toISOString()
});
```

### 2. Parallel Processing (with rate limit respect)
```typescript
// Process 5 repos concurrently (not sequentially)
const chunks = chunkArray(repos, 5);
for (const chunk of chunks) {
  await Promise.all(chunk.map(repo => scrapeIssues(repo)));
  await sleep(1000); // Rate limit protection
}
```

### 3. Redis Caching
```typescript
// Cache org repos list for 24 hours
const cacheKey = `org:${orgName}:repos`;
let repos = await redis.get(cacheKey);
if (!repos) {
  repos = await fetchOrgRepos(octokit, orgName);
  await redis.set(cacheKey, repos, { ex: 86400 });
}
```

### 4. Selective Scraping
```typescript
// Only scrape issues from active repos (pushed in last 3 months)
const activeRepos = repos.filter(repo => {
  const daysSincePush = (Date.now() - repo.pushed_at) / (1000*60*60*24);
  return daysSincePush < 90;
});
```

---

## Scraping Schedule (Production)

### Daily (via Cron)
- ✅ **Organizations scrape**: 1x per day (low priority)
- ✅ **Repositories scrape**: 1x per day
- ✅ **Issues scrape**: 2x per day (morning, evening)

### Real-time (on-demand)
- ❌ **Comments scrape**: Only when user views issue detail
- ❌ **Analysis**: Run after issues scrape completes

### Why not real-time for everything?
- **Cost**: 14K+ API calls per full scrape
- **Speed**: Takes 3-4 hours
- **Need**: Data doesn't change that fast
- **Solution**: Cache + scheduled updates

---

## Environment Variables Needed

```bash
# .env.local
DATABASE_URL=postgresql://...  # Neon PostgreSQL
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx  # Personal Access Token
REDIS_URL=redis://...           # Upstash Redis (optional, for caching)
NEXTAUTH_SECRET=xxxxxxxxx       # For auth
NEXTAUTH_URL=http://localhost:3000
```

### How to get GITHUB_TOKEN:
1. Go to GitHub → Settings → Developer Settings
2. Personal Access Tokens → Generate new token (classic)
3. Scopes needed: `public_repo`, `read:org`
4. Copy token and add to `.env.local`

---

## Testing the Pipeline (Step by Step)

```bash
# 1. Scrape organizations (should take ~30 seconds)
curl -X POST http://localhost:3000/api/scrape/organizations

# 2. Scrape repositories (should take ~5-10 minutes for all orgs)
curl -X POST http://localhost:3000/api/scrape/repositories

# 3. Scrape issues (should take ~10-20 minutes)
curl -X POST http://localhost:3000/api/scrape/issues

# 4. Scrape comments (OPTIONAL - takes longest, 1-2 hours)
curl -X POST http://localhost:3000/api/scrape/comments

# 5. Analyze all issues (local computation, ~1 minute)
curl -X POST http://localhost:3000/api/scrape/analyze

# OR run everything at once
curl -X POST http://localhost:3000/api/scrape/all
```

---

## Next Steps

1. **Set up environment** (.env with DATABASE_URL + GITHUB_TOKEN)
2. **Build repository scraper** (`/api/scrape/repositories`)
3. **Build issues scraper** (`/api/scrape/issues`)
4. **Build analysis route** (`/api/scrape/analyze`)
5. **Build master scraper** (`/api/scrape/all`)
6. **Test with small dataset** (1-2 orgs first)
7. **Scale to full dataset**
8. **Add admin UI** for monitoring

Would you like me to start implementing these scrapers?
