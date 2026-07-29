import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SafeMessageContent } from "../../client/src/lib/safe-message-content";

test("renders limited formatting while escaping executable markup", () => {
  const malicious =
    '# <script>alert("x")</script>\n<img src=x onerror=alert(1)>\n**safe emphasis**';
  const html = renderToStaticMarkup(
    createElement(SafeMessageContent, { content: malicious }),
  );

  assert.match(html, /<h1/);
  assert.match(html, /<strong/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<script/);
  assert.doesNotMatch(html, /<img/);
});
