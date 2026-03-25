# 🔒 SnackGuard Pro

A comprehensive snack protection system that uses AI-powered image analysis to detect unauthorized consumption.

## Features

### 📊 Core Functionality
- **Photo-based tracking**: Take photos of your snacks for visual comparison
- **Weight monitoring**: Track exact weight changes over time
- **AI image analysis**: Cloudflare AI compares images and identifies differences
- **Dual action modes**: 
  - **Audit**: Check for theft with weight + photo analysis
  - **Snack Taken**: Log your own consumption

### 🕵️ Theft Detection
- Configurable weight thresholds
- Expected consumption rate tracking
- Automatic suspicious activity alerts
- Visual difference highlighting
- Evidence preservation (before/after photos)

### 👥 Person Tracking
- Suspect marking with confidence levels (Low/Medium/High)
- Theft leaderboard by total amount stolen
- Detailed incident history per person
- Evidence photos for each incident
- Record reset functionality

### 📈 Advanced Features
- **Multiple snack tracking**: Monitor different snacks/locations
- **Timeline history**: See all weight changes and audits
- **False positive handling**: Mark incidents as "actually me"
- **Snack profiles**: Name, location, purchase date, initial photo
- **Quick check mode**: Fast audit workflow
- **Offline queue**: Actions saved when offline
- **Data export**: JSON backup of all data
- **Confidence scoring**: Rate evidence quality

### ⚙️ Settings
- Adjustable weight threshold
- Expected daily consumption rate
- Notification preferences
- Photo evidence saving toggle
- Camera quality settings
- Cloudflare Worker URL configuration

## Setup Instructions

### 1. Cloudflare Worker Deployment

#### Prerequisites
- Cloudflare account (free tier works)
- Node.js and npm installed
- Wrangler CLI installed: `npm install -g wrangler`

#### Steps

1. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

2. **Create a new Workers AI project**
   ```bash
   mkdir snackguard-worker
   cd snackguard-worker
   ```

3. **Copy the files**
   - Copy `cloudflare-worker.js` to this directory
   - Copy `wrangler.toml` to this directory

4. **Enable Workers AI**
   - Go to Cloudflare Dashboard → Workers & Pages → AI
   - Enable Workers AI (free tier includes 10,000 requests/day)

5. **Deploy the worker**
   ```bash
   wrangler deploy
   ```

6. **Get your Worker URL**
   After deployment, you'll see a URL like:
   ```
   https://snackguard-worker.YOUR-SUBDOMAIN.workers.dev
   ```

### 2. Mobile App Setup

#### Option A: Direct File Access
1. Open `snackguard.html` in a text editor
2. Save it to your phone (via AirDrop, email, cloud storage, etc.)
3. Open the file in your mobile browser (Safari, Chrome, etc.)
4. Add to home screen for app-like experience:
   - **iOS**: Share → Add to Home Screen
   - **Android**: Menu → Add to Home Screen

#### Option B: Host on GitHub Pages (Recommended)
1. Create a new GitHub repository
2. Upload `snackguard.html` and rename it to `index.html`
3. Go to Settings → Pages → Enable GitHub Pages from main branch
4. Access via: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME`

#### Option C: Use a local server
```bash
# Python 3
python -m http.server 8000

