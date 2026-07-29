import assert from "node:assert/strict";
import test from "node:test";
import {
  createCsrfToken,
  isValidCsrfToken,
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
