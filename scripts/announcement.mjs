import {t} from './i18n.mjs';
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function announcement(state,getName) {
  if(state?.phase!=='finished')return null;
  return {content:`<h2>${t("Schocken – Spiel beendet!")}</h2><p><strong>${t("Gewonnen:")}</strong> ${state.players.filter(id=>id!==state.loser).map(id=>escape(getName(id))).join(', ')}</p><p><strong>${t("Verloren:")}</strong> ${escape(getName(state.loser))}</p>`,flags:{taverngames:{gameId:state.gameId}}};
}
