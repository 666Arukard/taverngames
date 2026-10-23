import {guideLanguageAvailable} from './guide-availability.mjs';
import {language} from './i18n.mjs';
export const f=(de,en)=>language()==='de'?de:en;
const DE={
 'Invalid entry minimum.':'Wähle eine ganze Einstiegshürde von 0 bis 1.000.000; im Zielmodus höchstens die Zielpunktzahl.',
 'Entry must be between 0 and the target score.':'Die Einstiegshürde muss zwischen 0 und der Zielpunktzahl liegen.',
 'Entry minimum has not been reached.':'Die eingestellte Einstiegshürde wurde noch nicht erreicht.',
 'Invalid optional rules.':'Ungültige optionale Regeln.','Invalid dice.':'Ungültige Würfel.','Invalid game mode.':'Ungültiger Spielmodus.',
 'Target must be between 500 and 1,000,000.':'Das Ziel muss zwischen 500 und 1.000.000 liegen.',
 'Round count must be between 1 and 100.':'Die Rundenanzahl muss zwischen 1 und 100 liegen.',
 'Finish or end the current game first.':'Die laufende Partie muss zuerst beendet werden.',
 'Invalid NPCs.':'Ungültige NPCs.','Invalid NPC.':'Ungültiger NPC.','No Farkle game exists.':'Keine Farkle-Partie vorhanden.',
 'This game has ended.':'Dieses Spiel ist beendet.','GM only.':'Nur GM.','Invalid NPC control.':'Ungültige NPC-Steuerung.',
 'You can only join in the lobby.':'Beitritt ist nur in der Lobby möglich.','Invalid participant.':'Ungültiger Teilnehmer.',
 'You have already joined.':'Du bist bereits dabei.','The table is full.':'Der Tisch ist voll.','You have not joined.':'Du bist nicht dabei.',
 'Only the GM can start the lobby.':'Nur GM kann die Lobby starten.','Not enough participants.':'Nicht genügend Teilnehmer.',
 'The game is not running.':'Das Spiel läuft gerade nicht.','It is not your turn.':'Du bist nicht am Zug.',
 'Choose a scoring combination from this roll.':'Wähle eine gültige Wertung aus diesem Wurf.',
 'Only dice from the latest roll may be selected.':'Nur Würfel des aktuellen Wurfs können ausgewählt werden.',
 'Invalid random value.':'Ungültige Zufallszahl.','Roll first.':'Zuerst würfeln.',
 'You need at least 500 points to enter the scoreboard.':'Zum ersten Eintragen brauchst du mindestens 500 Zugpunkte.',
 'Unknown action.':'Unbekannte Aktion.','The game state changed. Please try again.':'Spielstand geändert. Bitte erneut versuchen.',
 'No action to undo.':'Kein Schritt zum Zurücknehmen.','Invalid Farkle save.':'Ungültiger Farkle-Spielstand.',
 'Best selection is not enabled for players.':'Beste Auswahl ist für Spieler nicht freigegeben.'
};
export const farkleError=text=>language()==='de'?(DE[text]??text):text;
export function farkleGuide(options={}){if(!guideLanguageAvailable())return "<h2>Anleitung</h2><p>Die englische Anleitung ist noch nicht zur Veröffentlichung freigegeben. Die deutsche Anleitung ist über die Moduleinstellung Deutsch verfügbar.</p>";
  const title=f('Farkle – Kurzanleitung','');
  const rules=f('Sechs Würfel. Nach jedem Wurf mindestens eine punktbringende Auswahl herauslegen. Nur Würfel desselben Wurfs bilden eine Kombination; bereits gewertete Würfel dürfen nicht ergänzt werden. Danach Punkte sichern oder die übrigen Würfel erneut werfen. Ohne Wertung entsteht ein Farkle: alle ungesicherten Zugpunkte verfallen. Sind alle sechs gewertet, darfst du mit sechs Würfeln weiterwürfeln.','');
  const modes=f('Kurzspiel: Jeder hat einen Zug. Feste Runden: Jeder hat pro Runde einen Zug; die gesicherten Punkte aller Runden werden addiert. Die Rundenzahl ist einstellbar, zum Beispiel drei. In allen Modi kann die SL eine Einstiegshürde festlegen oder ausschalten. Kurzspiel und feste Runden starten standardmäßig ohne Hürde. Höchster Gesamtstand gewinnt, niedrigster verliert; Gleichstände teilen Plätze. Zielpunktzahl: Die SL kann eine Einstiegshürde zum ersten Eintragen festlegen oder ausschalten; Standard 500 Zugpunkte, Standardziel 10.000. Nach Zielerreichung haben alle anderen genau einen letzten Zug. Solo ist im Zielmodus möglich.','');
  const rows=[['1','100'],['5','50'],[f('Drei Einsen',''),options.onesBonus?'1,000':'300'],[f('Drilling 2–6',''),f('Augenzahl × 100','')],[f(options.onesBonus?'Vier / fünf / sechs gleiche außer Einsen':'Vier / fünf / sechs gleiche',options.onesBonus?'Four / five / six of a kind except ones':'Four / five / six of a kind'),'1,000 / 2,000 / 3,000'],[f('Straße 1–6',''),'1,500'],[f('Drei verschiedene Paare',''),'1,500'],[f('Vier gleiche + anderes Paar',''),'1,500'],[f('Zwei verschiedene Drillinge',''),'2,500']];
  if(options.onesBonus)rows.push([f('Vier / fünf / sechs Einsen',''),'2,000 / 3,000 / 4,000']);
  if(options.smallStraight)rows.push([f('Kleine Straße: 1–5 oder 2–6',''),'750']);
  const house=f('Optionale Hausregeln (jeweils standardmäßig aus): Kleine Straße aus fünf verschiedenen aufeinanderfolgenden Würfeln gibt 750 Punkte. Einsen-Bonus ersetzt die Wertung für drei bis sechs Einsen durch 1000/2000/3000/4000. Bei gesicherter Zielpunktzahl sofort beenden beendet nur im Zielmodus die Partie ohne Schlussrunde. Kombinationen müssen weiterhin aus einem Wurf stammen.','');
  const active=Object.entries(options).filter(([,v])=>v===true).map(([k])=>({smallStraight:f('Kleine Straße',''),onesBonus:f('Einsen-Bonus',''),immediateTarget:f('Sofortiges Zielende','')})[k]).filter(Boolean).join(', ')||f('Keine','');
  return `<h2>${title}</h2><p>${rules}</p><p>${modes}</p><p>${house}</p><p>${f('Aktiv in dieser Partie','')}: ${active}</p><p>${f('Die Hilfe „Beste Auswahl“ ist für Spieler standardmäßig aus. Der SL kann sie im Farkle-Moderationspanel freigeben. Ohne Hilfe wählst du punktbringende Würfel durch Anklicken selbst aus.','')}</p><table><thead><tr><th>${f('Wertung','')}</th><th>${f('Punkte','')}</th></tr></thead><tbody>${rows.map(([name,points])=>`<tr><td>${name}</td><td>${points}</td></tr>`).join('')}</tbody></table><p>${f('Wertung gemäß PlayMonster; Kurzspiel und feste Runden sind Taverngames-Hausvarianten. Kleine Straße nur mit aktivierter Hausregel. Startwurf entscheidet im Zielmodus (Gleichstand: frühere Position in der Startreihenfolge); im Kurzspiel Beitrittsreihenfolge.','')}</p><p><a href="https://playmonster.com/wp-content/uploads/2018/06/Farkle-Rules.pdf" target="_blank" rel="noopener noreferrer">PlayMonster Farkle Rules</a></p>`;
}
