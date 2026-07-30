import assert from "node:assert/strict";
import test from "node:test";
import { csrfFetch } from "../../client/src/lib/queryClient";

test("adds a CSRF token to mutations and refreshes a rejected token once", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ input: string; init: RequestInit }> = [];
  let tokenRequestCount = 0;
  let mutationCount = 0;

  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({ input: String(input), init });
    if (String(input) === "/auth/csrf-token") {
      tokenRequestCount += 1;
      return Response.json({ csrfToken: `token-${tokenRequestCount}` });
    }

    mutationCount += 1;
    if (mutationCount === 1) {
      return Response.json(
        { error: "Invalid CSRF token" },
        {
          status: 403,
          headers: { "X-CSRF-Error": "invalid-token" },
        },
      );
    }
    return Response.json({ ok: true });
  }) as typeof fetch;

  try {
    const response = await csrfFetch("/api/example", {
      method: "POST",
      body: JSON.stringify({ value: 1 }),
    });

    assert.equal(response.status, 200);
    assert.equal(tokenRequestCount, 2);
    assert.equal(mutationCount, 2);
    assert.equal(
      new Headers(calls[1].init.headers).get("X-CSRF-Token"),
      "token-1",
    );
    assert.equal(
      new Headers(calls[3].init.headers).get("X-CSRF-Token"),
      "token-2",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
