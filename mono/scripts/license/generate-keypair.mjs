#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const privatePath = resolve(arg('--private', '.license/tao-private.jwk'));
const publicPath = arg('--public', null);

const keyPair = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['sign', 'verify']
);

const privateJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);

await mkdir(dirname(privatePath), { recursive: true });
await writeFile(privatePath, `${JSON.stringify(privateJwk, null, 2)}\n`, { mode: 0o600 });

if (publicPath) {
  const resolvedPublicPath = resolve(publicPath);
  await mkdir(dirname(resolvedPublicPath), { recursive: true });
  await writeFile(resolvedPublicPath, `${JSON.stringify(publicJwk, null, 2)}\n`);
}

console.log(`Private key written to ${privatePath}`);
console.log('Public JWK for src/lib/license/config.ts:');
console.log(JSON.stringify(publicJwk, null, 2));
