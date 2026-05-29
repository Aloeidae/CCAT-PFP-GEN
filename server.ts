import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// The ushanka reference image ships with the app and is sent to Runware as a
// base64 data URI, so there is no external URL that can expire or 404.
const USHANKA_PATH = path.join(process.cwd(), "assets", "ushanka.png");

function loadUshankaDataUri(): string {
  const bytes = fs.readFileSync(USHANKA_PATH);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

const PROMPT =
  "place the ushanka hat from image 1 on the character from image 2. Keep character and style identical to image 2 creating a new portrait of the character wearing an ushanka with red star and golden sickle and hammer";

function runwareCall(tasks: object[]): Promise<Map<string, any>> {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.RUNWARE_API_KEY;
    if (!apiKey) {
      reject(new Error("RUNWARE_API_KEY is not set"));
      return;
    }

    const ws = new WebSocket("wss://ws-api.runware.ai/v1");
    const responses = new Map<string, any>();
    const pendingUUIDs = new Set(
      (tasks as any[]).map((t) => t.taskUUID).filter(Boolean)
    );
    let authenticated = false;

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Runware request timed out"));
    }, 120_000);

    ws.on("open", () => {
      ws.send(JSON.stringify([{ taskType: "authentication", apiKey }]));
    });

    ws.on("message", (raw) => {
      let parsed: any;
      try {
        parsed = JSON.parse(raw.toString());
      } catch {
        return;
      }

      // Runware wraps results in { data: [...] } and errors in { errors: [...] }.
      const errors = parsed.errors ?? (parsed.error ? [parsed] : []);
      if (errors.length) {
        clearTimeout(timeout);
        ws.close();
        const e = errors[0];
        reject(new Error(e.message || e.errorMessage || "Runware API error"));
        return;
      }

      const items: any[] = parsed.data ?? (Array.isArray(parsed) ? parsed : [parsed]);
      for (const msg of items) {
        if (msg.taskType === "authentication" && !authenticated) {
          authenticated = true;
          ws.send(JSON.stringify(tasks));
          continue;
        }
        if (msg.taskUUID && pendingUUIDs.has(msg.taskUUID)) {
          responses.set(msg.taskUUID, msg);
          if (responses.size === pendingUUIDs.size) {
            clearTimeout(timeout);
            ws.close();
            resolve(responses);
          }
        }
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    ws.on("close", () => {
      clearTimeout(timeout);
      if (responses.size < pendingUUIDs.size) {
        reject(new Error("WebSocket closed before all tasks completed"));
      }
    });
  });
}

async function startServer() {
  // API routes registered first, before any other middleware
  app.post("/api/edit-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }

      const base64UserImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      let ushankaDataUri: string;
      try {
        ushankaDataUri = loadUshankaDataUri();
      } catch {
        return res.status(500).json({
          error: `Ushanka reference image not found. Place it at ${USHANKA_PATH}.`,
        });
      }

      const ushankaUploadUUID = crypto.randomUUID();
      const userUploadUUID = crypto.randomUUID();

      const uploadResults = await runwareCall([
        { taskType: "imageUpload", taskUUID: ushankaUploadUUID, image: ushankaDataUri },
        { taskType: "imageUpload", taskUUID: userUploadUUID, image: base64UserImage },
      ]);

      const ushankaResult = uploadResults.get(ushankaUploadUUID);
      const userResult = uploadResults.get(userUploadUUID);

      if (!ushankaResult?.imageUUID || !userResult?.imageUUID) {
        return res.status(500).json({ error: "Failed to upload images to Runware" });
      }

      const inferenceUUID = crypto.randomUUID();
      const inferenceResults = await runwareCall([
        {
          taskType: "imageInference",
          taskUUID: inferenceUUID,
          model: "google:4@3",
          positivePrompt: PROMPT,
          width: 512,
          height: 512,
          numberResults: 1,
          outputFormat: "PNG",
          inputImages: [ushankaResult.imageUUID, userResult.imageUUID],
        },
      ]);

      const inferenceResult = inferenceResults.get(inferenceUUID);

      if (!inferenceResult?.imageURL) {
        return res.status(500).json({ error: "API did not return an image" });
      }

      res.json({ imageUrl: inferenceResult.imageURL });
    } catch (err: any) {
      console.error("Error from Runware API:", err);
      res.status(500).json({ error: err.message || "Failed to edit image" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    // Vite and its (ESM-only) plugins are loaded lazily here, never at the top
    // level, so the production CJS bundle never require()s them. Config is inlined
    // (configFile: false) so Vite doesn't read vite.config.ts off disk.
    const { createServer: createViteServer } = await import("vite");
    const react = (await import("@vitejs/plugin-react")).default;
    const tailwindcss = (await import("@tailwindcss/vite")).default;
    const vite = await createViteServer({
      configFile: false,
      root: process.cwd(),
      plugins: [react(), tailwindcss()],
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
