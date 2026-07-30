import assert from "node:assert/strict";
import test from "node:test";

import {
  ElevenLabsConfigurationError,
  ElevenLabsService,
} from "./elevenlabs";

test("speech generation fails safely when ELEVENLABS_API_KEY is missing", async () => {
  const originalApiKey = process.env.ELEVENLABS_API_KEY;
  const originalLegacyKey = process.env.ELEVENLABS_KEY;
  const originalConsoleError = console.error;

  delete process.env.ELEVENLABS_API_KEY;
  process.env.ELEVENLABS_KEY = "legacy-alias-must-not-be-used";
  console.error = () => {};

  try {
    const service = new ElevenLabsService();
    await assert.rejects(
      service.generateSpeech("configuration check"),
      (error: unknown) =>
        error instanceof ElevenLabsConfigurationError &&
        error.message ===
          "ELEVENLABS_API_KEY is required for speech generation",
    );
  } finally {
    console.error = originalConsoleError;

    if (originalApiKey === undefined) {
      delete process.env.ELEVENLABS_API_KEY;
    } else {
      process.env.ELEVENLABS_API_KEY = originalApiKey;
    }

    if (originalLegacyKey === undefined) {
      delete process.env.ELEVENLABS_KEY;
    } else {
      process.env.ELEVENLABS_KEY = originalLegacyKey;
    }
  }
});

test("speech generation never logs the configured API key or its prefix", async () => {
  const originalApiKey = process.env.ELEVENLABS_API_KEY;
  const originalFetch = globalThis.fetch;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const apiKey = "credential-value-for-log-test";
  const messages: string[] = [];

  process.env.ELEVENLABS_API_KEY = apiKey;
  globalThis.fetch = async () =>
    ({ ok: false, status: 401 }) as Response;
  console.log = (...args: unknown[]) => {
    messages.push(args.join(" "));
  };
  console.error = (...args: unknown[]) => {
    messages.push(args.join(" "));
  };

  try {
    const service = new ElevenLabsService();
    await assert.rejects(
      service.generateSpeech("logging check"),
      /ElevenLabs speech generation failed/,
    );
    assert.equal(messages.some((message) => message.includes(apiKey)), false);
    assert.equal(
      messages.some((message) => message.includes(apiKey.substring(0, 8))),
      false,
    );
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;

    if (originalApiKey === undefined) {
      delete process.env.ELEVENLABS_API_KEY;
    } else {
      process.env.ELEVENLABS_API_KEY = originalApiKey;
    }
  }
});

test("speech generation returns bounded MPEG audio without writing a file", async () => {
  const originalApiKey = process.env.ELEVENLABS_API_KEY;
  const originalFetch = globalThis.fetch;
  const originalConsoleLog = console.log;
  process.env.ELEVENLABS_API_KEY = "test-only-key";
  console.log = () => {};
  globalThis.fetch = async () =>
    new Response(Uint8Array.from([1, 2, 3]), {
      status: 200,
      headers: {
        "content-length": "3",
        "content-type": "audio/mpeg",
      },
    });

  try {
    const service = new ElevenLabsService();
    assert.equal(
      await service.generateSpeech("safe response"),
      "data:audio/mpeg;base64,AQID",
    );
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalConsoleLog;
    if (originalApiKey === undefined) {
      delete process.env.ELEVENLABS_API_KEY;
    } else {
      process.env.ELEVENLABS_API_KEY = originalApiKey;
    }
  }
});

test("speech generation rejects provider responses with an unexpected type", async () => {
  const originalApiKey = process.env.ELEVENLABS_API_KEY;
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  process.env.ELEVENLABS_API_KEY = "test-only-key";
  console.error = () => {};
  globalThis.fetch = async () =>
    new Response("not audio", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });

  try {
    const service = new ElevenLabsService();
    await assert.rejects(
      service.generateSpeech("unsafe response"),
      /ElevenLabs speech generation failed/,
    );
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalApiKey === undefined) {
      delete process.env.ELEVENLABS_API_KEY;
    } else {
      process.env.ELEVENLABS_API_KEY = originalApiKey;
    }
  }
});

test("speech generation cancels a misdeclared response at the streaming limit", async () => {
  const originalApiKey = process.env.ELEVENLABS_API_KEY;
  const originalFetch = globalThis.fetch;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  let cancelled = false;
  let chunksProduced = 0;

  process.env.ELEVENLABS_API_KEY = "test-only-key";
  console.log = () => {};
  console.error = () => {};
  globalThis.fetch = async () =>
    new Response(
      new ReadableStream<Uint8Array>({
        pull(controller) {
          chunksProduced += 1;
          controller.enqueue(new Uint8Array(1024 * 1024));
        },
        cancel() {
          cancelled = true;
        },
      }),
      {
        status: 200,
        headers: {
          "content-length": "1",
          "content-type": "audio/mpeg",
        },
      },
    );

  try {
    const service = new ElevenLabsService();
    await assert.rejects(
      service.generateSpeech("bounded response"),
      /ElevenLabs speech generation failed/,
    );
    assert.equal(cancelled, true);
    assert.ok(chunksProduced <= 7);
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    if (originalApiKey === undefined) {
      delete process.env.ELEVENLABS_API_KEY;
    } else {
      process.env.ELEVENLABS_API_KEY = originalApiKey;
    }
  }
});
