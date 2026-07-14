import { readFileSync } from 'node:fs';

function loadKey(
  b64: string | undefined,
  filePath: string | undefined,
): string {
  if (filePath) {
    return readFileSync(filePath, 'utf8');
  }
  if (b64) {
    return Buffer.from(b64, 'base64').toString('utf8');
  }
  throw new Error(
    'No RSA key source provided (expected *_B64 or *_FILE env var)',
  );
}

export interface RsaKeyPair {
  privateKey: string;
  publicKey: string;
}

export function loadRsaKeyPair(env: {
  privateKeyB64?: string;
  privateKeyFile?: string;
  publicKeyB64?: string;
  publicKeyFile?: string;
}): RsaKeyPair {
  return {
    privateKey: loadKey(env.privateKeyB64, env.privateKeyFile),
    publicKey: loadKey(env.publicKeyB64, env.publicKeyFile),
  };
}
