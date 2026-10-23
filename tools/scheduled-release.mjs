import { readFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { zipManifest, sha256 } from './publishing-common.mjs';
import { validateWebsite } from './github-release.mjs';

const repo = '666Arukard/taverngames';
const apiBase = `https://api.github.com/repos/${repo}`;
export function dueEntries(plan, now) {
  const seen = new Set();
  for (const e of plan.releases) {
    if (!/^\d+\.\d+\.\d+$/.test(e.version) || seen.has(e.version) ||
        !Number.isFinite(Date.parse(e.publishAt)) || !Number.isFinite(Date.parse(e.expiresAt)) ||
        Date.parse(e.expiresAt) <= Date.parse(e.publishAt)) throw new Error('Zeitplan ungueltig.');
    seen.add(e.version);
  }
  return plan.releases.filter(e => now >= Date.parse(e.publishAt) && now < Date.parse(e.expiresAt));
}
export function verifyAssets(version, manifest, website, zip) {
  const base = `https://github.com/${repo}/releases`;
  if (manifest.id !== 'taverngames' || manifest.version !== version ||
      manifest.manifest !== `${base}/latest/download/module.json` ||
      manifest.download !== `${base}/download/v${version}/taverngames-${version}.zip` ||
      manifest.compatibility?.minimum !== '14.369' || manifest.compatibility?.verified !== '14.369' ||
      manifest.compatibility?.maximum || !isDeepStrictEqual(zipManifest(zip), manifest)) {
    throw new Error('Release-Manifest oder ZIP passt nicht zum Zeitplan.');
  }
  validateWebsite(website, version);
  if (website.version && website.version !== version) throw new Error('Website-Version passt nicht.');
}
export async function run({ now = Date.now(), dryRun = true, request = fetch, plan,
  foundryEnabled = process.env.FOUNDRY_RELEASES_ENABLED !== 'false',
  useFoundryPolicy = process.env.FOUNDRY_RELEASE_POLICY === 'true',
  token = process.env.GH_TOKEN, foundryToken = process.env.FOUNDRY_RELEASE_TOKEN } = {}) {
  const notices = [];
  async function api(path, method = 'GET', body) {
    const r = await request(apiBase + path, { method, headers: {
      Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
      'User-Agent': 'TavernGames-Scheduler', 'Content-Type': 'application/json'
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (r.status === 404 && method === 'GET') return null;
    if (!r.ok) throw new Error(`GitHub ${method}: HTTP ${r.status}`);
    return r.json();
  }
  const entries = dueEntries(plan, now);
  const expired = plan.releases.filter(e => now >= Date.parse(e.expiresAt));
  if (!entries.length && !expired.length) return ['Kein Release faellig; keine Aenderung.'];
  const releases = [];
  for (let page = 1; ; page++) {
    const part = await api(`/releases?per_page=100&page=${page}`);
    releases.push(...part);
    if (part.length < 100) break;
  }
  for (const entry of expired) {
    const release = releases.find(r => r.tag_name === `v${entry.version}`);
    if (release && !release.draft && release.body?.includes(`<!-- scheduled-release:${entry.version} -->`) &&
        !release.body?.includes(`<!-- foundry-published:${entry.version} -->`)) {
      notices.push(`${foundryEnabled ? '::warning::' : ''}${entry.version}: Auf GitHub veroeffentlicht; Foundry-Eintragung weiterhin NICHT bestaetigt. ${foundryEnabled ? 'Zeitfenster abgelaufen, keine automatische Wiederholung.' : 'Foundry-Veröffentlichungen auf Nutzerwunsch pausiert.'}`);
    }
  }
  if (!entries.length) return [...notices, 'Kein Release faellig; keine Aenderung.'];
  for (const entry of entries) {
    const v = entry.version;
    const started = `<!-- scheduled-release:${v} -->`;
    const done = `<!-- foundry-published:${v} -->`;
    const attempted = `<!-- foundry-attempted:${v} -->`;
    const release = releases.find(r => r.tag_name === `v${v}`);
    if (!release) { notices.push(`${v}: Noch kein Entwurf hochgeladen; nichts veroeffentlicht.`); continue; }
    if (release.prerelease) throw new Error(`${v}: Pre-release statt stabilem Release.`);
    if (!release.draft && (!release.body?.includes(started) || release.body?.includes(done))) {
      notices.push(`${v}: Bereits veroeffentlicht; keine erneute Freigabe.`); continue;
    }
    if (!release.draft && !foundryEnabled) { notices.push(`${v}: GitHub bereits veröffentlicht; Foundry pausiert.`); continue; }
    if (!release.draft && release.body?.includes(attempted)) throw new Error(`${v}: Foundry-Versuch bereits erfolgt; Verzeichnis vor weiterem Eingriff manuell pruefen.`);
    const latest = await api('/releases/latest');
    const newer = latest?.tag_name?.replace(/^v/, '').split('.').map(Number);
    const current = v.split('.').map(Number);
    if (newer && (newer[0] > current[0] || (newer[0] === current[0] && (newer[1] > current[1] || (newer[1] === current[1] && newer[2] > current[2]))))) {
      notices.push(`${v}: Neuere Version bereits aktuell; keine Rueckstufung.`); continue;
    }
    const files = {};
    for (const name of [`taverngames-${v}.zip`, 'module.json', 'website.json']) {
      const a = release.assets.filter(a => a.name === name);
      if (a.length !== 1 || a[0].state !== 'uploaded' || !/^sha256:[a-f0-9]{64}$/.test(a[0].digest ?? '')) throw new Error(`${v}: Datei fehlt oder ist unvollstaendig: ${name}`);
      const response = await request(`${apiBase}/releases/assets/${a[0].id}`, { headers: {
        Authorization: `Bearer ${token}`, Accept: 'application/octet-stream', 'User-Agent': 'TavernGames-Scheduler'
      } });
      if (!response.ok) throw new Error(`${v}: Dateiabruf fehlgeschlagen.`);
      const data = Buffer.from(await response.arrayBuffer());
      if (data.length > 268435456 || data.length !== a[0].size || `sha256:${sha256(data)}` !== a[0].digest) throw new Error(`${v}: Dateipruefsumme falsch.`);
      files[name] = data;
    }
    const manifest = JSON.parse(files['module.json']);
    verifyAssets(v, manifest, JSON.parse(files['website.json']), files[`taverngames-${v}.zip`]);
    if (dryRun) { notices.push(`${v}: Geprueft; Dry-run ohne Veroeffentlichung.`); continue; }
    if (foundryEnabled && !useFoundryPolicy && (!foundryToken?.startsWith('fvttp_') || /\s/.test(foundryToken))) throw new Error('Foundry-Secret fehlt oder ist ungueltig.');
    let body = release.body ?? '';
    if (release.draft) {
      body += `\n\n${started}`;
      await api(`/releases/${release.id}`, 'PATCH', { draft: false, make_latest: 'true', body });
    }
    if (!foundryEnabled) {
      notices.push(`${v}: Auf GitHub veröffentlicht; Foundry-Veröffentlichung auf Nutzerwunsch pausiert.`);
      continue;
    }
    if (useFoundryPolicy) {
      const {publishFoundry}=await import('./foundry-publish.mjs');
      notices.push(await publishFoundry(v,{request,token,foundryToken}));
      continue;
    }
    body += `\n${attempted}`;
    await api(`/releases/${release.id}`, 'PATCH', { body });
    // GITHUB_TOKEN release events do not start another workflow: call Foundry here explicitly.
    const response = await request('https://foundryvtt.com/_api/packages/release_version/', {
      method: 'POST', headers: { Authorization: foundryToken.trim(), 'Content-Type': 'application/json', 'User-Agent': 'TavernGames-Foundry-Release' },
      body: JSON.stringify({ id: 'taverngames', release: { version: v,
        manifest: `https://github.com/${repo}/releases/download/v${v}/module.json`,
        notes: `https://github.com/${repo}/releases/tag/v${v}`,
        compatibility: { minimum: '14.369', verified: '14.369' } } })
    });
    if (!response.ok) throw new Error(`Foundry: HTTP ${response.status}; GitHub bereits veroeffentlicht. Vor erneutem Foundry-Versuch Verzeichnis pruefen.`);
    const result = await response.json();
    if (result.status !== 'success' || result.message?.startsWith('Dry run')) throw new Error('Foundry bestaetigt die Veroeffentlichung nicht.');
    await api(`/releases/${release.id}`, 'PATCH', { body: `${body}\n${done}` });
    notices.push(`${v}: Auf GitHub und bei Foundry veroeffentlicht.`);
  }
  return notices;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const plan = JSON.parse(readFileSync(new URL('../publishing/release-schedule.json', import.meta.url), 'utf8'));
    const notices = await run({ plan, dryRun: process.env.DRY_RUN !== 'false' });
    console.log(notices.join('\n'));
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, notices.join('\n\n') + '\n');
  } catch (error) {
    // Never echo arbitrary server responses or credential-bearing exceptions.
    const message = String(error.message);
    const safe = ![process.env.GH_TOKEN, process.env.FOUNDRY_RELEASE_TOKEN].some(t => t && message.includes(t));
    console.error(safe && !message.includes('fetch') ? message : 'Zeitsteuerung fehlgeschlagen; keine Erfolgsmeldung.');
    process.exitCode = 1;
  }
}
