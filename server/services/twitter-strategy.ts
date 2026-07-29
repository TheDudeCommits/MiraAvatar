import { Strategy as PassportTwitterStrategy } from "passport-twitter";

/**
 * passport-twitter falls back to an obsolete XML parser for non-JSON OAuth
 * errors. Twitter's API is JSON-based, so avoid that legacy parser entirely and
 * keep upstream error bodies out of application errors and logs.
 */
export class HardenedTwitterStrategy extends PassportTwitterStrategy {
  parseErrorResponse(_body: string, _status: number): Error {
    return new Error("Twitter authentication failed");
  }
}
