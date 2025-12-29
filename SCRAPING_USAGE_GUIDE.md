# Complete Scraping Guide - GitHub API Integration

## 🎯 Overview

This guide shows you how to use the GitHub API-based scraping system to populate your database with GSoC organizations, repositories, and issues.

## 📋 Prerequisites

1. ✅ Organizations scraped from gsocorganizations.dev
2. ✅ `.env.local` with `GITHUB_TOKEN` configured
3. ✅ Database connected (Neon PostgreSQL)
4. ✅ Dev server running (`npm run dev`)

## 🚀 Quick Start - Run Everything

### Option 1: Full Pipeline (Automated)
Run the entire pipeline with one command:

```javascript
fetch('http://localhost:3000/api/scrape/all', {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)));
```

**⚠️ WARNING**: This will take 30-60 minutes and use ~5000-10000 GitHub API requests!

### Option 2: Step-by-Step (Recommended for Testing)

Run each step individually to monitor progress:

```javascript
// Step 1: Scrape organizations (DONE ✅)
// You already completed this!

// Step 2: Enhance organizations with GitHub URLs (5-10 minutes)
fetch('http://localhost:3000/api/scrape/organizations/enhance', {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => console.log('Enhance:', data));

// Wait for completion, then:

// Step 3: Scrape repositories (10-15 minutes)
fetch('http://localhost:3000/api/scrape/repositories', {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => console.log('Repositories:', data));

// Wait for completion, then:

// Step 4: Scrape issues (15-20 minutes)
fetch('http://localhost:3000/api/scrape/issues', {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => console.log('Issues:', data));

// Wait for completion, then:

// Step 5: Analyze comments (OPTIONAL - 20-30 minutes)
fetch('http://localhost:3000/api/scrape/comments', {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => console.log('Comments:', data));

// Wait for completion, then:

// Step 6: Calculate scores (1-2 minutes)
fetch('http://localhost:3000/api/scrape/analyze', {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => console.log('Analysis:', data));
```

## 📊 What Each Step Does

### Step 1: Scrape Organizations ✅
**Endpoint**: `POST /api/scrape/organizations`
**Already completed!**
- Scrapes ~195 GSoC organizations from gsocorganizations.dev
- Extracts: name, description, logo, technologies, years participated

### Step 2: Enhance Organizations
**Endpoint**: `POST /api/scrape/organizations/enhance`
**Time**: 5-10 minutes
**API Calls**: ~195 (web requests, not GitHub API)

```json
{
  "success": true,
  "stats": {
    "total": 195,
    "updated": 180,
    "failed": 15
  }
}
```

**What it does**:
- Visits each organization's detail page
- Extracts GitHub URL, website URL, ideas page URL
- Required for repository scraping!

### Step 3: Scrape Repositories
**Endpoint**: `POST /api/scrape/repositories`
**Time**: 10-15 minutes
**API Calls**: ~200-400 (GitHub API)

```json
{
  "success": true,
  "stats": {
    "organizations": 180,
    "totalRepos": 2500,
    "added": 2500,
    "updated": 0
  }
}
```

**What it does**:
- For each organization with GitHub URL
- Fetches all public repositories
- Filters: Active (pushed in last 6 months), not archived
- Stores: stars, forks, languages, topics, activity

**Filtering strategy**:
- Only repos pushed in last 6 months (ensures active projects)
- Excludes archived/disabled repos
- Sorts by most recently updated

### Step 4: Scrape Issues
**Endpoint**: `POST /api/scrape/issues`
**Time**: 15-20 minutes
**API Calls**: ~2000-3000 (GitHub API)

```json
{
  "success": true,
  "stats": {
    "repositories": 2500,
    "totalIssues": 15000,
    "added": 15000,
    "updated": 0
  }
}
```

**What it does**:
- For each repository
- Fetches open issues with target labels:
  - good-first-issue
  - help-wanted
  - beginner
  - gsoc
  - hacktoberfest
- Stores: title, body, labels, comments count, author

**Target labels** (automatically detected):
```javascript
[
  "good first issue",
  "good-first-issue",
  "help wanted",
  "help-wanted",
  "beginner",
  "beginner-friendly",
  "easy",
  "starter",
  "gsoc",
  "hacktoberfest",
  "first-timers-only",
  "up-for-grabs"
]
```

### Step 5: Analyze Comments (Optional)
**Endpoint**: `POST /api/scrape/comments`
**Time**: 20-30 minutes (LONGEST STEP)
**API Calls**: ~10000-15000 (GitHub API)

```json
{
  "success": true,
  "stats": {
    "issuesAnalyzed": 15000,
    "totalComments": 45000,
    "assignmentRequests": 5000
  }
}
```

**What it does**:
- For each issue with comments
- Fetches all comments
- Analyzes using regex patterns:
  - "can i work on this"
  - "assign me"
  - "i'd like to take this"
  - etc. (20+ patterns)
