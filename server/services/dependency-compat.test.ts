import assert from "node:assert/strict";
import test from "node:test";
import {
  insertChatMessageSchema,
  insertCvAnalysisSchema,
} from "../../shared/schema";
import { HardenedTwitterStrategy } from "./twitter-strategy";

test("the hardened Twitter strategy avoids legacy XML error parsing", () => {
  const strategy = new HardenedTwitterStrategy(
    {
      consumerKey: "test-consumer-key",
      consumerSecret: "test-consumer-secret",
      callbackURL: "https://example.test/auth/twitter/callback",
    },
    (_token, _tokenSecret, _profile, done) => done(null, {}),
  );
  const parseErrorResponse = (
    strategy as unknown as {
      parseErrorResponse(body: string, status: number): Error;
    }
  ).parseErrorResponse.bind(strategy);

  const error = parseErrorResponse(
    "<errors><error>Authorization denied</error></errors>",
    401,
  );
  assert.equal(error.message, "Twitter authentication failed");
});

test("Drizzle insert schemas retain their runtime validation behavior", () => {
  assert.deepEqual(
    insertCvAnalysisSchema.parse({
      fileName: "candidate.pdf",
      extractedText: "Experienced software engineer",
    }),
    {
      fileName: "candidate.pdf",
      extractedText: "Experienced software engineer",
    },
  );
  assert.throws(() =>
    insertChatMessageSchema.parse({
      message: "Question",
      response: 42,
    }),
  );
});
