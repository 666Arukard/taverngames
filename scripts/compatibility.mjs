import {t,tr} from './i18n.mjs';
export function checkFoundry(release,version) {
  const generation=Number(release?.generation??String(version??'').split('.')[0]);
  const installed=String(version??release?.version??t('unbekannt'));
  const target=installed==='14.369'||installed==='14.370';
  return {supported:true,generation,installed,target,message:target?tr`Foundry ${installed} · getestet (Praxistest bestätigt)`:tr`Foundry ${installed} · nicht getestet`};
}
