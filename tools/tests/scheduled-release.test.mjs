import test from 'node:test';
import assert from 'node:assert/strict';
import { dueEntries, run } from '../scheduled-release.mjs';

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
