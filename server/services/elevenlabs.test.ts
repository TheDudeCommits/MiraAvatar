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
