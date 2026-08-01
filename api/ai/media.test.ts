import { describe, expect, it } from "vitest";
import { PhotoUpload } from "@contracts/constants";
import sharp from "sharp";
import {
  decodeImageDataUrl,
  issueMediaCapability,
  mediaProxyUrl,
  privateMediaProxyUrl,
  verifyMediaCapability,
} from "./media";

const ONE_PIXEL_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const TEST_SECRET = "test-only-media-capability-secret";

describe("media helpers", () => {
  it("encodes opaque file ids into a stable same-origin proxy URL", () => {
    expect(mediaProxyUrl("folder/a b?c")).toBe("/api/media/folder%2Fa%20b%3Fc");
  });

  it("accepts an image whose bytes and dimensions match its declared type", async () => {
    const decoded = await decodeImageDataUrl(
      `data:image/png;base64,${ONE_PIXEL_PNG}`
    );
    expect(decoded.mime).toBe("image/png");
    expect(decoded.buf.subarray(12, 16).toString("ascii")).toBe("IHDR");
  });

  it("fully decodes each supported image format", async () => {
    const source = {
      create: {
        width: 2,
        height: 2,
        channels: 3 as const,
        background: { r: 20, g: 40, b: 60 },
      },
    };
    const fixtures = [
      ["image/jpeg", await sharp(source).jpeg().toBuffer()],
      ["image/png", await sharp(source).png().toBuffer()],
      ["image/webp", await sharp(source).webp().toBuffer()],
    ] as const;

    for (const [mime, bytes] of fixtures) {
      const decoded = await decodeImageDataUrl(
        `data:${mime};base64,${bytes.toString("base64")}`
      );
      expect(decoded.mime).toBe(mime);
      expect(decoded.buf).toEqual(bytes);
    }
  });

  it.each([
    "data:image/png;base64,aGVsbG8=",
    `data:image/jpeg;base64,${ONE_PIXEL_PNG}`,
  ])(
    "rejects bytes that do not match the declared image type: %s",
    async value => {
      await expect(decodeImageDataUrl(value)).rejects.toThrow(/do not match/i);
    }
  );

  it.each([
    "data:text/plain;base64,aGVsbG8=",
    "data:image/gif;base64,R0lGODlh",
    "data:image/png;base64,%%broken%%",
    "data:image/png;base64,",
  ])("rejects unsupported or malformed data: %s", async value => {
    await expect(decodeImageDataUrl(value)).rejects.toThrow();
  });

  it("rejects decoded payloads above the shared limit", async () => {
    const oversized = Buffer.alloc(PhotoUpload.maxBytesPerPhoto + 1).toString(
      "base64"
    );
    await expect(
      decodeImageDataUrl(`data:image/jpeg;base64,${oversized}`)
    ).rejects.toThrow(/exceeds/i);
  });

  it("rejects a truncated PNG that only contains a plausible header", async () => {
    const pseudoPng = Buffer.alloc(24);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(
      pseudoPng
    );
    pseudoPng.writeUInt32BE(13, 8);
    pseudoPng.write("IHDR", 12, "ascii");
    pseudoPng.writeUInt32BE(1, 16);
    pseudoPng.writeUInt32BE(1, 20);

    await expect(
      decodeImageDataUrl(
        `data:image/png;base64,${pseudoPng.toString("base64")}`
      )
    ).rejects.toThrow();
  });

  it("issues a user-bound, expiring upload capability", () => {
    const capability = issueMediaCapability("gateway/file-7", 42, {
      secret: TEST_SECRET,
      nowMs: 1_000,
      ttlMs: 5_000,
    });

    expect(privateMediaProxyUrl(capability)).toMatch(
      /^\/api\/media\/private\//
    );
    expect(
      verifyMediaCapability(capability, 42, {
        secret: TEST_SECRET,
        nowMs: 5_999,
      })
    ).toBe("gateway/file-7");
    expect(() =>
      verifyMediaCapability(capability, 7, {
        secret: TEST_SECRET,
        nowMs: 5_999,
      })
    ).toThrow(/invalid or expired/i);
    expect(() =>
      verifyMediaCapability(capability, 42, {
        secret: TEST_SECRET,
        nowMs: 6_000,
      })
    ).toThrow(/invalid or expired/i);
  });

  it("rejects a tampered upload capability", () => {
    const capability = issueMediaCapability("gateway/file-7", 42, {
      secret: TEST_SECRET,
      nowMs: 1_000,
    });
    const tampered = `${capability.slice(0, -1)}${capability.endsWith("A") ? "B" : "A"}`;
    expect(() =>
      verifyMediaCapability(tampered, 42, {
        secret: TEST_SECRET,
        nowMs: 2_000,
      })
    ).toThrow(/invalid or expired/i);
  });
});
