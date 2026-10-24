import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { insideRoot, jsonFile, parseArgs, sha256, httpsUrl, zipManifest, responseJson } from './publishing-common.mjs';

export function validateWebsite(website, version) {
  if (website.version && website.version !== version) throw new Error('website.json: Versionsfeld stimmt nicht mit dem Release überein.');
  const [major, minor, patch] = version.split('.').map(Number);
  const lowercaseTitles = major > 1 || (major === 1 && (minor > 4 || (minor === 4 && patch >= 2)));
  const countedTitles = major > 1 || (major === 1 && (minor > 4 || (minor === 4 && patch > 6)));
  const expanded = major > 1 || (major === 1 && minor >= 4);
  const keys = expanded ? ['patchnotes', 'games', 'plans', 'plans2', 'functions', 'settings', 'sources', 'sources1'] : ['patchnotes', 'games', 'plans', 'settings'];
  if(major>=5)keys.push('milestones');
  if (website.schemaVersion !== 1 || !website.blocks || !isDeepStrictEqual(Object.keys(website.blocks).sort(), [...keys].sort())) throw new Error('website.json: Schema oder Blocknamen ungültig.');
  const titles = { milestones:'Meilensteine', patchnotes: `Patchnotes Version ${version}`, games: lowercaseTitles ? 'aktuelle Spiele' : 'Aktuelle Spiele', plans: expanded ? 'geplante Spiele' : 'Geplante Spiele', plans2: 'geplante Funktionen', functions: 'aktuelle Funktionen', settings: 'Einstellungen in Foundry', sources: 'Regelquellen', sources1: 'Hausvarianten' };
  if (major > 5 || (major === 5 && minor >= 3)) {
    const grouped=['games','plans','functions','plans2','settings','sources','sources1','milestones'];
    const counted=['games','plans','functions','plans2','sources'];
    const text=v=>typeof v==='string'&&v.trim().length>0;
    for(const key of keys){
      const block=website.blocks[key];
      if(!Array.isArray(block.items)||!Array.isArray(block.paragraphs)||!block.paragraphs.every(text))throw Error(`website.json: Block ${key} ungültig.`);
      let count=block.items.length;
      if(grouped.includes(key)){
        if(!count||block.items.some(g=>!g||!text(g.title)||!Array.isArray(g.items)||!g.items.length||!g.items.every(text)))throw Error(`website.json: Gruppen in ${key} ungültig.`);
        if(new Set(block.items.map(g=>g.title)).size!==count)throw Error(`website.json: Doppelte Gruppen in ${key}.`);
        count=block.items.reduce((n,g)=>n+g.items.length,0);
      }else if(!block.items.every(text))throw Error(`website.json: Inhalte in ${key} ungültig.`);
      if(block.title!==(counted.includes(key)?`${titles[key]} (${count})`:titles[key]))throw Error(`website.json: Titel/Anzahl in ${key} ungültig.`);
    }
    const sort=(a,b)=>Number(a.endsWith(' (Beta)'))-Number(b.endsWith(' (Beta)'))||a.localeCompare(b,'de');
    for(const key of ['games','plans']){
      const groups=website.blocks[key].items;
      const all=groups.flatMap(g=>g.items);
      if(new Set(all).size!==all.length||groups.some(g=>!isDeepStrictEqual(g.items,[...g.items].sort(sort))))throw Error(`website.json: Spielsortierung in ${key} ungültig.`);
    }
    const settings=website.blocks.settings.items.map(g=>g.title);
    if(!isDeepStrictEqual(settings,['Allgemeine Einstellungen','Einstellungen pro Spiel']))throw Error('website.json: Einstellungen falsch gegliedert.');
    const history=website.blocks.milestones.items;
    const number=s=>{const m=/^(\d+)\.(\d+)\.(\d+)\s*[–-]/.exec(s);if(!m)throw Error('website.json: Meilenstein ohne Version.');return m.slice(1).map(Number);};
    let last=-1;
    for(const group of history){const [x,y,z]=number(group.title);if(x<=last||y!==0||(x===0?z!==1:z!==0))throw Error('website.json: Meilensteine nicht chronologisch.');last=x;let minor=0;for(const item of group.items){const [a,b,c]=number(item);if(a!==x||b<=minor||c!==0)throw Error('website.json: Minor-Meilensteine ungültig.');minor=b;}}
    if(!website.blocks.patchnotes.paragraphs.length||!website.blocks.patchnotes.items.length||!website.blocks.sources.paragraphs.length||!website.blocks.sources1.paragraphs.length||website.blocks.milestones.paragraphs.length)throw Error('website.json: Einleitung oder Versionshinweise fehlen.');
    return website;
  }
  for (const key of keys) {
    const block = website.blocks[key];
    const expectedTitle = countedTitles && ['games','functions','plans','plans2','sources'].includes(key) ? `${titles[key]} (${block.items?.length})` : titles[key];
    if (block.title !== expectedTitle || !Array.isArray(block.items) || !Array.isArray(block.paragraphs) || [...block.items, ...block.paragraphs].some(text => typeof text !== 'string' || !text.trim())) throw new Error(`website.json: Block ${key} ungültig.`);
  }
  if (!website.blocks.patchnotes.paragraphs.length || !website.blocks.patchnotes.items.length || !website.blocks.settings.paragraphs.length) throw new Error('website.json: Versionshinweise oder Einstellungsanleitung fehlen.');
  if (expanded) {
    for (const key of ['plans2', 'functions', 'sources', 'sources1']) {
      if (!website.blocks[key].items.length) throw new Error(`website.json: Inhalte in ${key} fehlen.`);
    }
    if (!website.blocks.sources.paragraphs.length || !website.blocks.sources1.paragraphs.length) throw new Error('website.json: Quellen-/Hausvarianten-Einleitung fehlt.');
  }
  if(major>=5&&(!website.blocks.milestones.items.length||website.blocks.milestones.paragraphs.length))throw new Error('website.json: Meilensteine ungültig.');
  const categorized = major > 5 || (major === 5 && (minor > 1 || (minor === 1 && patch >= 2)));
  if (categorized) {
    for (const key of ['games', 'plans']) {
      const list = website.blocks[key].items;
      const order = ['Würfelspiele', 'Glücksspiele', 'Kartenspiele', 'Brettspiele', 'Sonstige'];
      const parsed = list.map(value => {
        const match = /^(Würfelspiele|Glücksspiele|Kartenspiele|Brettspiele|Sonstige): (.+)$/.exec(value);
        if (!match) throw new Error(`website.json: Kategorie in ${key} fehlt.`);
        return { category: match[1], name: match[2], value };
      });
      const sorted = [...parsed].sort((a,b) => order.indexOf(a.category)-order.indexOf(b.category) || Number(a.name.endsWith(' (Beta)'))-Number(b.name.endsWith(' (Beta)')) || a.name.localeCompare(b.name,'de'));
      if (!list.length || new Set(parsed.map(x=>x.name)).size !== list.length || !isDeepStrictEqual(list,sorted.map(x=>x.value))) throw new Error(`website.json: Kategorien oder Sortierung in ${key} ungültig.`);
    }
    return website;
  }
  const games = website.blocks.games.items;
  const stable = games.filter(name => !name.endsWith(' (Beta)'));
  const beta = games.filter(name => name.endsWith(' (Beta)'));
  const sorted = values => [...values].sort((a, b) => a.localeCompare(b, 'de'));
  if (!games.length || new Set(games).size !== games.length || !isDeepStrictEqual(games, [...sorted(stable), ...sorted(beta)])) throw new Error('website.json: Spiele müssen alphabetisch stehen, Beta-Spiele zuletzt.');
  return website;
}

