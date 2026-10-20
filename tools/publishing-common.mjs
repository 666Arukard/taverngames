import { readFileSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const sha256 = data => createHash('sha256').update(data).digest('hex');
export const jsonFile = file => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));

export function insideRoot(file, root = projectRoot) {
  if (typeof file !== 'string' || !file) throw new Error('Dateipfad fehlt.');
  const absolute = realpathSync(resolve(root, file));
  const rel = relative(realpathSync(root), absolute);
  if (rel === '..' || rel.startsWith('../') || rel.startsWith('..\\') || isAbsolute(rel)) {
    throw new Error('Datei liegt außerhalb des Projektordners.');
  }
  return absolute;
}

export function parseArgs(args, allowed) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!Object.hasOwn(allowed, key) || Object.hasOwn(result, key)) throw new Error(`Unbekannte oder doppelte Option: ${key}`);
    if (allowed[key]) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Wert fehlt: ${key}`);
      result[key] = value;
    } else result[key] = true;
  }
  return result;
}

export function httpsUrl(value, allowedHosts) {
  let url;
  try { url = new URL(value); } catch { throw new Error('HTTPS-Adresse fehlt oder ist ungültig.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search || url.port) {
    throw new Error('Nur HTTPS ohne Zugangsdaten, Port, Query oder Fragment erlaubt.');
  }
  if (allowedHosts && !allowedHosts.includes(url.hostname)) throw new Error('Unerwartetes API-Ziel.');
  return url;
}

// Read only the module manifest from the ZIP central directory. Nothing is extracted.
export function zipManifest(zip) {
  let end = -1;
  for (let p = zip.length - 22; p >= Math.max(0, zip.length - 65557); p--) {
    if (zip.readUInt32LE(p) === 0x06054b50 && p + 22 + zip.readUInt16LE(p + 20) === zip.length) { end = p; break; }
  }
  if (end < 0 || zip.readUInt16LE(end + 4) || zip.readUInt16LE(end + 6)) throw new Error('Nicht unterstütztes ZIP.');
  const count = zip.readUInt16LE(end + 10);
  let cursor = zip.readUInt32LE(end + 16);
  if (count === 65535 || cursor === 0xffffffff) throw new Error('ZIP64 wird nicht unterstützt.');
  const found = [];
  for (let i = 0; i < count; i++) {
    if (zip.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Beschädigtes ZIP-Verzeichnis.');
    const flags = zip.readUInt16LE(cursor + 8);
    const method = zip.readUInt16LE(cursor + 10);
    const size = zip.readUInt32LE(cursor + 20);
    const nameLength = zip.readUInt16LE(cursor + 28);
    const name = zip.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8').replaceAll('\\', '/');
    if (name === 'taverngames/module.json' || name === 'module.json') {
      if (flags & 1 || ![0, 8].includes(method)) throw new Error('Nicht unterstütztes ZIP-Manifest.');
      const offset = zip.readUInt32LE(cursor + 42);
      if (zip.readUInt32LE(offset) !== 0x04034b50) throw new Error('ZIP-Dateikopf fehlt.');
      const start = offset + 30 + zip.readUInt16LE(offset + 26) + zip.readUInt16LE(offset + 28);
      if (start + size > zip.length) throw new Error('ZIP-Manifest ist abgeschnitten.');
      const raw = zip.subarray(start, start + size);
      const data = method === 8 ? inflateRawSync(raw, { maxOutputLength: 1024 * 1024 }) : raw;
      if (data.length > 1024 * 1024) throw new Error('ZIP-Manifest zu groß.');
      found.push(JSON.parse(data.toString('utf8').replace(/^\uFEFF/, '')));
    }
    cursor += 46 + nameLength + zip.readUInt16LE(cursor + 30) + zip.readUInt16LE(cursor + 32);
  }
  if (found.length !== 1) throw new Error('Genau ein Modulmanifest im ZIP erwartet.');
  return found[0];
}

export async function responseJson(response, purpose) {
  if (!response.ok) throw new Error(`${purpose}: HTTP ${response.status}.`);
  try { return await response.json(); } catch { throw new Error(`${purpose}: keine JSON-Antwort.`); }
}
