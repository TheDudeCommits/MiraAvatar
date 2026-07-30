import assert from "node:assert/strict";
import test from "node:test";
import {
  decodePdfLiteral,
  extractPdfLiteralText,
} from "./pdf-parser";

test("decodes PDF escapes exactly once", () => {
  assert.equal(
    decodePdfLiteral(String.raw`Line\nPath\\File \(ok\) \101`),
    "Line Path\\File (ok) A",
  );
  assert.equal(decodePdfLiteral(String.raw`\\n`), "\\n");
});

test("extracts nested and escaped literal strings from PDF text objects", () => {
  const source =
    "%PDF-1.7\nBT (Hello\\040world) Tj [(nested \\(value\\))] TJ ET\n%%EOF";

  assert.equal(extractPdfLiteralText(source), "Hello world nested (value)");
});

test("handles adversarial unterminated text objects in linear time", () => {
  const source = `%PDF-1.7\nBT (${"(".repeat(300_000)}\nET\n%%EOF`;
  const startedAt = performance.now();

  assert.equal(extractPdfLiteralText(source), "");
  assert.ok(
    performance.now() - startedAt < 2_000,
    "unterminated literal scan exceeded two seconds",
  );
});
