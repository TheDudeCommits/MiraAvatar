import assert from "node:assert/strict";
import test from "node:test";
import {
  createCsrfToken,
  isValidCsrfToken,
  logInfoEvent,
  sanitizeForLog,
} from "../security";

test("creates unpredictable, distinct CSRF tokens and compares them safely", () => {
  const first = createCsrfToken();
  const second = createCsrfToken();

  assert.notEqual(first, second);
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(isValidCsrfToken(first, first), true);
  assert.equal(isValidCsrfToken(first, second), false);
  assert.equal(isValidCsrfToken(first, `${first}x`), false);
  assert.equal(isValidCsrfToken(undefined, first), false);
});

test("removes log-control characters and bounds untrusted fields", () => {
  assert.equal(sanitizeForLog("line1\nline2\r\u001b[31m", 12), "line1 line2 ");
  assert.equal(sanitizeForLog("abcdef", 3), "abc");
});

test("structured event logging cannot forge an additional log line", () => {
  const originalConsoleLog = console.log;
  const records: unknown[][] = [];
  console.log = (...values: unknown[]) => {
    records.push(values);
  };

  try {
    logInfoEvent("remote\nvalue", { characterCount: 42 });
  } finally {
    console.log = originalConsoleLog;
  }

  assert.equal(records.length, 1);
  assert.equal(records[0].length, 1);
  assert.equal(typeof records[0][0], "string");
  assert.doesNotMatch(records[0][0] as string, /[\r\n]/);
  assert.deepEqual(JSON.parse(records[0][0] as string), {
    event: "remote\nvalue",
    characterCount: 42,
  });
});
