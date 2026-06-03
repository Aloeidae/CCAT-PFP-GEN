# CCAT PFP Generator

Upload a portrait and get it back wearing an official state-issued ushanka. Image generation runs through Runware.

Code is mostly generative with some manual fixes.

## Requirements

- Node.js 22
- A Runware API key

## Run locally

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and set your `RUNWARE_API_KEY`.
3. Start the dev server:
   ```
   npm run dev
   ```
   The app runs at http://localhost:3001.

## How it works

The browser uploads a portrait to `POST /api/edit-image`. The server adds a bundled
ushanka reference image and sends both to Runware over a WebSocket, then returns the
generated image URL. The API key never reaches the client.

## Deploy to Render

A `render.yaml` Blueprint is included.

1. In Render, choose New, then Blueprint, and connect this repo. It runs
   `npm run build` and serves with `npm start`.
2. In the service's Environment tab, set `RUNWARE_API_KEY`. It is marked
   `sync: false`, so Render prompts for it instead of reading it from the repo.
3. Deploy. `NODE_ENV=production` is set automatically, so the server serves the
   prebuilt `dist/` and proxies Runware on the backend.
