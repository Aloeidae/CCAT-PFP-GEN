import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const USHANKA_URL =
  "https://raw.githubusercontent.com/Aloeidae/Host-Store/refs/heads/main/ushanka.png?token=GHSAT0AAAAAAD3A3YR2J5UHA7RNHIJLSP4I2QZ2ZWA";

const PROMPT =
  "place the ushanka hat from image 1 on the character from image 2. Keep character and style identical to image 2 creating a new portrait of the character wearing an ushanka with red star and golden sickle and hammer";

function runwareCall(tasks: object[]): Promise<Map<string, any>> {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.RUNWARE_API_KEY;
    if (!apiKey) {
      reject(new Error("RUNWARE_API_KEY is not set"));
      return;
    }

    const ws = new WebSocket("wss://ws.runware.ai/v1");
    const responses = new Map<string, any>();
    const pendingUUIDs = new Set(
      tasks.map((t: any) => t.taskUUID).filter(Boolean)
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
      let msgs: any[];
      try {
        const parsed = JSON.parse(raw.toString());
        msgs = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return;
      }

      for (const msg of msgs) {
        if (msg.error) {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(msg.errorMessage || "Runware API error"));
          return;
        }
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

app.post("/api/edit-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const base64UserImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const ushankaUploadUUID = crypto.randomUUID();
    const userUploadUUID = crypto.randomUUID();

    // Upload both images simultaneously
    const uploadResults = await runwareCall([
      { taskType: "imageUpload", taskUUID: ushankaUploadUUID, image: USHANKA_URL },
      { taskType: "imageUpload", taskUUID: userUploadUUID, image: base64UserImage },
    ]);

    const ushankaResult = uploadResults.get(ushankaUploadUUID);
    const userResult = uploadResults.get(userUploadUUID);

    if (!ushankaResult?.imageUUID || !userResult?.imageUUID) {
      return res.status(500).json({ error: "Failed to upload images to Runware" });
    }

    // Run inference with ushanka as image 1, user photo as image 2
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

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
