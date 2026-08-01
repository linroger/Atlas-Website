#!/usr/bin/env node

/**
 * One-shot MiniMax mainland-China image + video smoke test.
 *
 * Official contracts:
 * - https://platform.minimaxi.com/docs/api-reference/image-generation-t2i
 * - https://platform.minimaxi.com/docs/api-reference/video-generation-i2v
 * - https://platform.minimaxi.com/docs/api-reference/video-generation-query
 * - https://platform.minimaxi.com/docs/api-reference/file-management-retrieve
 *
 * The API key is read only from MINIMAX_API_KEY. The script never prints the
 * key, response base64, full provider task/file ids, or download URLs.
 */

import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_BASE = "https://api.minimaxi.com";
const REPOSITORY_ROOT = realpathSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
);
const POLL_INTERVAL_MS = positiveInteger("MINIMAX_POLL_INTERVAL_MS", 10_000);
const POLL_TIMEOUT_MS = positiveInteger("MINIMAX_POLL_TIMEOUT_MS", 15 * 60_000);

function positiveInteger(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function redact(value) {
  const text = String(value ?? "");
  if (text.length <= 10) return "[redacted]";
  return `${text.slice(0, 5)}…${text.slice(-4)}`;
}

function sanitize(message) {
  return String(message)
    .replace(/sk-[A-Za-z0-9_-]+/g, "[REDACTED_KEY]")
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .slice(0, 500);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function imageType(bytes) {
  if (
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mime: "image/png", extension: "png" };
  }
  if (
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[bytes.length - 2] === 0xff &&
    bytes[bytes.length - 1] === 0xd9
  ) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  if (
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mime: "image/webp", extension: "webp" };
  }
  throw new Error("MiniMax returned bytes that are not PNG, JPEG, or WebP");
}

async function outputDirectory() {
  const configured = process.env.MINIMAX_OUTPUT_DIR;
  if (!configured) return mkdtemp(path.join(tmpdir(), "atlas-minimax-smoke-"));
  const resolved = path.resolve(configured);
  await assertOutsideRepository(resolved, "MINIMAX_OUTPUT_DIR");
  await mkdir(resolved, { recursive: true, mode: 0o700 });
  return resolved;
}

async function canonicalizePotentialPath(resolvedPath) {
  let cursor = resolvedPath;
  const missingSegments = [];
  while (true) {
    try {
      const canonicalExistingPath = await realpath(cursor);
      return path.join(canonicalExistingPath, ...missingSegments.reverse());
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const parent = path.dirname(cursor);
      if (parent === cursor) throw error;
      missingSegments.push(path.basename(cursor));
      cursor = parent;
    }
  }
}

async function assertOutsideRepository(resolvedPath, variableName) {
  const canonicalPath = await canonicalizePotentialPath(resolvedPath);
  const insideRepository =
    canonicalPath === REPOSITORY_ROOT ||
    canonicalPath.startsWith(`${REPOSITORY_ROOT}${path.sep}`);
  if (insideRepository && process.env.MINIMAX_ALLOW_REPO_OUTPUT !== "1") {
    throw new Error(
      `${variableName} must be outside the repository unless MINIMAX_ALLOW_REPO_OUTPUT=1`
    );
  }
}

async function fetchWithTimeout(url, init, timeoutMs, ambiguousLabel) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError" &&
      ambiguousLabel
    ) {
      throw new Error(
        `${ambiguousLabel} timed out with an ambiguous provider outcome; do not resubmit automatically`
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function jsonRequest(key, url, init, timeoutMs, ambiguousLabel) {
  const response = await fetchWithTimeout(
    url,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${key}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers ?? {}),
      },
    },
    timeoutMs,
    ambiguousLabel
  );
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`MiniMax ${response.status} returned non-JSON data`);
  }
  const providerCode = body?.base_resp?.status_code;
  if (!response.ok || (providerCode !== undefined && providerCode !== 0)) {
    const providerMessage =
      body?.base_resp?.status_msg || body?.message || "provider error";
    throw new Error(
      `MiniMax ${response.status}/${providerCode ?? "unknown"}: ${sanitize(providerMessage)}`
    );
  }
  return { response, body };
}

