import test from 'node:test';
import assert from 'node:assert/strict';
import { dueEntries, run } from '../scheduled-release.mjs';
import { sha256 } from '../publishing-common.mjs';

const plan = { releases: [
  { version: '3.4.1', publishAt: '2026-10-21T08:00:00+02:00', expiresAt: '2026-10-21T10:00:00+02:00' },
  { version: '3.4.2', publishAt: '2026-10-21T12:00:00+02:00', expiresAt: '2026-10-21T14:00:00+02:00' }
] };
const now = Date.parse('2026-10-21T06:00:00Z');
const reply = data => ({ ok: true, status: 200, json: async () => data });
test('Berlin: niemals vor 08:00, zweiter Termin erst 12:00', () => {
  assert.deepEqual(dueEntries(plan, now - 1), []);
  assert.equal(dueEntries(plan, now)[0].version, '3.4.1');
  assert.equal(dueEntries(plan, Date.parse('2026-10-21T10:00:00Z'))[0].version, '3.4.2');
});
test('Abgelaufene Termine bleiben aus; keine spaetere Ueberraschungsfreigabe', () => {
  assert.deepEqual(dueEntries(plan, Date.parse('2026-10-22T00:00:00Z')), []);
});
test('Fehlende Foundry-Bestaetigung bleibt nach Zeitfenster sichtbar, ohne erneuten API-Schreibzugriff', async () => {
  const result=await run({plan,now:Date.parse('2026-10-22T00:00:00Z'),dryRun:false,request:async(url,options)=>{
    assert.equal(options.method,'GET');
    return reply([{tag_name:'v3.4.1',draft:false,body:'<!-- scheduled-release:3.4.1 -->\n<!-- foundry-attempted:3.4.1 -->'}]);
  }});
  assert.match(result[0],/warning.*weiterhin NICHT bestaetigt/);
});
test('Doppelte und ungueltige Termine werden abgelehnt', () => {
  assert.throws(() => dueEntries({ releases: [plan.releases[0], plan.releases[0]] }, now));
  assert.throws(() => dueEntries({ releases: [{ version: 'x' }] }, now));
});
test('Vor Termin keine API-Aufrufe oder Mutationen', async () => {
  await run({ plan, now: now - 1, dryRun: false, request: () => assert.fail('API vor Termin') });
});
test('Fehlender Entwurf erstellt oder publiziert nichts', async () => {
  const calls = [];
  const result = await run({ plan, now, dryRun: false, request: async (url, options) => {
    calls.push(options.method); return reply([]);
  } });
  assert.deepEqual(calls, ['GET']);
  assert.match(result[0], /Noch kein Entwurf/);
});
test('Bereits abgeschlossene Freigabe wird nicht wiederholt', async () => {
  const r = { tag_name: 'v3.4.1', draft: false, body: '<!-- scheduled-release:3.4.1 -->\n<!-- foundry-published:3.4.1 -->' };
  const result = await run({ plan, now, dryRun: false, request: async (url, options) => {
    assert.equal(options.method, 'GET'); return reply([r]);
  } });
  assert.match(result[0], /Bereits veroeffentlicht/);
});
test('Unklarer Foundry-Versuch wird nicht blind erneut gesendet', async () => {
  const r = { tag_name: 'v3.4.1', draft: false, body: '<!-- scheduled-release:3.4.1 -->\n<!-- foundry-attempted:3.4.1 -->' };
  await assert.rejects(run({ plan, now, dryRun: false, request: async (url, options) => {
    assert.equal(options.method, 'GET'); return reply([r]);
  } }), /manuell pruefen/);
});
test('Unvollstaendiger Entwurf wird nicht publiziert, auch nicht bei Fälligkeit', async () => {
  await assert.rejects(run({ plan, now, dryRun: false, request: async (url, options) => {
    assert.equal(options.method, 'GET');
    return url.includes('/latest') ? { ok: false, status: 404 } : reply([{ tag_name: 'v3.4.1', draft: true, assets: [] }]);
  } }), /Datei fehlt/);
});
test('Neuere aktuelle Version wird niemals zurueckgestuft', async () => {
  const result = await run({ plan, now, dryRun: false, request: async (url, options) => {
    assert.equal(options.method, 'GET');
    return reply(url.includes('/latest') ? { tag_name: 'v3.4.2' } : [{ tag_name: 'v3.4.1', draft: true }]);
  } });
  assert.match(result[0], /keine Rueckstufung/);
});

function fixture() {
  const v = '3.4.1';
  const manifest = { id: 'taverngames', version: v, compatibility: { minimum: '14.369', verified: '14.369' },
    manifest: 'https://github.com/666Arukard/taverngames/releases/latest/download/module.json',
    download: `https://github.com/666Arukard/taverngames/releases/download/v${v}/taverngames-${v}.zip` };
  const content = Buffer.from(JSON.stringify(manifest));
  const name = Buffer.from('module.json');
  const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(name.length, 26);
  const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50); central.writeUInt32LE(content.length, 20); central.writeUInt16LE(name.length, 28);
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(1, 10); end.writeUInt32LE(local.length + name.length + content.length, 16);
  const zip = Buffer.concat([local, name, content, central, name, end]);
  const titles = { patchnotes: 'Patchnotes Version 3.4.1', games: 'aktuelle Spiele (1)', plans: 'geplante Spiele (1)',
    plans2: 'geplante Funktionen (1)', functions: 'aktuelle Funktionen (1)', settings: 'Einstellungen in Foundry', sources: 'Regelquellen (1)', sources1: 'Hausvarianten' };
  const website = { schemaVersion: 1, version: v, blocks: Object.fromEntries(Object.entries(titles).map(([k, title]) => [k, { title, paragraphs: ['Test'], items: ['Test'] }])) };
  const data = [zip, content, Buffer.from(JSON.stringify(website))];
  const assets = [`taverngames-${v}.zip`, 'module.json', 'website.json'].map((name, id) => ({ name, id, state: 'uploaded', size: data[id].length, digest: `sha256:${sha256(data[id])}` }));
  return { release: { id: 99, tag_name: `v${v}`, draft: true, body: 'Testhinweise', assets }, data };
}
for (const dryRun of [true, false]) test(`Vollstaendige Assets: ${dryRun ? 'Probelauf ohne Schreibzugriff' : 'GitHub und Foundry genau einmal in Reihenfolge'}`, async () => {
  const { release, data } = fixture(); const writes = [];
  const result = await run({ plan, now, dryRun, token: 'test-token', foundryToken: 'fvttp_test', request: async (url, options) => {
    if (options.method === 'PATCH' || options.method === 'POST') { const body=JSON.parse(options.body); writes.push({ url, body }); return reply({ status: 'success' }); }
    if (url.includes('/assets/')) return { ok: true, arrayBuffer: async () => data[Number(url.split('/').at(-1))] };
    return reply(url.endsWith('/latest') ? { tag_name: 'v3.4.0' } : [release]);
  } });
  if (dryRun) { assert.equal(writes.length, 0); assert.match(result[0], /Dry-run/); }
  else {
    assert.equal(writes.length, 4); assert.equal(writes[0].body.draft, false);
    assert.match(writes[1].body.body, /foundry-attempted/);
    assert.equal(writes[2].body.release.version, '3.4.1');
    assert.match(writes[3].body.body, /foundry-published/);
  }
});
