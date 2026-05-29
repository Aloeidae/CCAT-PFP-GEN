# CCAT PFP Generator

Upload a portrait and receive an official state-issued ushanka. Powered by Runware image inference.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```
   npm install
   ```
2. Set `RUNWARE_API_KEY` in `.env` (see `.env.example`)
3. Run the app:
   ```
   npm run dev
   ```
   The dev server runs at http://localhost:3001.

## Deploy (Render)

A `render.yaml` Blueprint is included.

1. In Render: **New → Blueprint**, connect this repo. It reads `render.yaml`
   and creates a Node web service (`npm run build` → `npm start`).
2. Set **`RUNWARE_API_KEY`** in the service's Environment tab (it is marked
   `sync: false`, so Render prompts for it rather than reading it from the repo).
3. Deploy. `NODE_ENV=production` is set automatically, so the server serves the
   prebuilt `dist/` and proxies Runware server-side (your API key stays secret).
