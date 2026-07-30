import assert from "node:assert/strict";
import test from "node:test";
import { Wallet } from "ethers";
import { SiweMessage } from "siwe";
import {
  parseWalletAuthPayload,
  verifyWalletAuthentication,
} from "./wallet-auth";

const domain = "example.test";
const nonce = "A1b2C3d4E5f6";
const now = new Date("2026-07-29T12:00:00.000Z");

async function signedPayload(overrides: Partial<SiweMessage> = {}) {
  const wallet = Wallet.createRandom();
  const message = new SiweMessage({
    domain,
    address: wallet.address,
    statement: "Sign in to AskMira.",
    uri: `https://${domain}`,
    version: "1",
    chainId: 1,
    nonce,
    issuedAt: now.toISOString(),
    expirationTime: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
    ...overrides,
  }).prepareMessage();

  return {
    address: wallet.address,
    payload: {
      message,
      signature: await wallet.signMessage(message),
    },
  };
}

test("verifies an unexpired SIWE message bound to the nonce and domain", async () => {
  const { address, payload } = await signedPayload();
  assert.equal(
    await verifyWalletAuthentication(payload, nonce, domain, now),
    address,
  );
});

test("rejects a SIWE message with a different nonce or domain", async () => {
  const { payload } = await signedPayload();

  await assert.rejects(
    verifyWalletAuthentication(payload, "DifferentNonce1", domain, now),
  );
  await assert.rejects(
    verifyWalletAuthentication(payload, nonce, "attacker.example", now),
  );
});

test("rejects expired and overlong SIWE validity windows", async () => {
  const expired = await signedPayload({
    expirationTime: new Date(now.getTime() - 1).toISOString(),
  });
  await assert.rejects(
    verifyWalletAuthentication(expired.payload, nonce, domain, now),
  );

  const overlong = await signedPayload({
    expirationTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
  });
  await assert.rejects(
    verifyWalletAuthentication(overlong.payload, nonce, domain, now),
  );
});

test("accepts only the strict wallet payload shape", () => {
  assert.throws(() =>
    parseWalletAuthPayload({
      message: "message",
      signature: "0x00",
      address: "0x0000000000000000000000000000000000000000",
    }),
  );
  assert.throws(() =>
    parseWalletAuthPayload({ message: "", signature: "not-a-signature" }),
  );
});