async function createImage(key) {
  const { body } = await jsonRequest(
    key,
    `${API_BASE}/v1/image_generation`,
    {
      method: "POST",
      body: JSON.stringify({
        model: "image-01",
        prompt:
          "A red paper boat floating on calm blue water, centered composition, clean daylight, no text, no logo, no people.",
        aspect_ratio: "1:1",
        response_format: "base64",
        n: 1,
        prompt_optimizer: false,
        aigc_watermark: true,
      }),
    },
    180_000,
    "Image create request"
  );
  const encoded = body?.data?.image_base64?.[0];
  if (typeof encoded !== "string" || !encoded) {
    throw new Error(
      "MiniMax image response did not contain data.image_base64[0]"
    );
  }
  const rawBase64 = encoded.includes(",")
    ? encoded.slice(encoded.indexOf(",") + 1)
    : encoded;
  const bytes = Buffer.from(rawBase64, "base64");
  if (
    !bytes.length ||
    bytes.toString("base64").replace(/=+$/, "") !== rawBase64.replace(/=+$/, "")
  ) {
    throw new Error("MiniMax image response contained invalid base64");
  }
  return { bytes, rawBase64, ...imageType(bytes), responseId: body?.id };
}

async function createVideoOnce(key, image) {
  const { body } = await jsonRequest(
    key,
    `${API_BASE}/v1/video_generation`,
    {
      method: "POST",
      body: JSON.stringify({
        model: "MiniMax-Hailuo-02",
        first_frame_image: `data:${image.mime};base64,${image.rawBase64}`,
        prompt:
          "The red paper boat moves gently forward on calm water. Static camera, soft daylight, natural ripples, no text or logo.",
        duration: 6,
        resolution: "512P",
        prompt_optimizer: false,
        aigc_watermark: true,
      }),
    },
    120_000,
    "Video create request"
  );
  if (typeof body?.task_id !== "string" || !body.task_id) {
    throw new Error("MiniMax video response did not contain task_id");
  }
  return body.task_id;
}

async function pollVideo(key, taskId) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let pollCount = 0;
  while (Date.now() < deadline) {
    pollCount += 1;
    const { body } = await jsonRequest(
      key,
      `${API_BASE}/v1/query/video_generation?task_id=${encodeURIComponent(taskId)}`,
      { method: "GET" },
      30_000
    );
    const status = body?.status;
    console.log(
      JSON.stringify({ event: "video_poll", poll: pollCount, status })
    );
    if (status === "Success") {
      if (typeof body.file_id !== "string" || !body.file_id) {
        throw new Error(
          "Successful MiniMax video task did not contain file_id"
        );
      }
      return {
        fileId: body.file_id,
        width: body.video_width,
        height: body.video_height,
        pollCount,
      };
    }
    if (status === "Fail") {
      throw new Error(
        `MiniMax video task failed: ${sanitize(body?.base_resp?.status_msg || "unknown error")}`
      );
    }
    if (!new Set(["Preparing", "Queueing", "Processing"]).has(status)) {
      throw new Error(
        `MiniMax returned unknown video status: ${sanitize(status)}`
      );
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(
    `Video polling exceeded ${POLL_TIMEOUT_MS} ms; resume the same task id, do not create another task`
  );
}

async function downloadVideo(key, fileId) {
  const { body } = await jsonRequest(
    key,
    `${API_BASE}/v1/files/retrieve?file_id=${encodeURIComponent(fileId)}`,
    { method: "GET" },
    30_000
  );
  const downloadUrl = body?.file?.download_url;
  if (
    body?.file?.purpose !== "video_generation" ||
    typeof downloadUrl !== "string"
  ) {
    throw new Error(
      "MiniMax file metadata did not contain a video-generation download URL"
    );
  }
  let parsedDownloadUrl;
  try {
    parsedDownloadUrl = new URL(downloadUrl);
  } catch {
    throw new Error("MiniMax file metadata contained an invalid download URL");
  }
  if (
    parsedDownloadUrl.protocol !== "https:" ||
    parsedDownloadUrl.username ||
    parsedDownloadUrl.password
  ) {
    throw new Error("MiniMax file metadata contained an unsafe download URL");
  }
  const response = await fetchWithTimeout(
    parsedDownloadUrl,
    { method: "GET" },
    120_000
  );
  if (!response.ok)
    throw new Error(
      `MiniMax file download failed with HTTP ${response.status}`
    );
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 12 || bytes.subarray(4, 8).toString("ascii") !== "ftyp") {
    throw new Error(
      "MiniMax video download is not a recognizable MP4 container"
    );
  }
  return bytes;
}

