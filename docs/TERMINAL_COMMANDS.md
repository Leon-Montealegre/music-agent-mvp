# Terminal Commands Reference

Quick reference for commands used in the music-agent-mvp workflow.

---

## Daily Startup Commands

### Start n8n (workflow automation)
```bash
cd ~/.n8n && n8n start
```

### Start the Express server
```bash
cd ~/Documents/music-agent-mvp && node server.js
```

### Start both (separate terminal tabs)
```bash
# Tab 1 — n8n
n8n start

# Tab 2 — Express server
cd ~/Documents/music-agent-mvp && node server.js
```

---

## Claude Code Examples

### Launch Claude Code
```bash
claude
```

### Start with a prompt
```bash
claude "explain server.js"
```

### Resume last conversation
```bash
claude --continue
```

### Run a one-shot command (no interactive session)
```bash
claude -p "list all TODO comments in this repo"
```

### Print conversation history
```bash
claude --history
```

---

## Git Commands

### Check status
```bash
git status
```

### Stage and commit
```bash
git add <file>
git commit -m "description of change"
```

### Stage everything and commit
```bash
git add -A && git commit -m "description of change"
```

### View recent commits
```bash
git log --oneline -10
```

### See what changed in a file
```bash
git diff <file>
```

### Create and switch to a new branch
```bash
git checkout -b feature/branch-name
```

### Switch back to main
```bash
git checkout main
```

### Push to remote
```bash
git push origin main
```

---

## Common Terminal Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + C` | Stop a running process |
| `Ctrl + Z` | Suspend a process (resume with `fg`) |
| `Ctrl + L` | Clear the terminal screen |
| `Ctrl + A` | Jump to beginning of line |
| `Ctrl + E` | Jump to end of line |
| `Ctrl + R` | Reverse search command history |
| `Tab` | Autocomplete file/folder names |
| `Cmd + T` | New terminal tab (macOS Terminal) |
| `Cmd + W` | Close current tab |
| `Up Arrow` | Previous command |

---

## Verification Commands

### Check if n8n is running
```bash
curl -s http://localhost:5678/healthz && echo " n8n OK" || echo " n8n not responding"
```

### Check if Express server is running
```bash
curl -s http://localhost:3000/ && echo " Server OK" || echo " Server not responding"
```

### Check Node.js version
```bash
node -v
```

### Check npm version
```bash
npm -v
```

### Check installed packages
```bash
npm list --depth=0
```

### Verify git remote
```bash
git remote -v
```

### List running Node processes
```bash
ps aux | grep node
```
