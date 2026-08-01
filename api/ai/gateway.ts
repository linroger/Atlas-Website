/**
 * Atlas AI Gateway — single access point for every AI capability on the site.
 *
 * Wired capabilities (agent-gw tool API, OpenAI-style /v1/tools):
 *   - generateImage     AI banner / cover / DNA art        (image model)
 *   - generateVideo     AI trip film from user photos      (video model)
 *   - generateSpeech    AI narration voiceover             (speech model)
 *   - webSearch         real destination intelligence      (search)
 *   - uploadStorage     public URLs for user photos        (storage)
 *   - llmChat           optional LLM polish (provider chain w/ graceful fallback)
 */

const GW_BASE = (
  process.env.AGENT_GW_BASE_URL || "https://agent-gw.kimi.com/coding/v1"
).replace(/\/+$/, "");
const GW_KEY = process.env.AGENT_GW_API_KEY || "";

const LLM_BASE = (
  process.env.DEFAULT_AI_BASE_URL || "https://agent-gw.kimi.com/coding/v1"
).replace(/\/+$/, "");
const LLM_KEY = process.env.DEFAULT_AI_API_KEY || "";
const LLM_MODEL = process.env.DEFAULT_AI_MODEL || "kimi:kimi-k2.5";

export function aiEnabled() {
  return Boolean(GW_KEY);
}

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  return typeof value === "object" && value !== null ? (value as JsonObject) : null;
}

function normalizeSearchHits(value: unknown, limit: number): SearchHit[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((entry) => {
      const hit = asObject(entry);
      if (!hit) return [];
      return [
        {
          title: typeof hit.title === "string" ? hit.title : undefined,
          content: typeof hit.content === "string" ? hit.content : undefined,
          url: typeof hit.url === "string" ? hit.url : undefined,
        },
      ];
    })
    .slice(0, limit);
}

class GatewayError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

async function postJson(
  url: string,
  body: unknown,
  key: string,
  timeoutMs: number,
): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await resp.text();
    if (!resp.ok) {
      throw new GatewayError(
        `gateway ${resp.status}: ${text.slice(0, 240)}`,
        resp.status,
      );
    }
    return JSON.parse(text) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

/** Invoke an agent-gw tool by name. */
export async function invokeTool(
  method: string,
  params: Record<string, unknown>,
  timeoutMs = 120_000,
): Promise<unknown> {
  if (!GW_KEY) throw new GatewayError("AI gateway key not configured");
  const raw = await postJson(
    `${GW_BASE}/tools`,
    { method, params },
    GW_KEY,
    timeoutMs,
  );
  // ToolResponse shape: { success, data | error } or direct payload
  const response = asObject(raw);
  if (response) {
    if (response.success === false) {
      throw new GatewayError(String(response.error || response.message || method));
    }
    return response.data !== undefined ? response.data : raw;
  }
  return raw;
}

function mediaUrl(payload: unknown): string | null {
  const response = asObject(payload);
  if (!response) return null;
  const media = asObject(response.media);
  if (typeof media?.url === "string") return media.url;
  if (typeof response.url === "string") return response.url;
  return null;
}

// ── Image generation (banners, covers, DNA art) ─────────────────
export async function generateImage(
  description: string,
  opts: { ratio?: string; resolution?: string } = {},
): Promise<string> {
  const payload = await invokeTool(
    "generate_image",
    {
      description,
      ratio: opts.ratio || "3:2",
      resolution: opts.resolution || "1K",
    },
    150_000,
  );
  const url = mediaUrl(payload);
  if (!url) throw new GatewayError("image generation returned no url");
  return url;
}

// ── Video generation (AI trip film) — slow, run async ───────────
export async function generateVideo(
  description: string,
  referenceImageUrls: string[],
  opts: { durationSeconds?: number; ratio?: string } = {},
): Promise<string> {
  const payload = await invokeTool(
    "generate_video",
    {
      description,
      reference_image_urls: referenceImageUrls.slice(0, 4),
      duration_seconds: opts.durationSeconds ?? 4,
      ratio: opts.ratio || "16:9",
      resolution: "720p",
      generate_audio: false,
    },
    480_000,
  );
  const url = mediaUrl(payload);
  if (!url) throw new GatewayError("video generation returned no url");
  return url;
}

