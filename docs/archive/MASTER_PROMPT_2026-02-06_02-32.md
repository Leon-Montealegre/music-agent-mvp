Music Agent - Master Project Context v2.2
Document Info
Last Updated: February 6, 2026, 1:09 AM CET Status: Milestones 1-3 Complete | Milestone 4 (Storage Manager) NEXT Version: 2.2 (Milestone 4 scope refined, startup commands added)

About Me
I'm learning to code through hands-on building ("vibe coding"). I'm a beginner building a workflow automation system for electronic music releases. I use Cursor IDE with Claude Code, and I'm comfortable with terminal commands but need explanations for technical concepts.
Current Skill Level:
	•	Comfortable with: Terminal basics, file system navigation, Git via GitHub Desktop, copying/pasting code
	•	Learning: Node.js/Express, n8n workflows, API design, async/await, error handling, file I/O
	•	Goal: Understand how systems work together (not just copy-paste, but comprehend WHY)

Current Tech Stack
	•	Backend: Node.js v24.13.0 + Express + Multer (file-handler API on port 3001)
	•	Workflow Engine: n8n (Docker container on localhost:5678)
	•	Storage: Local folders: ~/Documents/Music Agent/Releases/
	•	Development: macOS, Cursor IDE, GitHub Desktop for version control
	•	Future Frontend: Next.js (Milestone 7)

Development Environment Startup
Run these commands at the start of each development session:
Step 1: Start n8n Docker Container

bash
docker start n8n
What this does: Starts the n8n workflow engine (runs in background on port 5678) Verify it's running: Open browser to http://localhost:5678
Step 2: Start File-Handler API

bash
cd ~/Documents/music-agent-mvp/file-handler
node server.js
What this does: Starts the Express server (listens on port 3001) Success message: File-handler API listening on port 3001 Keep this terminal window open (server runs in foreground)
Step 3: Verify Health Check

