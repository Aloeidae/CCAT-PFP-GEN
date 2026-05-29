# CCAT PFP Generator

Upload a portrait and receive an official state-issued ushanka. A pure static
React app that calls the [Runware](https://runware.ai) image-inference API
directly from the browser — no backend.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and set `VITE_RUNWARE_API_KEY`.
3. Run the dev server:
   ```
   npm run dev
   ```

## Deploy (Netlify)

- Build command: `npm run build`
- Publish directory: `dist`
- Set `VITE_RUNWARE_API_KEY` in the Netlify site's environment variables.

> **Note:** `VITE_`-prefixed variables are embedded into the client bundle and
> are therefore public. Set a spending limit on the Runware key to protect it.
