# Music Agent - Your Personal Music Catalogue Dashboard

---

## 📖 Page 1: Daily Use - Quick Start

### How to Start Music Agent (Every Time)

**You need 2 Terminal windows + 1 Browser tab**

#### Terminal Window 1 - Backend
Copy and paste this command, then press Enter:
```bash
cd ~/Documents/music-agent-mvp/file-handler && node server.js
```
✅ You should see: `Server running on http://localhost:3001`  
⚠️ Keep this window open!

#### Terminal Window 2 - Frontend
Copy and paste this command, then press Enter:
```bash
cd ~/Documents/music-agent-mvp/frontend && npm run dev
```
✅ You should see: `Ready on http://localhost:3000`  
⚠️ Keep this window open!

#### Browser
Open Chrome or Safari and go to:
```
http://localhost:3000
```

**You're in!** 🎉

---

### How to Stop Music Agent

Close both Terminal windows (or press `Ctrl+C` in each).

---

### 💬 Give Feedback Anytime

See the blue **💬 Feedback** button in the top-right corner? Click it to:
- Report bugs
- Suggest features
- Share what's working or what's confusing

All feedback goes to our shared Google Sheet so we can improve together.

---

## 📖 Page 2: What Music Agent Does

### ✅ What Works Today

**Your Personal Music Catalogue**
- Upload tracks with artwork, metadata (BPM, key, genre), and audio files
- Store stems, contracts, press materials - everything in one place
- Visual grid view with artwork thumbnails
- Track both unreleased demos and signed tracks

**Label Submission Tracker**
- Record which labels you've pitched to
- Track submission dates and responses (Pending, Rejected, Signed)
- Add notes on each submission
- Never lose track of where you sent what

**Platform Distribution Manager**
- Monitor release schedules across Spotify, Beatport, SoundCloud, etc.
- Store platform URLs and release notes
- See what's live and what's scheduled

**Label Deal Hub** *(for signed tracks)*
- Manage all label contacts (A&R, managers, booking agents)
- Upload and organize contracts
- Track communication history
- CRM-ready contact data

**Built-in Feedback System**
- Click the **💬 Feedback** button on any page
- Submit bugs, ideas, or praise instantly
- Shared Google Sheet tracks all feedback

---

### 🚀 Coming Next (1-3 Months)

**Phase 1: Better Organization** *(2-3 weeks)*
- Search bar to find tracks by title, artist, or label
- Filter and sort your catalogue
- Keyboard shortcuts (Esc to close, Ctrl+N for new upload, etc.)

**Phase 2: Bulk Operations** *(3-4 weeks)*
- Select multiple tracks at once
- Bulk delete or export
- Mass metadata updates

**Phase 3: Full CRM System** *(1-2 months)*
- **Contacts Dashboard**: See all label contacts in one view, filter by role or label
- **Relationship Tracking**: Track pitch-to-signed conversion rates per label
- **Pipeline Kanban**: Drag tracks through stages (Target Labels → Pitch → Submitted → In Discussion → Signed → Released)
- **Follow-up System**: Set reminders, flag stale submissions (>30 days no response)
- **Analytics**: Conversion rates, average response times, best-performing labels

---

## 📖 Page 3: Initial Setup Guide

### Prerequisites
- MacBook (any recent macOS)
- 15-20 minutes
- GitHub account (we'll create one in Step 1)

---

### Step 1: Create GitHub Account (2 minutes)

1. Go to: https://github.com/signup
2. Enter email, create password, choose username
3. Verify email
4. **Tell me your username** so I can give you access

---

### Step 2: Install GitHub Desktop (3 minutes)

1. Go to: https://desktop.github.com
2. Download for macOS
3. Open the file, drag to Applications
4. Open GitHub Desktop and sign in

---

### Step 3: Clone the Code (2 minutes)

1. I'll send you a repository link
2. In GitHub Desktop: **File → Clone Repository**
3. Find **"music-agent-mvp"**
4. Save location: Choose **Documents**
5. Click **Clone**

---

### Step 4: Install Node.js (5 minutes)

1. Go to: https://nodejs.org
2. Click the green **"Download Node.js (LTS)"** button
3. Open the installer, click through (Continue → Install)
4. Enter Mac password when prompted

**Verify it worked:**
- Open **Terminal** (Applications → Utilities → Terminal)
- Paste this and press Enter:
  ```bash
  node --version
  ```
- Should show: `v20.x.x` (exact number doesn't matter)

---

### Step 5: Install Dependencies (3 minutes)

**Backend:**
```bash
cd ~/Documents/music-agent-mvp/file-handler && npm install
```

**Frontend:**
```bash
cd ~/Documents/music-agent-mvp/frontend && npm install
```

Wait for scrolling text to finish (about 1 minute total).

---

### Step 6: Create Storage Folder (30 seconds)

```bash
mkdir -p ~/Documents/Music\ Agent/Releases
```

This creates: `Documents/Music Agent/Releases/` (where all your data lives)

---

### Step 7: Start the App

**Go back to Page 1** for the daily startup commands!

Once running, open http://localhost:3000 in your browser.

---

## 📖 Page 4: Using Music Agent

### Upload Your First Track

1. Click anywhere on the homepage or drag a file
2. Fill in metadata: title, artist, BPM, key, genre
3. Upload artwork (optional)
4. Click **Upload Track**

---

### View Track Details

Click any track card to see:
- **Left sidebar**: Artwork, metadata, audio player, files
- **Right panel**: Label submissions and platform distribution

---

### Track Label Submissions

1. Open a track
2. Find "Label Submissions" section
3. Click **Add Submission**
4. Enter: label name, date, status, notes

---

### Log Platform Releases

1. Open a track
2. Find "Platform Distribution" section
3. Click **Add Platform**
4. Enter: platform (e.g., Spotify), date, URL

---

### Manage Label Deals *(signed tracks only)*

1. Open a signed track
2. Click **View Label Deal**
3. Add contacts (A&R, managers, etc.)
4. Upload contracts and documents

---

## 📖 Page 5: Troubleshooting

**Port Already in Use**

If you see "Port 3000 already in use":
```bash
lsof -ti:3000 | xargs kill
```

If you see "Port 3001 already in use":
```bash
lsof -ti:3001 | xargs kill
```

Then restart the app (Page 1 commands).

---

**Page Loads But Can't Upload Files**
- Check both Terminal windows are running
- Terminal 1 should say: "Server running on port 3001"
- Terminal 2 should say: "Ready on http://localhost:3000"

---

**Blank Page**
- Confirm you're at http://localhost:3000 (not 3001)
- Refresh the page
- Check Terminal 2 for errors (red text)

---

**"Cannot find module" Error**
- Re-run both install commands from Page 3, Step 5
- Make sure you ran BOTH (backend and frontend)

---

**Still Stuck?**

Click the **💬 Feedback** button and describe the issue, or message me with:
- Screenshot of the error
- What step you're on
- What you see in the Terminal

We'll figure it out together!

---

## 🎉 You're All Set!

**First thing to do:** Upload a test track, then click **💬 Feedback** and send: *"Setup complete!"*

I'll see it in our shared Google Sheet and know you're up and running.

**Happy organizing!** 🎵

---

*Last Updated: February 13, 2026*
