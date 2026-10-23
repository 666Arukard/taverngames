import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { verifyAssets } from './scheduled-release.mjs';
export function eligible(version,policy,releases){
  if(!policy.enabled||!/^\d+\.\d+\.\d+$/.test(version))return false;
  const confirmed=[policy.baselineVersion,...releases.filter(r=>r.body?.includes(`<!-- foundry-published:${r.tag_name?.replace(/^v/,'')} -->`)).map(r=>r.tag_name.replace(/^v/,''))].filter(Boolean);
  if(confirmed.includes(version))return false;
  const line=v=>v.split('.').slice(0,2).map(Number);
  const [x,y]=line(version);
  if(confirmed.some(v=>{const [a,b]=line(v);return a>x||(a===x&&b>y);}))return false;
  if(version===policy.oneTimeVersion)return true;
  return confirmed.every(v=>{const [a,b]=line(v);return x>a||(x===a&&y>b);});
}
export async function publishFoundry(version,{request=fetch,token=process.env.GH_TOKEN,foundryToken=process.env.FOUNDRY_RELEASE_TOKEN,policy=JSON.parse(readFileSync(new URL('../publishing/foundry-policy.json',import.meta.url),'utf8'))}={}){
  const base='https://api.github.com/repos/666Arukard/taverngames';
  async function api(path,method='GET',body){const r=await request(base+path,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json','User-Agent':'TavernGames-Foundry-Release'},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error(`GitHub HTTP ${r.status}`);return r.json();}
  const releases=[];for(let page=1;;page++){const batch=await api(`/releases?per_page=100&page=${page}`);releases.push(...batch);if(batch.length<100)break;}
  if(!eligible(version,policy,releases))return `${version}: Keine neue X.Y-Linie oder bereits gemeldet; kein Foundry-Aufruf.`;
  const release=releases.find(r=>r.tag_name===`v${version}`);
  if(!release||release.draft||release.prerelease)throw Error('Foundry erfordert ein öffentliches stabiles GitHub-Release.');
  if(release.body?.includes(`<!-- foundry-attempted:${version} -->`))throw Error('Foundry-Versuch bereits erfolgt. Vor erneutem Aufruf tatsächlichen Stand prüfen.');
  if(!foundryToken?.trim().startsWith('fvttp_'))throw Error('Foundry-Secret fehlt.');
  const root='https://github.com/666Arukard/taverngames/releases';
  const files={};for(const name of ['module.json','website.json',`taverngames-${version}.zip`]){
    const r=await request(`${root}/download/v${version}/${name}`);if(!r.ok)throw Error(`Öffentliche Release-Datei nicht erreichbar: ${name}`);
    files[name]=Buffer.from(await r.arrayBuffer());
  }
  verifyAssets(version,JSON.parse(files['module.json']),JSON.parse(files['website.json']),files[`taverngames-${version}.zip`]);
  const body=`${release.body??''}\n\n<!-- foundry-attempted:${version} -->`;
  await api(`/releases/${release.id}`,'PATCH',{body});
  const response=await request('https://foundryvtt.com/_api/packages/release_version/',{method:'POST',headers:{Authorization:foundryToken.trim(),'Content-Type':'application/json','User-Agent':'TavernGames-Foundry-Release'},body:JSON.stringify({id:'taverngames',release:{version,manifest:`${root}/download/v${version}/module.json`,notes:`${root}/tag/v${version}`,compatibility:{minimum:'14.369',verified:'14.369'}}})});
  if(!response.ok)throw Error(`Foundry HTTP ${response.status}. Kein Erfolg bestätigt; vor erneutem Aufruf Paketstand prüfen.`);
  const result=await response.json();if(result.status!=='success'||result.message?.startsWith('Dry run'))throw Error('Foundry bestätigt Veröffentlichung nicht.');
  await api(`/releases/${release.id}`,'PATCH',{body:`${body}\n<!-- foundry-published:${version} -->`});
  return `${version}: Foundry-Veröffentlichung erfolgreich bestätigt.`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{console.log(await publishFoundry(process.env.RELEASE_VERSION));}
  catch(e){const s=String(e.message);const secret=[process.env.GH_TOKEN,process.env.FOUNDRY_RELEASE_TOKEN].some(t=>t&&s.includes(t));console.error(secret?'Foundry fehlgeschlagen; Ausgabe geschützt.':s);process.exitCode=1;}
}