export function prepareRelease(config) {
  if (!/^\d+\.\d+\.\d+(?:-beta\.\d+)?$/.test(config.version) || config.tag !== `v${config.version}`) {
    throw new Error('Version und Tag müssen zusammenpassen (v<Version>).');
  }
  if (typeof config.title !== 'string' || !config.title.trim()) throw new Error('Release-Titel fehlt.');
  if (typeof config.prerelease !== 'boolean' || typeof config.makeLatest !== 'boolean') throw new Error('prerelease und makeLatest müssen boolesch sein.');
  if (config.version.includes('-') && (!config.prerelease || config.makeLatest)) throw new Error('Beta-Versionen müssen Prereleases sein und dürfen nicht Latest werden.');
  const missing = [];
  if (!config.repository) missing.push('repository: GitHub-Eigentümer/Repository');
  else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\/[a-zA-Z0-9_.-]+$/.test(config.repository)) throw new Error('Repository als Eigentümer/Name angeben.');
  if (!config.targetCommit) missing.push('targetCommit: vollständiger Commit-SHA des vorbereiteten Quellstands');
  else if (!/^[a-f0-9]{40}$/i.test(config.targetCommit)) throw new Error('targetCommit muss ein vollständiger Commit-SHA sein.');
  const notes = readFileSync(insideRoot(config.notesFile), 'utf8');
  if (!notes.trim()) throw new Error('Versionshinweise fehlen.');
  if (!Array.isArray(config.assets) || ![2, 3].includes(config.assets.length)) throw new Error('Modul-ZIP, module.json und optional website.json erwartet.');
  const assets = config.assets.map(asset => {
    const data = readFileSync(insideRoot(asset.file));
    if (!/^[a-f0-9]{64}$/.test(asset.sha256) || sha256(data) !== asset.sha256) throw new Error(`Datei-Prüfsumme stimmt nicht: ${asset.file}`);
    return { ...asset, data, size: data.length };
  });
  const manifestAsset = assets.find(a => a.name === 'module.json');
  const zipAsset = assets.find(a => a.name === `taverngames-${config.version}.zip`);
  if (!manifestAsset || !zipAsset) throw new Error('Unerwartete Asset-Namen.');
  if (assets.length === 3) {
    const websiteAsset = assets.find(a => a.name === 'website.json');
    if (!websiteAsset) throw new Error('Drittes Asset muss website.json sein.');
    validateWebsite(JSON.parse(websiteAsset.data.toString('utf8').replace(/^\uFEFF/, '')), config.version);
  }
  const manifest = JSON.parse(manifestAsset.data.toString('utf8').replace(/^\uFEFF/, ''));
  if (manifest.id !== 'taverngames' || manifest.version !== config.version) throw new Error('Falsche Modul-ID oder Manifest-Version.');
  if (!isDeepStrictEqual(zipManifest(zipAsset.data), manifest)) throw new Error('ZIP-Manifest und externes Manifest unterscheiden sich.');
  httpsUrl(manifest.manifest);
  httpsUrl(manifest.download);
  return { config, notes, assets, manifest, missing };
}

