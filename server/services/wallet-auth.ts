import { SiweMessage } from "siwe";
import { z } from "zod";

const MAX_MESSAGE_AGE_MS = 10 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 60 * 1000;

const walletAuthPayloadSchema = z
  .object({
    message: z.string().min(1).max(4096),
    signature: z
      .string()
      .min(4)
      .max(4096)
      .regex(/^0x(?:[0-9a-fA-F]{2})+$/),
  })
  .strict();

export type WalletAuthPayload = z.infer<typeof walletAuthPayloadSchema>;

export function parseWalletAuthPayload(value: unknown): WalletAuthPayload {
  return walletAuthPayloadSchema.parse(value);
}

export async function verifyWalletAuthentication(
  payload: WalletAuthPayload,
  expectedNonce: string,
  expectedDomain: string,
  now = new Date(),
): Promise<string> {
  if (!expectedNonce || !expectedDomain) {
    throw new Error("Wallet authentication challenge is missing");
  }

  const message = new SiweMessage(payload.message);
  const verification = await message.verify(
    {
      signature: payload.signature,
      nonce: expectedNonce,
      domain: expectedDomain,
      time: now.toISOString(),
    },
    { suppressExceptions: true },
  );

  if (!verification.success) {
    throw new Error("Wallet authentication signature is invalid");
  }

  const issuedAt = verification.data.issuedAt
    ? Date.parse(verification.data.issuedAt)
    : Number.NaN;
  const expirationTime = verification.data.expirationTime
    ? Date.parse(verification.data.expirationTime)
    : Number.NaN;
  const currentTime = now.getTime();

  if (
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expirationTime) ||
    issuedAt > currentTime + MAX_CLOCK_SKEW_MS ||
    currentTime - issuedAt > MAX_MESSAGE_AGE_MS ||
    expirationTime <= currentTime ||
    expirationTime - issuedAt > MAX_MESSAGE_AGE_MS + MAX_CLOCK_SKEW_MS
  ) {
    throw new Error("Wallet authentication message is outside its validity window");
  }

  const messageUri = new URL(verification.data.uri);
  if (
    !["http:", "https:"].includes(messageUri.protocol) ||
    messageUri.host !== expectedDomain
  ) {
    throw new Error("Wallet authentication URI does not match this application");
  }

  return verification.data.address;
}