// ── Speech (AI narration) ───────────────────────────────────────
export async function generateSpeech(text: string): Promise<string> {
  const payload = await invokeTool(
    "generate_speech",
    { text: text.slice(0, 900) },
    120_000,
  );
  const url = mediaUrl(payload);
  if (!url) throw new GatewayError("speech generation returned no url");
  return url;
}

// ── Web search (destination intelligence) ───────────────────────
export type SearchHit = { title?: string; content?: string; url?: string };
export async function webSearch(
  query: string,
  limit = 4,
): Promise<SearchHit[]> {
  try {
    const payload = await invokeTool(
      "websearch",
      { text_query: query, limit },
      45_000,
    );
    const response = asObject(payload);
    return normalizeSearchHits(response?.search_results || response?.results, limit);
  } catch {
    // fall back to the alternate endpoint used by some gateways
    const raw = await postJson(
      `${GW_BASE}/search`,
      { text_query: query, limit },
      GW_KEY,
      45_000,
    );
    const response = asObject(raw);
    const data = asObject(response?.data);
    return normalizeSearchHits(response?.search_results || data?.search_results, limit);
  }
}

// ── Storage (user photos → public URLs) ─────────────────────────
export async function uploadStorage(
  bytes: Buffer,
  filename: string,
  contentType: string,
): Promise<{ fileId: string; url: string }> {
  if (!GW_KEY) throw new GatewayError("AI gateway key not configured");
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(bytes)], { type: contentType }),
    filename,
  );
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 90_000);
  try {
    const resp = await fetch(`${GW_BASE}/storage`, {
      method: "POST",
      headers: { Authorization: `Bearer ${GW_KEY}` },
      body: form,
      signal: ctrl.signal,
    });
    const text = await resp.text();
    if (!resp.ok) {
      throw new GatewayError(
        `storage ${resp.status}: ${text.slice(0, 200)}`,
        resp.status,
      );
    }
    const data = asObject(JSON.parse(text));
    const fileId = data?.file_id || data?.fileId;
    const url = data?.signed_url || data?.url;
    if (typeof fileId !== "string" || typeof url !== "string") {
      throw new GatewayError("storage upload incomplete");
    }
    return { fileId, url };
  } finally {
    clearTimeout(timer);
  }
}

/** Re-sign a storage file id into a fresh public URL. */
export async function signStorageUrl(fileId: string): Promise<string | null> {
  if (!GW_KEY) return null;
  try {
    const resp = await fetch(`${GW_BASE}/storage/${fileId}`, {
      headers: { Authorization: `Bearer ${GW_KEY}` },
    });
    if (!resp.ok) return null;
    const data = asObject(await resp.json());
    const url = data?.signed_url || data?.url;
    return typeof url === "string" ? url : null;
  } catch {
    return null;
  }
}

// ── Optional LLM polish (provider chain) ────────────────────────
/**
 * Try the provisioned LLM endpoint; return null when unavailable so callers
 * can fall back to the deterministic Atlas composer.
 */
export async function llmChat(
  messages: { role: string; content: string }[],
  timeoutMs = 25_000,
): Promise<string | null> {
  if (!LLM_KEY) return null;
  try {
    const raw = await postJson(
      `${LLM_BASE}/chat/completions`,
      { model: LLM_MODEL, messages, stream: false },
      LLM_KEY,
      timeoutMs,
    );
    const response = asObject(raw);
    const choices = Array.isArray(response?.choices) ? response.choices : [];
    const choice = asObject(choices[0]);
    const message = asObject(choice?.message);
    const content = message?.content;
    return typeof content === "string" && content.trim() ? content : null;
  } catch {
    return null;
  }
}