async function completeVideo(key, outputDir, taskId, startedAt) {
  const result = await pollVideo(key, taskId);
  const video = await downloadVideo(key, result.fileId);
  const videoPath = path.join(outputDir, "video.mp4");
  await writeFile(videoPath, video, { mode: 0o600 });
  console.log(
    JSON.stringify({
      event: "video_complete",
      taskId: redact(taskId),
      fileId: redact(result.fileId),
      bytes: video.length,
      sha256: sha256(video),
      width: result.width,
      height: result.height,
      polls: result.pollCount,
      elapsedSeconds: Math.round((Date.now() - startedAt) / 1000),
      path: videoPath,
    })
  );
}

async function main() {
  const key = process.env.MINIMAX_API_KEY;
  if (!key)
    throw new Error("MINIMAX_API_KEY is required in the process environment");
  const resumeFile = process.env.MINIMAX_RESUME_FILE;
  if (resumeFile) {
    const resolvedResumeFile = path.resolve(resumeFile);
    await assertOutsideRepository(resolvedResumeFile, "MINIMAX_RESUME_FILE");
    const resume = JSON.parse(await readFile(resolvedResumeFile, "utf8"));
    if (typeof resume?.taskId !== "string" || !resume.taskId) {
      throw new Error("MINIMAX_RESUME_FILE does not contain a valid taskId");
    }
    const outputDir = path.dirname(resolvedResumeFile);
    console.log(
      JSON.stringify({
        event: "smoke_resume",
        host: API_BASE,
        taskId: redact(resume.taskId),
        expectedMaxRequests: { imageCreates: 0, videoCreates: 0 },
        outputDir,
      })
    );
    await completeVideo(key, outputDir, resume.taskId, Date.now());
    return;
  }
  const outputDir = await outputDirectory();
  const startedAt = Date.now();
  console.log(
    JSON.stringify({
      event: "smoke_start",
      host: API_BASE,
      expectedMaxRequests: { imageCreates: 1, videoCreates: 1 },
      outputDir,
    })
  );

  const image = await createImage(key);
  const imagePath = path.join(outputDir, `image.${image.extension}`);
  await writeFile(imagePath, image.bytes, { mode: 0o600 });
  console.log(
    JSON.stringify({
      event: "image_complete",
      model: "image-01",
      responseId: image.responseId ? redact(image.responseId) : undefined,
      bytes: image.bytes.length,
      mime: image.mime,
      sha256: sha256(image.bytes),
      path: imagePath,
    })
  );

  const taskId = await createVideoOnce(key, image);
  const taskPath = path.join(outputDir, "task.json");
  await writeFile(
    taskPath,
    `${JSON.stringify({ taskId, createdAt: new Date().toISOString() }, null, 2)}\n`,
    { mode: 0o600 }
  );
  console.log(
    JSON.stringify({
      event: "video_submitted",
      model: "MiniMax-Hailuo-02",
      resolution: "512P",
      durationSeconds: 6,
      taskId: redact(taskId),
      privateResumeFile: taskPath,
    })
  );

  await completeVideo(key, outputDir, taskId, startedAt);
}

main().catch(error => {
  console.error(
    JSON.stringify({
      event: "smoke_failed",
      error: sanitize(error?.message || error),
    })
  );
  process.exitCode = 1;
});
