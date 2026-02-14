Your New Dev Startup Routine 🚀
Every time you start working on your project, run these two terminal commands:
Terminal 1: Start Backend
bash
cd ~/Documents/music-agent-mvp/file-handler
node server.js
```

**What you should see:**
```
🎵 Music Release Manager API running on http://localhost:3001
Keep this terminal open while you work. This is your API server.

Terminal 2: Start Frontend
bash
cd ~/Documents/music-agent-mvp/frontend
npm run dev
```

**What you should see:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
Keep this terminal open too. This is your Next.js frontend.

Quick Check: Is Everything Running?
Open your browser:

http://localhost:3000 - Should show your release dashboard
http://localhost:3001/releases - Should show JSON data

Both should work! If either fails, check the terminal for red error messages.