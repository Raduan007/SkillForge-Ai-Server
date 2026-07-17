/**
 * postinstall.mjs
 *
 * Re-creates directory junctions so that @typescript-eslint packages (which
 * require TypeScript ≤6) resolve to the @typescript/typescript6 compat shim
 * instead of the project's TypeScript 7 installation.
 *
 * Background: TypeScript 7 ships a Go-based compiler and does not yet expose
 * the stable programmatic API that @typescript-eslint depends on. The official
 * workaround (per the TypeScript team) is to keep a TypeScript 6 copy around
 * for tooling. This script automates that wiring after every `npm install`.
 *
 * See: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-7-0.html
 */

import { mkdirSync, existsSync, rmSync, symlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const ts6Source = resolve(root, 'node_modules/@typescript/typescript6');

/** Packages that load TypeScript at module-init time and break on TS7 */
const targets = [
  'node_modules/@typescript-eslint/typescript-estree',
  'node_modules/@typescript-eslint/type-utils',
  'node_modules/@typescript-eslint/eslint-plugin',
  'node_modules/ts-api-utils',
];

for (const target of targets) {
  const nmDir = resolve(root, target, 'node_modules');
  const tsLink = resolve(nmDir, 'typescript');

  // Remove stale junction if it exists
  if (existsSync(tsLink)) {
    rmSync(tsLink, { recursive: true, force: true });
  }

  mkdirSync(nmDir, { recursive: true });

  try {
    // Use 'junction' on Windows (works without admin rights), 'dir' on Unix
    symlinkSync(ts6Source, tsLink, process.platform === 'win32' ? 'junction' : 'dir');
    console.log(`[postinstall] Linked ${target}/node_modules/typescript → @typescript/typescript6`);
  } catch (err) {
    console.warn(`[postinstall] Could not link ${tsLink}:`, err.message);
  }
}

console.log('[postinstall] TypeScript 6 shim links created for ESLint compatibility.');
