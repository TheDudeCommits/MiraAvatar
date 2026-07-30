import { randomBytes, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";

declare module "express-session" {
  interface SessionData {
    csrfToken?: string;
    walletNonce?: string;
  }
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_HEADER = "x-csrf-token";
const MAX_CSRF_TOKEN_LENGTH = 256;

function rateLimitResponse(message: string) {
  return {
    statusCode: 429,
    message: { error: message },
  };
}

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  ...rateLimitResponse("Too many requests; please try again later"),
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  ...rateLimitResponse("Too many authentication attempts; please try again later"),
});

export const staticRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  ...rateLimitResponse("Too many asset requests; please try again shortly"),
});

export function createCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isValidCsrfToken(expected: unknown, provided: unknown): boolean {
  if (
    typeof expected !== "string" ||
    typeof provided !== "string" ||
    expected.length === 0 ||
    provided.length === 0 ||
    expected.length > MAX_CSRF_TOKEN_LENGTH ||
    provided.length > MAX_CSRF_TOKEN_LENGTH
  ) {
    return false;
  }

  const expectedBytes = Buffer.from(expected, "utf8");
  const providedBytes = Buffer.from(provided, "utf8");
  return (
    expectedBytes.length === providedBytes.length &&
    timingSafeEqual(expectedBytes, providedBytes)
  );
}

export const issueCsrfToken: RequestHandler = (req, res) => {
  const csrfToken = req.session.csrfToken ?? createCsrfToken();
  req.session.csrfToken = csrfToken;
  res.set("Cache-Control", "no-store");
  res.json({ csrfToken });
};

export const csrfProtection: RequestHandler = (req, res, next) => {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  const suppliedCsrfToken = req.get(CSRF_HEADER);
  if (!isValidCsrfToken(req.session.csrfToken, suppliedCsrfToken)) {
    res.set("X-CSRF-Error", "invalid-token");
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  next();
};

export function sanitizeForLog(value: unknown, maxLength = 200): string {
  return String(value)
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .slice(0, maxLength);
}

type SafeLogMetadata = Record<string, number | boolean | null>;

export function logInfoEvent(
  event: string,
  metadata: SafeLogMetadata = {},
): void {
  console.log(JSON.stringify({ event, ...metadata }));
}

export function logErrorEvent(event: string): void {
  console.error(JSON.stringify({ event }));
}