- Calculates **Jam Factor** (competition level)

**Jam Factor Scale**:
- 🟢 0-2: Low competition (Great opportunity!)
- 🟡 3-4: Moderate competition
- 🟠 5-7: High competition
- 🔴 8-10: Very high competition (crowded)

**⚠️ Note**: This step is OPTIONAL for initial testing. You can skip it and run analysis with default jam factor of 0.

### Step 6: Calculate Scores
**Endpoint**: `POST /api/scrape/analyze`
**Time**: 1-2 minutes
**API Calls**: 0 (local computation)

```json
{
  "success": true,
  "stats": {
    "analyzed": 15000,
    "averages": {
      "opportunityScore": 6.8,
      "jamFactor": 2.3,
      "freshnessScore": 7.5
    }
  }
}
```

**What it does**:
- Calculates **Opportunity Score** (0-10) using:
  - Jam Factor (25%) - Lower is better
  - Freshness (15%) - Recent issues score higher
  - Repo Activity (15%) - Active repos score higher
  - Org Longevity (20%) - More GSoC years = better
  - Maintainer Response (15%) - Faster response = better
  - Beginner Label (10%) - Bonus for beginner-friendly

**Opportunity Score Levels**:
- 8-10: Excellent opportunity (Highly recommended)
- 6-8: Good opportunity
- 4-6: Fair opportunity
- 0-4: Low opportunity

## 🎯 Recommended Testing Workflow

For your first test, do a **limited scrape**:

1. ✅ Organizations scraped (195 orgs)
2. Run enhance (get GitHub URLs)
3. **Modify repository scraper** to limit to 5 orgs (for testing)
4. Run repositories (should get ~50-100 repos)
5. Run issues (should get ~500-1000 issues)
6. **Skip comments** for now
7. Run analyze (instant, uses default jam factor)

### How to Limit Scraping for Testing

Edit `/api/scrape/repositories/route.ts`:
```typescript
// Line ~13, change:
const orgs = await db.query.organizations.findMany();

// To:
const orgs = await db.query.organizations.findMany({
  limit: 5 // Only process 5 organizations for testing
});
```

## 📈 Monitoring Progress

### Check Database
```bash
npm run db:studio
```
Opens Drizzle Studio to view tables in real-time

### Check Issues Page
Navigate to: `http://localhost:3000/issues`
- Should show issues with filters
- Should show opportunity scores and jam factors
- Should allow filtering by organization, difficulty, etc.

### Check Console Logs
The scrapers log detailed progress:
```
Fetching repos for Apache (apache)...
Found 45 active repos for Apache
Fetching issues for apache/kafka...
Found 12 target issues for apache/kafka
```

## ⚠️ Rate Limiting

### GitHub API Limits
- **Authenticated**: 5000 requests/hour
- **Check remaining**: https://api.github.com/rate_limit

### How We Handle It
- ✅ Automatic retry with exponential backoff
- ✅ Throttling plugin (waits when rate limit hit)
- ✅ Small delays between requests (100ms)
- ✅ Pagination support (100 items per page)

### If You Hit Rate Limit
The scraper will automatically:
1. Log a warning
2. Wait for rate limit reset
3. Retry up to 3 times
4. Continue from where it stopped

## 🐛 Troubleshooting

### "No organizations found"
Run: `POST /api/scrape/organizations` first

### "No repositories found"
Run: `POST /api/scrape/organizations/enhance` to get GitHub URLs

### "Failed to fetch GitHub data"
- Check `GITHUB_TOKEN` in `.env.local`
- Verify token has `public_repo` scope
- Check rate limit: https://api.github.com/rate_limit

### Database connection errors
- Verify `DATABASE_URL` in `.env.local`
- Test: `npm run db:studio`

## 🎉 Success Criteria

After running the full pipeline, you should have:

- ✅ ~195 organizations
- ✅ ~2000-3000 repositories
- ✅ ~10000-20000 issues
- ✅ Issues visible on `/issues` page
- ✅ Filters working (organization, difficulty, competition)
- ✅ Opportunity scores calculated
- ✅ Jam factors analyzed

## 🔄 Re-running Scrapers

All scrapers support **upserts** (update or insert):
- Running again will UPDATE existing data
- New items will be ADDED
- Nothing will be duplicated

**Recommended schedule**:
- Organizations: Weekly
- Repositories: Daily
- Issues: Every 6 hours
- Comments: Daily
- Analysis: After each issues scrape

## 📝 Next Steps

After successful scraping:
1. Test filters on `/issues` page
2. Verify opportunity scores make sense
3. Check jam factor indicators
4. Set up cron jobs for automatic updates (future feature)
5. Build contribution tracking features
6. Add bookmark functionality

Good luck! 🚀
