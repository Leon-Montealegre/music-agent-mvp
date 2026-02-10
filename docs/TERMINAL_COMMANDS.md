# Terminal Commands Reference

3 startup commands for the music-agent-mvp workflow.

---

## Step 1 — Start n8n

```bash
docker start n8n
```

Then verify by opening [http://localhost:5678](http://localhost:5678) in your browser.

---

## Step 2 — Start your file-handler API

```bash
cd ~/Documents/music-agent-mvp/file-handler
node server.js
```

You should see: `File-handler API listening on port 3001`
Keep that terminal window open.

---

## Step 3 — Health check (open a new terminal tab)

```bash
curl http://localhost:3001/health
```

You should get back: `{"status":"ok","timestamp":"..."}`

# Terminal 2: Frontend
cd ~/Documents/music-agent-mvp/music-agent-ui
npm run dev

# Test Playwright
cd ~/Documents/music-agent-mvp/file-handler
node automation/test-soundcloud.js

# Check Playwright version:
npx playwright --version