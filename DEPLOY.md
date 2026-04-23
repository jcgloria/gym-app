# Deploy as a PWA

## Option A — GitHub Pages (free, permanent URL)

```
cd /Users/jcgloria/Documents/gym-app
git init
git add .
git commit -m "gym app"
gh repo create gym-app --public --source=. --remote=origin --push
```

Then enable Pages:

```
gh api -X POST repos/:owner/gym-app/pages -f source[branch]=main -f source[path]=/
```

Or via UI: GitHub → repo → Settings → Pages → Source: `main` / root. Wait ~1 min. URL will be `https://<username>.github.io/gym-app/Gym%20App.html`.

## Option B — Netlify drop (fastest, ~30s)

1. Open https://app.netlify.com/drop
2. Drag the `gym-app` folder onto the page
3. Copy the HTTPS URL it gives you

## Install on iPhone

1. Open the URL in **Safari** (not Chrome — iOS only installs PWAs via Safari)
2. Tap the Share button → **Add to Home Screen**
3. App launches fullscreen, has its own icon, works offline after first load

## Updating

Edit files, redeploy (push to GitHub / re-drop on Netlify). The service worker cache version is `gym-app-v1` in `sw.js` — bump it (e.g. `v2`) to force clients to re-fetch.

## Notes

- Data (routines, sessions) lives in `localStorage` on your device. Clearing Safari data wipes it.
- The app is a plain static site — no build step, no backend.