# Then access on your phone at: http://YOUR-COMPUTER-IP:8000/snackguard.html
```

### 3. Configure the App

1. Open SnackGuard on your phone
2. Go to **Settings** tab
3. Paste your Cloudflare Worker URL in the "Worker URL" field
4. Configure detection settings:
   - **Weight Threshold**: Minimum grams for theft alert (default: 50g)
   - **Expected Daily Consumption**: Your normal eating rate (default: 30g/day)
5. Tap "Save Settings"

## How to Use

### Adding a Snack
1. Go to **Dashboard** or **Snacks** tab
2. Tap "➕ Add New Snack"
3. Enter snack name, initial weight, and location
4. Optionally take an initial photo
5. Tap "Add Snack"

### Performing an Audit
1. Select a snack from the Dashboard
2. Tap "🔍 Audit"
3. Enter current weight (use a kitchen scale)
4. Optionally take a new photo
5. Tap "🔍 Audit"
6. Review AI analysis results
7. If theft detected, mark the suspect

### Logging Your Own Consumption
1. Select a snack
2. Tap "✅ I ate some"
3. Enter new weight after eating
4. Optionally update photo
5. Tap "✅ Confirm"

### Marking a Suspect
1. After a suspicious audit, the suspect modal will auto-open
2. Select the person from the dropdown
3. Choose confidence level:
   - **Low**: Circumstantial evidence
   - **Medium**: Likely culprit
   - **High**: Caught red-handed
4. Add optional notes
5. Tap "🎯 Mark Suspect"

### Viewing the Leaderboard
1. Go to **People** tab
2. See suspects ranked by total amount stolen
3. Tap any person to view detailed incident history
4. Review evidence photos for each incident

## Technical Details

### Data Storage
- All data stored in browser localStorage
- No server-side storage required (except Worker for AI)
- Data persists across sessions
- Export functionality for backups

### Image Analysis
The Cloudflare Worker uses:
1. **LLaVA 1.5 7B** vision model to describe each image
2. **Llama 2 7B** language model to compare descriptions
3. Identifies differences in:
   - Food quantity/amount
   - Packaging condition (wrinkles, tears)
   - Clip/seal positions
   - Signs of tampering

### Privacy & Security
- Photos stored locally in browser (base64 encoded)
- Only sent to your Cloudflare Worker for analysis
- No third-party data sharing
- No tracking or analytics
- Cloudflare AI doesn't store your images

### Performance
- Offline-first design
- Queued actions when offline
- Compressed image uploads
- Efficient localStorage usage
- ~5-10 second analysis time

## Cloudflare Workers AI Pricing

**Free Tier:**
- 10,000 AI requests per day
- Sufficient for ~100-200 audits/day
- No credit card required

**Paid Tier:**
- $0.011 per 1,000 requests
- Scales automatically

## Troubleshooting

### Camera won't open
- Grant camera permissions in browser settings
- Try a different browser (Chrome recommended)
- Ensure HTTPS or localhost (HTTP doesn't work)

### AI analysis fails
- Check Worker URL is correct
- Verify Workers AI is enabled in Cloudflare
- Check Cloudflare dashboard for errors
- Try the pixel-based fallback (still works without AI)

### Photos not saving
- Check available storage space
- Try lower image quality in settings
- Clear old data/export and reset

### Worker deployment fails
```bash
# Ensure you're logged in
wrangler login

# Check wrangler version
wrangler --version

# Update wrangler
npm update -g wrangler
```

## Advanced Customization

### Adjusting Detection Sensitivity
Edit in Settings:
- **Weight Threshold**: Lower = more sensitive (more alerts)
- **Daily Consumption**: Set to your actual eating habits

### Custom Confidence Levels
Edit in code (line ~660):
```javascript
<select id="confidence-level">
    <option value="low">Low - Circumstantial</option>
    <option value="medium" selected>Medium - Likely</option>
    <option value="high">High - Caught Red-Handed</option>
    <option value="absolute">Absolute - Video Evidence</option>
</select>
```

### Adding More People Quickly
You can import JSON:
```javascript
// In browser console:
const newPeople = [
  {id: Date.now().toString(), name: "Alice", incidents: [], totalAmount: 0},
  {id: (Date.now()+1).toString(), name: "Bob", incidents: [], totalAmount: 0}
];
people.push(...newPeople);
localStorage.setItem('people', JSON.stringify(people));
```

## Data Format

### Export Structure
```json
{
  "snacks": [...],
  "people": [...],
  "history": [...],
  "settings": {...},
  "exportDate": "2024-01-01T00:00:00.000Z"
}
```

### Snack Object
```json
{
  "id": "1234567890",
  "name": "Doritos",
  "currentWeight": 200,
  "initialWeight": 250,
  "location": "Desk drawer",
  "photo": "data:image/jpeg;base64,...",
  "status": "safe",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastChecked": "2024-01-01T12:00:00.000Z",
  "expectedConsumptionRate": 30
}
```

## FAQ

**Q: Can I use this without the AI?**
A: Yes! The app works fine with just weight tracking. AI analysis is optional.

**Q: Does this work offline?**
A: Yes for tracking. No for AI analysis (needs internet for Cloudflare Worker).

**Q: Can multiple people use the same app?**
A: Not simultaneously. Each phone/browser has its own data. But you can export/import data.

**Q: How accurate is the AI?**
A: Pretty good for obvious changes (bag wrinkles, clip position). Weight is still the primary metric.

**Q: Can I reset someone's record if they paid me back?**
A: Yes! Go to People → tap person → Reset Record

**Q: What if I accidentally mark the wrong person?**
A: Currently you need to reset their record and re-mark correctly. (Feature TODO: edit incidents)

## Credits

Built with:
- Vanilla JavaScript (no frameworks!)
- Cloudflare Workers AI
- LLaVA 1.5 vision model
- Llama 2 language model
- localStorage API
- Camera API

## License

MIT License - Free to use and modify!

---

**Protect your snacks. Catch the culprits. Stay snack-safe! 🔒🍿**
