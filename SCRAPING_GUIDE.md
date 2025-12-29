# Quick Start: Scraping Organizations

## ✅ What's Fixed
- Fixed SelectItem empty string errors on both Issues and Organizations pages
- All filter components now use `value="all"` instead of `value=""`

## 🚀 How to Scrape Organizations

Since the organization scraper is already built, you just need to trigger it:

### Step 1: Make sure your dev server is running
```bash
npm run dev
```

### Step 2: Trigger the organization scraper

**Option A: Using curl**
```bash
curl -X POST http://localhost:3000/api/scrape/organizations
```

**Option B: Using your browser**
Open your browser's console and run:
```javascript
fetch('http://localhost:3000/api/scrape/organizations', {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => console.log(data));
```

**Option C: Create a simple page to trigger it**
Navigate to `http://localhost:3000/api/scrape/organizations` in a REST client like Postman or Thunder Client

### Expected Output
```json
{
  "success": true,
  "message": "Scraped X organizations. Added: Y, Updated: Z",
  "stats": {
    "total": X,
    "added": Y,
    "updated": Z
  }
}
```

## 📊 Verify the Data

After scraping, check your database:

### Using Drizzle Studio (Recommended)
```bash
npm run db:studio
```
Then open `https://local.drizzle.studio` and check the `organizations` table

### Or navigate to the organizations page
Go to `http://localhost:3000/organizations` - you should see the scraped organizations!

## 🔍 What Gets Scraped

From `https://www.gsocorganizations.dev/`:
- Organization name
- Description
- GitHub URL
- Website URL
- Technologies (as tags)
- Years participated in GSoC
- Longevity badge (veteran/experienced/newcomer)

## ⚠️ Troubleshooting

### "Failed to fetch" error
- Make sure your dev server is running on port 3000
- Check that there are no firewall/network issues

### "No organizations scraped"
- The target website might have changed its HTML structure
- Check the console for specific error messages
- May need to adjust selectors in `/api/scrape/organizations/route.ts`

### Database connection errors
- Verify `DATABASE_URL` in `.env.local` is correct
- Test connection: `npm run db:studio`

## 🎯 Next Steps

After successfully scraping organizations:
1. ✅ Fix SelectItem issues (DONE)
2. ✅ Scrape organizations (YOU ARE HERE)
3. ⏭️ Build repository scraper
4. ⏭️ Build issues scraper
5. ⏭️ Build analysis pipeline

See `SCRAPING_ARCHITECTURE.md` for the full implementation plan.