export async function releaseGithub(plan, { token, publish = false, check = false, fetchImpl = fetch } = {}) {
  if (plan.missing.length) throw new Error(`Konfiguration unvollständig: ${plan.missing.join('; ')}`);
  if (!token) throw new Error('GitHub-Zugang fehlt. GH_TOKEN geschützt bereitstellen.');
  const { config, assets, notes } = plan;
  const base = `/repos/${config.repository}`;
  const api = async (path, { method = 'GET', data, binary, allow404 = false } = {}) => {
    const url = path.startsWith('https:') ? httpsUrl(path, ['api.github.com', 'uploads.github.com']) : new URL(path, 'https://api.github.com');
    const response = await fetchImpl(url, {
      method, redirect: 'error', signal: AbortSignal.timeout(120000),
      headers: {
        Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2026-03-10', 'User-Agent': 'taverngames-publisher',
        ...(data !== undefined || binary ? { 'Content-Type': binary ? 'application/octet-stream' : 'application/json' } : {})
      },
      ...(binary ? { body: binary } : data !== undefined ? { body: JSON.stringify(data) } : {})
    }).catch(() => { throw new Error('GitHub-Netzwerkfehler. Einen möglicherweise angelegten Entwurf vor Wiederholung prüfen.'); });
    if (allow404 && response.status === 404) return null;
    return responseJson(response, 'GitHub');
  };
  const repo = await api(base);
  if (repo.private) throw new Error('Foundry-Downloads benötigen ein öffentliches Repository.');
  const commit = await api(`${base}/commits/${config.targetCommit}`);
  if (commit.sha.toLowerCase() !== config.targetCommit.toLowerCase()) throw new Error('Zielcommit stimmt nicht überein.');
  const ref = await api(`${base}/git/ref/tags/${encodeURIComponent(config.tag)}`, { allow404: true });
  if (ref) {
    let object = ref.object;
    for (let i = 0; object.type === 'tag' && i < 8; i++) object = (await api(`${base}/git/tags/${object.sha}`)).object;
    if (object.type !== 'commit' || object.sha.toLowerCase() !== config.targetCommit.toLowerCase()) throw new Error('Vorhandener Tag zeigt auf einen anderen Commit.');
  }
  // Listing also finds drafts before GitHub has created the release tag.
  let release;
  for (let page = 1; ; page++) {
    const releases = await api(`${base}/releases?per_page=100&page=${page}`);
    release = releases.find(item => item.tag_name === config.tag);
    if (release || releases.length < 100) break;
  }
  if (release && !release.draft) throw new Error('Dieses Release ist bereits veröffentlicht. Es wird nicht verändert.');
  if (release && !ref && release.target_commitish.toLowerCase() !== config.targetCommit.toLowerCase()) {
    throw new Error('Vorhandener Entwurf hat einen anderen Zielcommit.');
  }
  if (check) return { checked: true, existingDraft: Boolean(release), tagExists: Boolean(ref) };
  if (!release) release = await api(`${base}/releases`, { method: 'POST', data: {
    tag_name: config.tag, target_commitish: config.targetCommit, name: config.title, body: notes,
    draft: true, prerelease: config.prerelease, make_latest: 'false'
  } });
  const uploadBase = httpsUrl(release.upload_url.split('{')[0], ['uploads.github.com']);
  const currentAssets = [];
  for (let page = 1; ; page++) {
    const items = await api(`${base}/releases/${release.id}/assets?per_page=100&page=${page}`);
    currentAssets.push(...items);
    if (items.length < 100) break;
  }
  if (currentAssets.some(asset => !assets.some(expected => expected.name === asset.name))) {
    throw new Error('Entwurf enthält zusätzliche Assets. Vor dem Veröffentlichen manuell prüfen.');
  }
  // Check every existing asset before uploading anything. Never replace a file.
  for (const asset of assets) {
    const existing = currentAssets.find(item => item.name === asset.name);
    if (existing && (existing.state !== 'uploaded' || existing.size !== asset.size || existing.digest !== `sha256:${asset.sha256}`)) {
      throw new Error(`Vorhandenes Asset ist abweichend oder nicht verifizierbar: ${asset.name}. Nichts wird überschrieben.`);
    }
  }
  for (const asset of assets) {
    if (currentAssets.some(item => item.name === asset.name)) continue;
    // Construct the query only after checking the host of GitHub's upload URL.
    const uploadUrl = `${uploadBase.href}?name=${encodeURIComponent(asset.name)}`;
    const result = await apiUpload(uploadUrl, asset);
    if (result.state !== 'uploaded' || result.size !== asset.size || result.digest !== `sha256:${asset.sha256}`) {
      throw new Error(`Upload konnte nicht verifiziert werden: ${asset.name}. Release bleibt Entwurf.`);
    }
  }
  async function apiUpload(url, asset) {
    const parsed = new URL(url);
    // api() forbids query strings in external URLs; query is attached here explicitly.
    httpsUrl(`${parsed.origin}${parsed.pathname}`, ['uploads.github.com']);
    const response = await fetchImpl(parsed, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(120000),
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10', 'User-Agent': 'taverngames-publisher', 'Content-Type': 'application/octet-stream' },
      body: asset.data
    }).catch(() => { throw new Error('GitHub-Upload unterbrochen. Release bleibt Entwurf; vorhandene Assets vor Wiederholung prüfen.'); });
    return responseJson(response, 'GitHub-Upload');
  }
  // Publication is last, after both uploaded file digests have been verified.
  release = await api(`${base}/releases/${release.id}`, { method: 'PATCH', data: {
    tag_name: config.tag, target_commitish: config.targetCommit,
    name: config.title, body: notes, prerelease: config.prerelease,
    draft: !publish, make_latest: publish && config.makeLatest ? 'true' : 'false'
  } });
  if (Boolean(release.draft) === publish) throw new Error('GitHub meldet einen unerwarteten Veröffentlichungsstatus.');
  return { url: release.html_url, draft: release.draft };
}

async function main() {
  const args = parseArgs(process.argv.slice(2), { '--config': true, '--check': false, '--apply': false, '--publish': false });
  if (args['--publish'] && !args['--apply']) throw new Error('--publish erfordert --apply.');
  if (args['--check'] && args['--apply']) throw new Error('--check und --apply getrennt verwenden.');
  const plan = prepareRelease(jsonFile(insideRoot(args['--config'] || 'publishing/github.example.json')));
  console.log(JSON.stringify({ mode: args['--apply'] ? args['--publish'] ? 'veröffentlichen' : 'GitHub-Entwurf' : args['--check'] ? 'Zugang prüfen' : 'lokale Vorschau',
    repository: plan.config.repository || 'noch einzurichten', tag: plan.config.tag,
    assets: plan.assets.map(({ name, size, sha256 }) => ({ name, size, sha256 })),
    manifest: plan.manifest.manifest, download: plan.manifest.download, missing: plan.missing }, null, 2));
  if (args['--apply'] || args['--check']) {
    const result = await releaseGithub(plan, { token: process.env.GH_TOKEN, check: Boolean(args['--check']), publish: Boolean(args['--publish']) });
    console.log(JSON.stringify(result, null, 2));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
