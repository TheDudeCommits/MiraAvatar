import assert from "node:assert/strict";
import test from "node:test";

import { createAudioUpload } from "./openai";

test("creates a fixed-name in-memory audio upload", async () => {
  const input = Buffer.from([1, 2, 3, 4]);
  const upload = await createAudioUpload(input);

  assert.equal(upload.name, "audio.wav");
  assert.equal(upload.type, "audio/wav");
  assert.deepEqual(Buffer.from(await upload.arrayBuffer()), input);
});

test("rejects empty audio uploads", async () => {
  await assert.rejects(
    createAudioUpload(Buffer.alloc(0)),
    /Audio upload has an invalid size/,
  );
});

test("accepts an upload above ten MiB within the route limit", async () => {
  const input = Buffer.alloc(10 * 1024 * 1024 + 1);
  const upload = await createAudioUpload(input);

  assert.equal(upload.size, input.length);
});

test("rejects an upload above the route's 25 MiB limit", async () => {
  await assert.rejects(
    createAudioUpload(Buffer.alloc(25 * 1024 * 1024 + 1)),
    /Audio upload has an invalid size/,
  );
});
