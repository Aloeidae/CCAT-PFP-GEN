/**
 * Client-side Runware image generation.
 *
 * The browser opens a WebSocket straight to Runware, uploads the ushanka
 * reference image (bundled at /ushanka.png) and the user's portrait, then
 * runs an image-inference task. No server is involved, so this deploys as a
 * pure static site.
 *
 * Note: VITE_RUNWARE_API_KEY is embedded in the client bundle and is therefore
 * public. Protect it with a spending limit in the Runware dashboard.
 */

const WS_URL = "wss://ws-api.runware.ai/v1";

const PROMPT =
  "place the ushanka hat from image 1 on the character from image 2. Keep character and style identical to image 2 creating a new portrait of the character wearing an ushanka with red star and golden sickle and hammer";

type Task = Record<string, any>;

function runwareCall(apiKey: string, tasks: Task[]): Promise<Map<string, any>> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const responses = new Map<string, any>();
    const pending = new Set(tasks.map((t) => t.taskUUID).filter(Boolean));
    let authenticated = false;

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Runware request timed out"));
    }, 180_000);

    ws.onopen = () => {
      ws.send(JSON.stringify([{ taskType: "authentication", apiKey }]));
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("WebSocket connection error"));
    };

    ws.onclose = () => {
      clearTimeout(timeout);
      if (responses.size < pending.size) {
        reject(new Error("Connection closed before all tasks completed"));
      }
    };

    ws.onmessage = (ev) => {
      let parsed: any;
      try {
        parsed = JSON.parse(ev.data);
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
        if (msg.taskUUID && pending.has(msg.taskUUID)) {
          responses.set(msg.taskUUID, msg);
          if (responses.size === pending.size) {
            clearTimeout(timeout);
            ws.close();
            resolve(responses);
          }
        }
      }
    };
  });
}

function toDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Generates a portrait of the uploaded subject wearing the ushanka.
 * Returns the URL of the generated image.
 */
export async function generateUshanka(userFile: File): Promise<string> {
  const apiKey = import.meta.env.VITE_RUNWARE_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_RUNWARE_API_KEY is not configured");
  }

  const [userDataUri, ushankaBlob] = await Promise.all([
    toDataUri(userFile),
    fetch("/ushanka.png").then((r) => {
      if (!r.ok) throw new Error("Could not load the ushanka reference image");
      return r.blob();
    }),
  ]);
  const ushankaDataUri = await toDataUri(ushankaBlob);

  const ushankaUploadUUID = crypto.randomUUID();
  const userUploadUUID = crypto.randomUUID();

  const uploads = await runwareCall(apiKey, [
    { taskType: "imageUpload", taskUUID: ushankaUploadUUID, image: ushankaDataUri },
    { taskType: "imageUpload", taskUUID: userUploadUUID, image: userDataUri },
  ]);

  const ushankaImageUUID = uploads.get(ushankaUploadUUID)?.imageUUID;
  const userImageUUID = uploads.get(userUploadUUID)?.imageUUID;
  if (!ushankaImageUUID || !userImageUUID) {
    throw new Error("Failed to upload images to Runware");
  }

  const inferenceUUID = crypto.randomUUID();
  const inference = await runwareCall(apiKey, [
    {
      taskType: "imageInference",
      taskUUID: inferenceUUID,
      model: "google:4@3",
      positivePrompt: PROMPT,
      width: 512,
      height: 512,
      numberResults: 1,
      outputFormat: "PNG",
      inputImages: [ushankaImageUUID, userImageUUID],
    },
  ]);

  const imageURL = inference.get(inferenceUUID)?.imageURL;
  if (!imageURL) {
    throw new Error("API did not return an image");
  }
  return imageURL;
}
