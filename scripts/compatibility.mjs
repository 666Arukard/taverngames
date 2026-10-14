import {t,tr} from './i18n.mjs';
export function checkFoundry(release,version) {
  const generation=Number(release?.generation??String(version??'').split('.')[0]);
  const installed=String(version??release?.version??t('unbekannt'));
  return {supported:true,generation,installed,target:installed==='14.369',message:installed==='14.369'?tr`Foundry ${installed} · getestet (Praxistest bestätigt)`:tr`Foundry ${installed} · nicht getestet`};
}