bash
curl http://localhost:3001/health
Expected response: {"status":"ok","timestamp":"..."} If fails: Check that Step 2 is running without errors
Quick Startup Verification Checklist
	•	n8n accessible at http://localhost:5678
	•	File-handler API responds to /health endpoint
	•	~/Documents/Music Agent/Releases/ folder exists
	•	Terminal window with node server.js is running (don't close it)

Project Structure

text
~/Documents/music-agent-mvp/
├── file-handler/
│   ├── server.js (Express API with Multer + metadata endpoint)
│   ├── package.json
│   ├── package-lock.json
│   └── node_modules/
├── workflows/
│   └── Release_Form_Workflow.json (exported n8n workflow)
├── docs/
│   ├── MASTER_PROMPT.md (this file - current version)
│   └── archive/
│       ├── MASTER_PROMPT_2026-02-05_22-03.md
│       └── MASTER_PROMPT_2026-02-05_23-33.md
├── MILESTONE_1_COMPLETE.md
├── MILESTONE_2_COMPLETE.md
├── MILESTONE_3_COMPLETE.md
├── README.md
└── .gitignore

Current State (MVP Progress)
✅ Milestone 1 Complete: Release Intake
	•	n8n "Release Intake" workflow receives JSON metadata via webhook
	•	Transforms metadata (generates releaseId: YYYY-MM-DD_Artist_Title format)
	•	Responds with confirmation
✅ Milestone 2 Complete: File Upload Handler
	•	File-handler API fully functional (server.js in ~/Documents/music-agent-mvp/file-handler/)
	•	Successfully tested: curl + n8n Form uploads work perfectly
	•	Server uses .any() to accept any field name, classify() function sorts by mimetype + file extension fallback
	•	n8n Form Trigger with 7 fields: artist, title, genre (dropdown), releaseType, audioFile, artworkFile, videoFile (optional)
	•	Docker networking working: using host.docker.internal:3001
	•	IF node conditional routing: handles video vs no-video uploads correctly
	•	Tested with real files: audio (56MB WAV), artwork (3MB PNG), video (6MB MP4)
✅ Milestone 3 Complete: Metadata Transformer
	•	Input validation: artist (1-100 chars), title (1-200 chars), genre (dropdown), releaseType (Singles only in MVP)
	•	Genre dropdown: 10 options (Ambient, Deep House, House, Indie Dance, Melodic House and Techno, Progressive House, Tech House, Techno, Trance, Other)
	•	metadata.json generation: releaseId, artist, title, genre, releaseType, releaseDate, createdAt, files array
	•	Files array catalogs: filename, size, mimetype for each uploaded file
	•	Metadata saved to each release folder alongside audio/artwork/video files
	•	Works with and without video uploads
	•	Validation errors provide helpful feedback to user
⏳ Milestone 4: Storage Manager (NEXT)
MVP Scope (Core Features Only):
	•	Add release listing/browsing capabilities (GET /releases endpoint)
	•	Implement duplicate detection (prevent accidental re-uploads)
	•	Add file validation (check for corrupt/invalid files before saving)
	•	Add disk space monitoring (warn when storage is low)
Deferred to V2:
	•	Release archiving (move old releases to archive folder)
	•	Release deletion with confirmation
Why This Matters:
	•	As you create more releases (1-2 per week), you need to manage them efficiently
	•	Prevents accidental overwrites of existing releases
	•	Ensures file quality before distribution
	•	Disk space awareness for large WAV files
Recommended Build Order:
	1	Release Listing (Foundation) - GET /releases endpoint, directory scanning
	2	Disk Space Monitoring - Add check-disk-space package, quick win
	3	Duplicate Detection (Simple) - Check if releaseId folder exists
	4	File Validation - Install music-metadata, validate audio files
Required npm Packages:

bash
npm install music-metadata check-disk-space file-type-checker
⏳ Milestone 5: Distribution Orchestrator
	•	SoundCloud/YouTube automated uploads
	•	DistroKid/Bandcamp manual guides
⏳ Milestone 6: Promo Content Generator
	•	Social media templates
	•	Automated caption generation
⏳ Milestone 7: Next.js UI
	•	User-facing upload form
	•	Replace n8n Form Trigger with custom UI

File-Handler API Details
server.js configuration:
	•	Port: 3001
	•	Endpoints:
	◦	GET /health - Server status check
	◦	POST /upload?releaseId=...&artist=...&title=...&genre=... - File uploads
	◦	POST /metadata - Save metadata.json
	◦	Milestone 4 additions (planned):
	▪	GET /releases - List all releases
	▪	GET /releases/:releaseId - Get specific release details
	▪	GET /storage/status - Disk space information
	◦	V2 additions (deferred):
	▪	POST /releases/:releaseId/archive - Archive a release
	▪	DELETE /releases/:releaseId - Delete a release (with confirmation)
Multer Configuration:
	•	Uses .any() to accept any field name (flexible for different upload sources)
	•	File classification: classify() function checks mimetype first, falls back to file extension
	◦	Audio extensions: .wav, .mp3, .flac, .aiff, .m4a, .ogg → audio/ folder
	◦	Image extensions: .jpg, .jpeg, .png, .gif, .webp, .bmp → artwork/ folder
	◦	Video extensions: .mp4, .mov, .avi, .mkv, .webm → video/ folder
Storage Structure:
	•	Path: RELEASES_BASE/<releaseId>/<audio|artwork|video>/
	•	Example: 2026-02-05_SophieJoe_TellMe/audio/track.wav, /artwork/cover.jpg, /video/promo.mp4, /metadata.json
	•	Why: Keeps all release assets together, easy to zip for distribution, clear organization
Query Parameters:
	•	releaseId, artist, title, genre passed from n8n and returned in upload response
	•	Why: Allows metadata generation without referencing previous nodes by name
Middleware:
	•	CORS enabled for n8n/Next.js calls
	•	express.json() middleware for JSON body parsing (required for POST /metadata)

n8n Workflow Structure (Milestone 3)

text
Form Trigger (7 fields: artist, title, genre dropdown, releaseType, audio, artwork, video)
  ↓
Validate Inputs (Code node: checks required fields, format, genre list)
  ↓
Set Node (generates releaseId: YYYY-MM-DD_ArtistName_TrackTitle, timestamp)
  ↓
IF Node (checks if video file uploaded)
  ├─→ HTTP Request (with video) → Create Metadata (with video) → Save Metadata (with video) → Respond
  └─→ HTTP Request (no video) → Create Metadata (no video) → Save Metadata (no video) → Respond
Key Implementation Details:
	•	Form Trigger outputs to Validate node
	•	Set node creates releaseId by removing spaces from artist/title: 2026-02-05_SophieJoe_TellMe
	•	IF node splits into parallel branches (only one executes per submission)
	•	HTTP Request nodes send form data via query parameters to file-handler
	•	Create Metadata nodes extract data from upload response (includes artist/title/genre)
	•	Save Metadata nodes use "Using Fields Below" mode (not raw JSON)
	•	Both branches end at same Respond node

OFFICIAL PRODUCT ROADMAP
MVP (Current - Target: 2-4 Weeks)
Scope:
	•	Release Types: Singles only (NO EP functionality in MVP)
	•	User: Solo use (me only)
	•	Infrastructure: Local (n8n Docker, file-handler on Mac, Next.js UI local)
	•	Automation Level: Core uploads automated, distribution/promo mostly manual with guides
7 Milestones:
	1	✅ Release Intake (n8n webhook)
	2	✅ File Upload Handler (Express/Multer API)
	3	✅ Metadata Transformer (releaseId generation, validation, metadata.json)
	4	⏳ Storage Manager (listing, disk monitoring, duplicate detection, file validation) - NEXT
	5	⏳ Distribution Orchestrator (SoundCloud/YouTube automated, DistroKid/Bandcamp guides)
	6	⏳ Promo Content Generator (social media templates)
	7	⏳ Next.js UI (user-facing upload form)
Success Criteria:
	•	✅ Can upload a single track → auto-published to SoundCloud + YouTube
	•	✅ Understand n8n, Express APIs, file handling, webhooks, multipart/form-data
	•	✅ Have working foundation for V2 enhancements

V2 - Professional Release Management & Maximum Label Outreach (Target: 2-3 Months After MVP)
Infrastructure Upgrades:
Hybrid Cloud Architecture:
	•	n8n: Migrate to n8n Cloud or self-hosted VPS for 24/7 workflow execution
	•	File-handler API: Deploy to cloud (AWS/Railway/Vercel/Fly.io)
	•	Storage: S3/Cloudflare R2 instead of local folders
	•	Next.js UI: Deploy to Vercel/Netlify (accessible from any device)
Multi-User Support:
	•	User accounts with authentication (Clerk/Auth0/Supabase Auth)
	•	Per-artist credential vault (encrypted storage for DistroKid/SoundCloud/YouTube logins)
	•	Billing integration (Stripe: freemium model with submission limits)
	•	Role-based access (Artist vs Manager vs Label accounts)
Storage Management Features (Deferred from MVP):
	•	Release archiving (move old releases to archive folder)
	•	Release deletion with confirmation
	•	Bulk operations (archive all releases older than 6 months)
	•	Storage optimization (compress old releases, cleanup temp files)
Business Model (V2 Launch):
	•	Free Tier: 1-2 releases/month, basic distribution (SoundCloud/YouTube), limited label submissions
	•	Pro Tier: $29-49/month, unlimited releases, all 4 label platforms, analytics, priority support
	•	Pay-As-You-Go: $1-5 per label submission (alternative to subscription)
	•	Goal: Break even with infrastructure costs, serve indie electronic producers affordably

EP Functionality (Full Implementation):
EP Parent/Child Linking:
	•	Create EP entities that group multiple individual tracks
	•	EP-level metadata: EP title, release date, EP artwork, track ordering, catalog numbers
	•	Individual tracks retain their own releaseIds (uploaded separately via MVP single-track workflow)
"Link Tracks to EP" Workflow:
	•	Post-upload workflow to bundle existing tracks into EPs
	•	User flow: Upload 3 tracks individually → Run "Create EP Bundle" workflow → Select tracks to link
	•	Output: EP metadata file in /releases/<epId>/ folder linking child releaseIds
Smart Distribution:
	•	Auto-detect if tracks belong to an EP (check for epId in metadata)
	•	Generate unified DistroKid pack for entire EP (not 3 separate singles)
	•	Coordinated release strategies:
	◦	Simultaneous: All tracks go live same day
	◦	Pre-release single: Track 1 releases 2 weeks early, full EP later
	•	Beatport EP submission (all tracks + EP metadata)
Why This Approach:
	•	Matches professional label workflows (each track = separate entity)
	•	Flexibility: release as singles or bundle as EP later
	•	Each track has unique metadata (different titles, artwork, ISRC codes)
	•	Better for Spotify/Apple Music (EP appears as cohesive album unit vs scattered singles)

Enhanced Label Outreach - 4 Platform Strategy:
Goal: Maximize electronic music label reach (major + independent labels)
Platform 1: LabelRadar (Existing - Beatport Group)
	•	Focus: Direct A&R connections, Beatport-connected labels
	•	Integration: Semi-automated (Playwright MCP guides user through submission)
Platform 2: DropTrack (NEW - Primary Addition)
	•	Focus: Multi-label demo submissions with real-time tracking
	•	Network: 2,400+ labels accepting demos (2026 data)
	•	Features: Simultaneous submissions, response analytics
	•	Why: Higher acceptance rates, efficiency, strong electronic genre coverage
	•	Pricing model: Pass-through costs to user ($15-30/month tier)
Platform 3: Groover (NEW - Secondary Addition)
	•	Focus: Guaranteed feedback + broader industry networking
	•	Network: Labels, playlist curators, bloggers, concert promoters, A&R reps
	•	Features: Guaranteed response within 7 days, international reach (strong EU)
	•	Pricing: €1 per submission (Grooviz credits), pay-as-you-go
	•	Why: Feedback loop improves releases, playlist placement attracts labels
Platform 4: SubmitHub (NEW - Tertiary - Playlist Focus)
	•	Focus: Playlist placement + blog coverage (indirect label reach strategy)
	•	Network: Spotify/YouTube curators, TikTok influencers, music blogs
	•	Features: Credit-based system, curators must respond
	•	Why: Build streams/credibility BEFORE approaching labels (proof of traction)
Submission Strategy Workflow:
	1	User uploads track via Music Agent form
	2	Auto-submit to LabelRadar (A&R) + DropTrack (labels) + Groover (labels + curators)
	3	Optional: Use SubmitHub for playlist placements (builds stream count)
	4	Track all responses in unified dashboard (which platforms work best for user's genre)

Playwright MCP Integration:
What: Visual browser automation via Playwright Model Context Protocol + Claude Code
How It Works:
	•	Install Playwright MCP server in development environment
	•	Claude can launch browsers, navigate to platform pages (DistroKid, Bandcamp, LabelRadar, DropTrack, Groover, SubmitHub)
	•	Playwright takes screenshots, highlights form fields, identifies upload buttons
	•	Claude generates step-by-step visual instructions: "Paste artist name in this field [screenshot with arrow], upload WAV file here [highlighted button], then review and click Submit"
Automation Boundaries:
	•	✅ Automated: Open upload pages, identify form fields, pre-fill text from releaseId metadata, generate visual instructions, screenshot current state for review
	•	❌ Manual (user clicks): Final Submit button, payment confirmations, Publish/Go Live buttons, Terms of Service acceptance, copyright attestations, any action with legal/financial consequences
Why This Balance:
	•	Eliminates guesswork ("Where exactly do I paste this on LabelRadar's form?")
	•	User retains control over legal/financial actions (safety + compliance)
	•	Semi-automation: prep work automated, final commitment manual
	•	Human-in-the-loop = industry best practice for music rights
Example Workflow:
	1	Music Agent detects release ready for distribution
	2	n8n triggers "Submit to DropTrack" task
	3	Playwright opens DropTrack submission form in browser
	4	Claude analyzes page, takes screenshot, highlights fields
	5	Claude displays instructions: "I've opened DropTrack. Here's what to do: [annotated screenshot] 1) Click 'Upload Audio' button (highlighted in red), 2) Select your WAV file from ~/Documents/Music Agent/Releases/2026-02-05_Artist_Title/audio/, 3) Paste 'Artist Name' in this field, 4) Review submission, 5) Click Submit when ready"
	6	User follows visual guide, reviews, clicks Submit

Beatport Readiness:
Enhanced Metadata Validation for Electronic Music Distribution:
"Beatport Mode" Toggle (Workflow Setting):
	•	When enabled: Requires label/imprint name (mandatory field, cannot proceed without it)
	•	Stricter genre taxonomy: Dropdown using Beatport's official 150+ genre list (not free-text input)
	•	Catalog number generation: Auto-generate label catalog numbers following convention (e.g., LAB001, LAB002, IMPRINT-2024-03)
	•	Release date constraints: Enforce minimum 2-4 week lead time (Beatport/labels require advance notice for marketing)
	•	Key/BPM metadata: Optional fields for DJ-focused metadata (useful for Beatport but not required for other platforms)
Distributor Strategy Toggle:
	•	"Fastest Release" Mode:
	◦	Use DistroKid (2-3 day turnaround)
	◦	Generic coverage (Spotify, Apple Music, Amazon, basic stores)
	◦	Best for: Quick releases, testing tracks, singles
	•	"Electronic Coverage" Mode:
	◦	Prioritize Beatport-compatible distributors (DistroKid still works, but recommendations change)
	◦	Slower (7-14 days) but reaches DJ-focused stores (Beatport, Traxsource, Juno Download)
	◦	Best for: Label releases, peak-time techno/house, professional DJ distribution
Why This Matters:
	•	Beatport = #1 platform for electronic music professionals (DJs buy tracks, labels scout talent)
	•	Labels require specific metadata format for Beatport submission acceptance
	•	Having Beatport-ready releases increases label signing rates (shows artist understands professional standards)
	•	Strategic trade-off: Speed vs. electronic music market penetration (user chooses based on goals)

Analytics Dashboard (V2 - Not V3):
Why V2, Not V3:
	•	Analytics is infrastructure, not advanced feature
	•	Required to validate platform choices (which submission platform converts best?)
	•	Informs V3 AI features (need historical data before AI can optimize)
	•	Enables learning loop (improve Release N+1 based on Release N performance)
	•	Justifies costs (ROI tracking: "Spent €10 on Groover, got 2 label responses, 1 acceptance")
	•	Supports multi-user business model (users need dashboard to see value, justify subscription)
Data Collection:
Release Performance Metrics:
	•	Stream counts: Spotify, SoundCloud, YouTube (API integrations)
	•	Download counts: Bandcamp, Beatport (webhook/API)
	•	Revenue per release (aggregated from distributor reports)
	•	Geographic breakdown (where are listeners? useful for targeting labels by region)
	•	Growth trends (week-over-week, month-over-month)
Submission Tracking:
	•	All label/curator submissions across 4 platforms (LabelRadar, DropTrack, Groover, SubmitHub)
	•	Response rates per platform (e.g., "LabelRadar: 10% response rate, DropTrack: 25%, Groover: 90% guaranteed")
	•	Feedback scores/comments (Groover provides ratings, SubmitHub has curator notes)
	•	Time to response (average days until label replies)
	•	Conversion rate (submission → opened → listened → accepted → signed)
	•	Cost per acceptance (total spent ÷ number of acceptances)
Platform ROI Analysis:
	•	Cost per submission (SubmitHub credits, Groover Grooviz, DropTrack subscription)
	•	Acceptances per dollar spent (efficiency metric)
	•	Stream increase after playlist placements (did SubmitHub curator add lead to 10K new streams?)
	•	Best-performing platforms by genre (techno vs house vs ambient might have different optimal platforms)
Promo Template Performance:
	•	Social media post engagement (click-through rates, likes, comments, shares)
	•	Which templates lead to most streams (A/B test caption styles)
	•	Optimal posting times (when does your audience engage most?)
	•	Cross-platform performance (Instagram vs TikTok vs Twitter/X)
Visualization (Dashboard Design):
	•	Hero metrics: Total streams, total releases, submission success rate, revenue generated
	•	Trend graphs: Stream growth over time, weekly release cadence
	•	Comparative charts: "Your techno releases get 40% more engagement than house releases"
	•	Actionable insights: "Your DropTrack submissions on Tuesdays have 2x response rate vs weekends"
	•	Platform comparison table: Side-by-side ROI for each submission platform

V2 Success Criteria:
	•	✅ Can process EP releases (3+ tracks grouped as cohesive unit)
	•	✅ Automated submissions to 4 platforms (LabelRadar, DropTrack, Groover, SubmitHub)
	•	✅ Dashboard shows which platforms work best for user's genre
	•	✅ System runs 24/7 in cloud (workflows execute even when computer is off)
	•	✅ Can onboard a second user (friend/beta tester) with their own account
	•	✅ Playwright MCP guides user through all upload forms visually (semi-automated)
	•	✅ Release archiving and deletion features fully functional

V3 - AI-Enhanced Workflow Optimization (Target: Ongoing After V2 Stabilizes)
Claude CoWork for Feature Development:
What: Use Claude CoWork (Anthropic's team collaboration AI workspace) for developing new Music Agent features
When to Start: Beginning of V2 planning phase (NOT in MVP)
Why V2 Timing:
	•	By V2, you'll have real user feedback, analytics data, beta user quotes
	•	CoWork excels at synthesizing patterns from multiple sources (upload 50 user comments, Claude identifies top 5 feature requests)
	•	Complex V2 features (EP linking, multi-platform submissions, analytics schema) benefit from persistent architectural discussions
	•	Enough context accumulated to make CoWork's persistent memory valuable
	•	You'll have revenue to justify tool cost (~$30-40/month on top of Claude Pro)
How It Works:
	•	Shared projects: Create "Music Agent V2 Features" workspace in CoWork
	•	Real-time collaboration: You + Claude brainstorm features together across multiple sessions
	•	Persistent conversation history: Full context of architecture decisions preserved (why did we choose this database schema?)
	•	Knowledge base: Upload user feedback CSVs, analytics screenshots, competitor research docs, API documentation
	•	Version control for ideas: Track feature evolution over weeks/months ("We considered Approach A, but chose B because...")
V2 Use Cases for CoWork:
	1	EP Linking Feature Design:
	◦	Upload: Current releaseId data structure, user requests for EP grouping
	◦	Discussion: "How to link tracks without breaking existing single-track releases?"
	◦	Output: Database schema, n8n workflow modifications, migration plan for existing data
	2	Multi-Platform Submission Logic:
	◦	Upload: LabelRadar/DropTrack/Groover API docs, rate limits, pricing models
	◦	Discussion: "How to batch submissions? Handle API failures? Track per-user costs?"
	◦	Output: Submission orchestrator design, error handling strategy, retry logic
	3	Analytics Schema Design:
	◦	Upload: Sample user feedback ("I want to know which labels respond fastest to my genre")
	◦	Discussion: "What data to collect? How to visualize? Privacy concerns with storing label response data?"
	◦	Output: PostgreSQL table schemas, dashboard mockup, data retention policies
	4	Pricing Strategy:
	◦	Upload: Competitor pricing (DistroKid $19.99/year, Groover €1/submission), your cost structure
	◦	Discussion: "Free tier limits? Pro tier features? Subscription vs pay-per-submission?"
	◦	Output: Pricing tiers table, feature matrix, user value propositions
	5	Playwright MCP Integration Planning:
	◦	Upload: Screenshots of DistroKid/LabelRadar upload forms
	◦	Discussion: "What to automate? What stays manual? How to handle form changes when platforms update?"
	◦	Output: Automation boundaries, user experience flow, error recovery procedures
Why CoWork Over Regular Claude:
	•	Persistent memory: Remembers decisions across days/weeks (regular Claude forgets after session ends)
	•	Shared context: If you bring in a co-founder/contractor later, they can read full CoWork history (instant onboarding)
	•	Version control: Can reference past discussions ("In Session 3, we decided to use PostgreSQL because...")
	•	Knowledge base: Upload 50 files once, Claude has context for all future conversations
What NOT to Use CoWork For (Use Regular Claude/Perplexity Instead):
	•	❌ MVP implementation questions ("How does Multer work?") → Use Perplexity (needs web search)
	•	❌ Quick debugging ("What's this error?") → Use Claude Code in Cursor (real-time coding)
	•	❌ One-off research ("Compare S3 vs R2 pricing") → Use Perplexity (needs current data)

Musician-First Features (Claude CoWork Co-Designed):
Context for Feature Design: Target user = Busy electronic music producer who:
	•	Releases 1-2 tracks per week (high output, quality over quantity)
	•	Juggles: music production, promotion, live gigs/DJing, day job
	•	Wants maximum label visibility + stream growth with minimum manual work
	•	Values: Each release matters (not spamming), professional presentation, data-driven improvement
	•	Needs: Clear ROI on time/money spent on promotion
Feature Ideas (To Develop with Claude CoWork in V3):
1. Smart Release Timing Optimizer
	•	Analyze user's past release performance (best/worst performing days)
	•	Cross-reference with industry data (Beatport's "New Release" spotlights, Spotify's Fresh Finds schedule)
	•	Suggest optimal release days/times for user's specific genre
	•	Avoid major competitor releases (don't drop techno track same day as Tale Of Us or Amelie Lens)
	•	Example output: "Based on your data, release on Wednesday 6am EST. Your past Wednesday releases averaged 40% more first-week streams. Avoid Feb 14 (Valentine's Day = low electronic music engagement)."
2. Promo Template Evolution Engine
	•	A/B test different social media caption styles automatically
	•	Track: Which captions drive most streams? Which get most engagement?
	•	Learn what works for YOUR audience specifically (not generic advice)
	•	Auto-generate variations based on winning patterns
	•	Example: "Your captions with 🎵 emoji + BPM + genre tags get 3x more clicks. Generated 5 new variations following this pattern."
3. Label Relationship Manager (CRM for Musicians)
	•	Track all label submissions across platforms (who, when, what response)
	•	Set automatic follow-up reminders (3 weeks after submission, 1 month after acceptance)
	•	Score labels by: Response rate, acceptance rate, post-release support quality
	•	Prioritize labels matching user's style (based on accepted/rejected history over time)
	•	Avoid duplicate submissions (flag if you already submitted to this label 2 months ago)
	•	Example: "You've submitted to Label X 3 times, no response. Suggest focusing on Label Y (similar style, 40% acceptance rate for your genre)."
4. Cross-Platform Brand Sync
	•	Detect achievements (hit 10K streams, got signed, played at festival)
	•	Auto-update all platform bios simultaneously (SoundCloud, Spotify, Instagram, Beatport artist page)
	•	Sync release announcements across platforms (one-click distribution of announcement)
	•	Maintain consistent artist brand everywhere (same bio style, links, achievements)
	•	Example: "Detected: Your track hit 50K streams on Spotify. Updated your Instagram/SoundCloud bios with this milestone. Posted celebration story."
5. Intelligent Promo Campaign Orchestrator
	•	Suggest influencers/curators based on similar artists' growth patterns
	•	Automate DM outreach with user approval (generate personalized messages, user reviews before sending)
	•	Schedule teaser content leading up to release (7 days before: snippet, 3 days: artwork reveal, day of: full release)
	•	Coordinate across platforms (Instagram Stories, TikTok, Twitter/X, YouTube Shorts)
	•	Example: "Campaign plan for next release: Week -2: Post studio snippet on IG. Week -1: TikTok teaser with BPM challenge. Day 0: Coordinate YouTube premiere + Instagram Live listening party."
6. Collaboration Finder & Remix Exchange
	•	Match user with producers at similar skill/following level for collabs
	•	Suggest remix opportunities based on compatible styles (user makes melodic techno → suggest remixing progressive house artists)
	•	Track collab success rates (do collaborations actually grow your audience?)
	•	Facilitate remix exchanges (you remix Artist A, they remix you)
	•	Example: "Found 5 producers in Berlin making similar melodic techno, 5K-15K followers, open to collabs. Suggested outreach: [personalized message templates]."

V3 Success Criteria:
	•	✅ AI suggests optimal release timing based on user's historical data + industry trends
	•	✅ Promo templates auto-improve each release (learn from performance)
	•	✅ System learns which labels match user's style (recommendation engine)
	•	✅ 50%+ reduction in manual promo work (time saved per release)
	•	✅ Claude CoWork used to design all new features (persistent context, collaborative planning)
	•	✅ Users report: "Music Agent feels like having a manager + publicist"

Technology Evolution Across Phases
Component
MVP
V2
V3
n8n Workflows
Docker (local Mac)
n8n Cloud or VPS
Same + AI-powered nodes
File-handler API
Express on Mac (port 3001)
Cloud deploy (Railway/Fly.io)
Serverless functions (edge computing)
Storage
Local folders (~/Documents/Music Agent/Releases/)
S3/Cloudflare R2
Same + CDN for global access
Frontend UI
Next.js (local dev)
Vercel production deploy
Same + AI chat interface
Authentication
None (solo use)
Clerk/Auth0/Supabase Auth
Same + SSO for labels
Database
None (file-based metadata)
PostgreSQL (Supabase/Neon)
Same + vector DB for AI features
Automation Level
n8n only, manual distribution
n8n + Playwright MCP (semi-auto)
n8n + MCP + AI agents
Development Tools
Cursor + Claude Code + Perplexity
Same + Claude CoWork (V2 planning)
Same (CoWork for all features)
Monitoring
Terminal logs only
Application monitoring (Sentry/LogRocket)
Same + AI anomaly detection




Key Technical Decisions & Rationale
releaseId Format: YYYY-MM-DD_ArtistName_TrackTitle
	•	Example: 2026-02-05_SophieJoe_TellMe
	•	Why: Sortable by date, human-readable, filesystem-safe, unique per release
	•	Spaces removed from artist and title for filesystem compatibility
Genre Dropdown (Not Free Text)
	•	10 predefined options in alphabetical order
	•	Options: Ambient, Deep House, House, Indie Dance, Melodic House and Techno, Progressive House, Tech House, Techno, Trance, Other
	•	Why: Ensures data consistency, prevents typos, easier for analytics later
Metadata in Upload Response
	•	File-handler returns artist/title/genre in POST /upload response
	•	Why: Allows metadata generation without referencing previous nodes by name
	•	Avoids "Referenced node doesn't exist" errors in n8n Code nodes
express.json() Middleware
	•	Added to server.js for parsing JSON request bodies
	•	Why: Required for POST /metadata endpoint to read req.body
	•	Without it: req.body is undefined, causing errors
n8n HTTP Request: "Using Fields Below" for JSON
	•	Don't use raw JSON with {{ }} expressions in quotes
	•	Use parameter fields with expression mode instead
	•	Why: Prevents "[object Object]" serialization errors
Parallel Branch Strategy in n8n
	•	Duplicate metadata nodes for with-video and no-video branches
	•	Don't use Merge node (causes execution issues with conditional IF)
	•	Why: Simpler, more reliable, easier to debug
Storage Structure
	•	Example: 2026-02-05_SophieJoe_TellMe/audio/track.wav, /artwork/cover.jpg, /video/promo.mp4, /metadata.json
	•	Why: Keeps all release assets together, easy to zip for distribution, clear organization
No Database in MVP
	•	Store metadata as JSON files in release folders
	•	Why: Simpler for learning, fewer moving parts, easy to inspect/debug
	•	V2 adds PostgreSQL when multi-user requires querying/relationships

Common Issues & Solutions (Reference)
Issue: ECONNREFUSED when n8n calls file-handler
	•	Solution: Use http://host.docker.internal:3001 (not 127.0.0.1) in n8n HTTP Request node
	•	Why: Docker networking isolation
Issue: "Referenced node doesn't exist" in n8n Code node
	•	Solution: Don't use $('Node Name') to reference other nodes; use data from $input or pass data through workflow
	•	Why: Node name references are fragile and case-sensitive
Issue: req.body is undefined in Express
	•	Solution: Add app.use(express.json()); before route definitions
	•	Why: Express doesn't parse JSON bodies by default
Issue: metadata.json shows "[object Object]"
	•	Solution: In n8n HTTP Request, use "Using Fields Below" mode, not raw JSON with quoted expressions
	•	Why: Quoted expressions serialize objects to strings
Issue: Merge node not executing in n8n
	•	Solution: Don't use Merge after conditional IF—duplicate nodes on each branch instead
	•	Why: Merge expects both inputs, but IF only sends one
Issue: Genre showing "Unknown" in metadata
	•	Solution: Pass genre as query parameter in HTTP Request, return it in file-handler response
	•	Why: Metadata code can't access Form Trigger data directly

Learning Preferences & Communication Style
How to Help Me
Explain WHY we do each step (not just commands to copy-paste)
	•	Good: "We use express.json() because Express doesn't parse JSON request bodies by default. Without it, req.body will be undefined when the client sends JSON data."
	•	Bad: "Add app.use(express.json()); to your code."
No # comments in terminal commands (they break copy-paste in zsh)
	•	Good: Separate explanation from command
	•	Bad: npm install express # This installs Express
Assume I'm a total beginner, explain technical terms in plain language
	•	Use real-world analogies when helpful
	•	Define jargon on first use (e.g., "API endpoint = a specific URL your server listens to, like a phone number")
Small milestones with clear checkpoints (celebrate small wins)
	•	Break features into 5-10 minute tasks
	•	Test each piece as we build (don't write 500 lines before testing)
	•	Clear "✅ Success looks like..." criteria for each step
Test each piece as we build
	•	Write code → test → debug → move forward
	•	Never write more than 20-30 lines without running it
	•	Show me how to verify each step works
Real-world analogies when explaining complex concepts
	•	Example: "Multer is like a mail sorter at a post office—it receives all incoming packages (files) and sorts them into different bins (folders) based on what's inside."

Tools I'm Learning
Cursor IDE (primary code editor)
	•	AI-powered code completion
	•	Integrated with Claude Code for real-time help
	•	Used for all file editing
Claude Code (AI pair programmer, real-time help)
	•	Current use (MVP): Secondary tool, use Perplexity for Milestones 4-6
	•	Future use (V2): Primary development assistant
	•	V3: Combined with Claude CoWork for feature planning
	•	Can see full codebase context
	•	Real-time debugging and code generation
Perplexity (research + long conversations, current web data access)
	•	Current use (MVP): Primary assistant for Milestones 1-6
	•	Long-form context (master prompts like this one)
	•	Research latest packages, best practices, current web data
	•	Planning and architecture discussions
GitHub Desktop (version control, beginner-friendly)
	•	Visual Git interface (no command line needed)
	•	Commit, push, branch management
	•	Easier than terminal Git commands
Terminal (getting comfortable with command line)
	•	Basic commands: cd, ls, mkdir, npm install, node server.js
	•	Understanding output (logs, errors, success messages)
	•	Copy-paste friendly (no inline comments)
n8n (visual workflow builder, learning automation concepts)
	•	No-code workflow automation
	•	Learning: HTTP requests, webhooks, data transformation, conditional logic
	•	Bridging UI actions to backend API calls

Current Learning Goals
MVP Phase (Now - Next 2-4 Weeks):
	•	Master file system operations (reading directories, checking file stats, moving files)
	•	Understand async/await patterns (why we need it, how to handle errors)
	•	Learn API design patterns (REST conventions, error responses, status codes)
	•	Build confidence with Node.js/Express fundamentals
	•	Get comfortable debugging (reading error messages, console.log strategies)
V2 Phase (2-3 Months After MVP):
	•	Transition to Claude Code as primary development assistant
	•	Learn cloud deployment (Railway, Vercel, understanding environment variables)
	•	Understand authentication/authorization concepts (JWT tokens, sessions, protected routes)
	•	Database fundamentals (PostgreSQL, schema design, relationships, migrations)
	•	Start using Claude CoWork for feature planning
	•	Multi-user systems (how to isolate user data, billing integration basics)
V3 Phase (Ongoing):
	•	AI/ML integration patterns (when to use AI, how to structure prompts programmatically)
	•	Advanced n8n workflows (complex branching, error recovery, rate limiting)
	•	System architecture (microservices vs monolith, when to split services)
	•	Performance optimization (caching, CDN, database indexing)
	•	Product thinking (prioritization, user feedback loops, metric-driven development)

Tool-Specific Instructions
When Using Perplexity (Current - MVP Milestones 4-6):
	•	Paste this full Master Prompt at start of new thread
	•	Ask for explanations with examples
	•	Request step-by-step breakdowns for complex tasks
	•	Use for research (latest npm packages, best practices, comparing approaches)
	•	Good for: Planning, research, learning concepts, troubleshooting
When Using Claude Code (Starting V2):
	•	Share full codebase context (Cursor integration handles this)
	•	Ask for real-time debugging help
	•	Request code generation with explanations
	•	Use for: Writing code, debugging errors, refactoring, testing
	•	Good for: Implementation, quick fixes, code review
When Using Claude CoWork (Starting V2 Planning):
	•	Create "Music Agent V2 Features" project
	•	Upload: User feedback, API docs, analytics screenshots, competitor research
	•	Use for long-term feature discussions (persist across days/weeks)
	•	Reference past decisions ("In our Pricing Strategy session, we decided...")
	•	Good for: Feature design, architecture decisions, business strategy, persistent context
When to Use Which Tool:
Task
Use
Why
"What's the latest best practice for X?"
Perplexity
Needs web search, current data
"Fix this error in my code"
Claude Code
Has codebase context, real-time
"How should we design EP linking feature?"
Claude CoWork
Long-term planning, persistent memory
"Write this function for me"
Claude Code
Real-time code generation
"Compare these 3 approaches"
Perplexity
Research, web data, examples
"Remember our pricing decision from last week?"
Claude CoWork
Persistent conversation history




Business Model & Goals
Philosophy: Break even with infrastructure costs, serve indie electronic producers affordably
Pricing Strategy (V2 Launch)
Free Tier:
	•	1-2 releases per month
	•	Basic distribution (SoundCloud + YouTube automated)
	•	Limited label submissions (2 submissions/month across all platforms)
	•	Basic analytics (stream counts only)
Pro Tier ($29-49/month):
	•	Unlimited releases (supports 1-2 tracks per week output)
	•	All 4 label platforms (LabelRadar, DropTrack, Groover, SubmitHub)
	•	Full analytics dashboard + insights
	•	Playwright MCP visual guidance
	•	Priority support
	•	Advanced features (EP grouping, Beatport mode, promo templates, release archiving, bulk deletion)
Pay-As-You-Go (Alternative to Pro):
	•	$1-5 per label submission (no subscription)
	•	Good for infrequent releasers (1 release every 3 months)
	•	Pay only for what you use
Goal: Break even with infrastructure costs, build sustainable tool for indie producers

Master Prompt Management
File Location

text
~/Documents/music-agent-mvp/docs/MASTER_PROMPT.md
Archive Before Updating

bash
cd ~/Documents/music-agent-mvp/docs
cp MASTER_PROMPT.md archive/MASTER_PROMPT_$(date +%Y-%m-%d_%H-%M).md
Quick Access Alias (Already Set Up)

bash
prompt
What it does: Copies entire Master Prompt to clipboard → ready to paste into new Perplexity/Claude thread
When to Update This Prompt
After completing each milestone:
	•	Mark milestone as ✅ Complete
	•	Add "Milestone N Complete" details to Current State section
	•	Archive old version with timestamp
	•	Commit to Git with message: "docs: Update Master Prompt - Milestone N complete"
When making architectural decisions:
	•	Add to "Key Technical Decisions & Rationale" section
	•	Document WHY you chose this approach
	•	Include alternatives considered and reasons for rejection
When encountering new issues/solutions:
	•	Add to "Common Issues & Solutions" section
	•	Include error message, solution, and explanation
When roadmap changes:
	•	Update OFFICIAL PRODUCT ROADMAP section
	•	Move features between MVP/V2/V3 as priorities shift
	•	Document reasons for changes

How to Use This Prompt
Starting a new Perplexity thread:
	1	Run prompt in terminal
	2	Paste into new Perplexity thread
	3	Ready to continue from where you left off
Starting a new Claude Code session:
	1	Cursor automatically shares codebase context
	2	Paste relevant sections (Current State, Milestone goals, Learning Preferences)
	3	Less verbose than full prompt (Claude Code has code context already)
Starting Claude CoWork (V2+):
	1	Create "Music Agent" project
	2	Upload this Master Prompt as foundational document
	3	Add user feedback, analytics, API docs as separate files
	4	Reference in conversations: "See Master Prompt section on EP Linking"
Onboarding a co-founder/contractor:
	•	Share this prompt
	•	They get full context in 10 minutes of reading
	•	No need for long explanations or repeated questions
Mid-milestone context refresh:
	•	Re-paste relevant sections only (not full prompt)
	•	Example: "Here's the Milestone 4 build order from my Master Prompt..."

Next Steps
Immediate: Start Milestone 4 (Storage Manager)
	1	Create branch: git checkout -b milestone-4-storage-manager
	2	Install packages: npm install music-metadata check-disk-space file-type-checker
	3	Begin with Step 1: Release Listing (GET /releases endpoint)
Short-term: Complete Milestones 4-7 (finish MVP)
Mid-term: Plan V2 architecture, start Claude CoWork experimentation
Long-term: Launch V2, onboard beta users, iterate based on feedback

Document Version: 2.2 Last Updated: February 6, 2026, 1:09 AM CET Status: Milestones 1-3 Complete | Milestone 4 (Storage Manager) NEXT Maintained By: You (update after each milestone)