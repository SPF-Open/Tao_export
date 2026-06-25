#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function requiredArg(name) {
  const value = arg(name);
  if (!value) {
    console.error(`Missing required ${name}`);
    process.exit(1);
  }
  return value;
}

function bytesToBase64Url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

function expiryDateToUnixEndOfDay(dateValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    throw new Error('--expires must use YYYY-MM-DD');
  }
  return Math.floor(Date.parse(`${dateValue}T23:59:59.999Z`) / 1000);
}

const email = requiredArg('--email').trim().toLowerCase();
const expires = requiredArg('--expires');
const name = arg('--name');
const tier = arg('--tier', 'supporter');
const privatePath = resolve(process.env.TAO_LICENSE_PRIVATE_KEY || arg('--private', '.license/tao-private.jwk'));

const privateJwk = JSON.parse(await readFile(privatePath, 'utf8'));
const privateKey = await crypto.subtle.importKey(
  'jwk',
  privateJwk,
  { name: 'ECDSA', namedCurve: 'P-256' },
  false,
  ['sign']
);

const payload = {
  sub: arg('--sub', `lic_${createHash('sha256').update(`${email}:${randomUUID()}`).digest('hex').slice(0, 18)}`),
  email,
  ...(name ? { name } : {}),
  exp: expiryDateToUnixEndOfDay(expires),
  iat: Math.floor(Date.now() / 1000),
  tier,
  version: 1
};

const payloadSegment = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
const signedData = new TextEncoder().encode(`tao1.${payloadSegment}`);
const signature = await crypto.subtle.sign(
  { name: 'ECDSA', hash: 'SHA-256' },
  privateKey,
  signedData
);

console.log(`tao1.${payloadSegment}.${bytesToBase64Url(new Uint8Array(signature))}`);
console.error(`Issued to ${payload.name ? `${payload.name} <${payload.email}>` : payload.email}`);
console.error(`Expires ${expires} 23:59:59 UTC`);
