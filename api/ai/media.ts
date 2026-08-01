import { PhotoUpload } from "@contracts/constants";
import { TRPCError } from "@trpc/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import sharp from "sharp";

const BASE64_PAYLOAD = /^[A-Za-z0-9+/]+={0,2}$/;
const BASE64URL_PAYLOAD = /^[A-Za-z0-9_-]+$/;
const allowedMimeTypes = new Set<string>(PhotoUpload.allowedMimeTypes);
const MEDIA_CAPABILITY_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_IMAGE_DIMENSION = 16_384;
const MAX_IMAGE_PIXELS = 64_000_000;

type SupportedImageMime = (typeof PhotoUpload.allowedMimeTypes)[number];

type MediaCapabilityPayload = {
  v: 1;
  fileId: string;
  userId: number;
  expiresAt: number;
};

type MediaCapabilityOptions = {
  secret?: string;
  nowMs?: number;
  ttlMs?: number;
};

export function mediaProxyUrl(fileId: string): string {
  return `/api/media/${encodeURIComponent(fileId)}`;
}

export function privateMediaProxyUrl(capability: string): string {
  return `/api/media/private/${encodeURIComponent(capability)}`;
}

function mediaCapabilitySecret(explicitSecret?: string): string {
  const secret = explicitSecret ?? process.env.APP_SECRET;
  if (!secret) {
    throw new Error("APP_SECRET is required for media upload authorization");
  }
  return secret;
}

function capabilitySignature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, "utf8");
  const rightBytes = Buffer.from(right, "utf8");
  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}

/**
 * Creates a short-lived, user-bound capability for a newly uploaded file.
 * The raw gateway file id is never accepted back from an untrusted client.
 */
export function issueMediaCapability(
  fileId: string,
  userId: number,
  options: MediaCapabilityOptions = {}
): string {
  if (
    !fileId ||
    fileId.length > 191 ||
    !Number.isSafeInteger(userId) ||
    userId <= 0
  ) {
    throw new Error("Cannot authorize an invalid media upload");
  }
  const nowMs = options.nowMs ?? Date.now();
  const ttlMs = options.ttlMs ?? MEDIA_CAPABILITY_TTL_MS;
  if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) {
    throw new Error("Media capability TTL must be a positive integer");
  }
  const payload: MediaCapabilityPayload = {
    v: 1,
    fileId,
    userId,
    expiresAt: nowMs + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const signature = capabilitySignature(
    encoded,
    mediaCapabilitySecret(options.secret)
  );
  return `${encoded}.${signature}`;
}

/** Resolves a capability only for the user to whom the upload was issued. */
export function verifyMediaCapability(
  capability: string,
  userId: number,
  options: Pick<MediaCapabilityOptions, "secret" | "nowMs"> = {}
): string {
  const reject = () => {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Photo upload authorization is invalid or expired",
    });
  };
  const parts = capability.split(".");
  if (
    parts.length !== 2 ||
    !BASE64URL_PAYLOAD.test(parts[0]) ||
    !BASE64URL_PAYLOAD.test(parts[1])
  ) {
    return reject();
  }

  const expected = capabilitySignature(
    parts[0],
    mediaCapabilitySecret(options.secret)
  );
  if (!constantTimeEqual(parts[1], expected)) return reject();

  let payload: unknown;
  try {
    const decoded = Buffer.from(parts[0], "base64url");
    if (decoded.toString("base64url") !== parts[0]) return reject();
    payload = JSON.parse(decoded.toString("utf8"));
  } catch {
    return reject();
  }
  const candidate = payload as Partial<MediaCapabilityPayload>;
  const nowMs = options.nowMs ?? Date.now();
  if (
    candidate.v !== 1 ||
    typeof candidate.fileId !== "string" ||
    !candidate.fileId ||
    candidate.fileId.length > 191 ||
    candidate.userId !== userId ||
    typeof candidate.expiresAt !== "number" ||
    !Number.isSafeInteger(candidate.expiresAt) ||
    candidate.expiresAt <= nowMs
  ) {
    return reject();
  }
  return candidate.fileId;
}

async function validateImageBytes(
  buf: Buffer,
  mime: SupportedImageMime
): Promise<void> {
  const expectedFormat = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
  }[mime];
  let image: ReturnType<typeof sharp>;
  let metadata: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    image = sharp(buf, {
      failOn: "warning",
      limitInputPixels: MAX_IMAGE_PIXELS,
    });
    metadata = await image.metadata();
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Photo bytes do not match the declared ${mime} format`,
    });
  }
  if (metadata.format !== expectedFormat) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Photo bytes do not match the declared ${mime} format`,
    });
  }
  const { width, height } = metadata;
  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    width <= 0 ||
    height <= 0 ||
    width > MAX_IMAGE_DIMENSION ||
    height > MAX_IMAGE_DIMENSION ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Photo dimensions are invalid or exceed the safe processing limit",
    });
  }

  try {
    // A header-only metadata probe can accept a truncated pseudo-image. Force
    // a complete bounded pixel decode before the original bytes reach storage.
    await image.raw().toBuffer();
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Photo container is incomplete or cannot be decoded",
    });
  }
}

export async function decodeImageDataUrl(dataUrl: string): Promise<{
  buf: Buffer;
  mime: SupportedImageMime;
}> {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (
    !match ||
    !allowedMimeTypes.has(match[1]) ||
    !BASE64_PAYLOAD.test(match[2])
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Photo must be a valid JPEG, PNG, or WebP data URL",
    });
  }

  const buf = Buffer.from(match[2], "base64");
  const normalizedInput = match[2].replace(/=+$/, "");
  const normalizedDecoded = buf.toString("base64").replace(/=+$/, "");
  if (!buf.length || normalizedInput !== normalizedDecoded) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid base64 image data",
    });
  }
  if (buf.length > PhotoUpload.maxBytesPerPhoto) {
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: `Photo exceeds ${PhotoUpload.maxBytesPerPhoto / 1024 / 1024} MiB`,
    });
  }

  const mime = match[1] as SupportedImageMime;
  await validateImageBytes(buf, mime);

  return {
    buf,
    mime,
  };
}
