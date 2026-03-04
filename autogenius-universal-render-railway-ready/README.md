<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/baabb18e-8f2a-4e6a-bc56-7723a03e8d46

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Deploy

### Render
- Root Directory: leave blank (repo root) unless your repo nests this project.
- Build Command: `npm ci --no-fund --no-audit && npm run build`
- Start Command: `npm start`
- Environment Variables (optional): `GEMINI_API_KEY`

### Railway
- Deploy from GitHub or `railway up`
- Build/Start are defined in `railway.json`, but you can also use:
  - Build: `npm ci --no-fund --no-audit && npm run build`
  - Start: `npm start`
