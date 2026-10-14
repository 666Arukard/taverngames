// Module language is a world setting, independent of Foundry's UI language.
export function language(){
  if(!globalThis.game?.settings)return 'de'; // Standalone rules/tests retain their original display language.
  try{return game.settings.get('taverngames','language')==='de'?'de':'en';}catch{return 'en';}
}
const EN={
 'Anleitung':'Instructions','Spieltisch öffnen':'Open game table','Moderation öffnen':'Open moderation',
 'Taverngames · Moderation':'Taverngames · Moderation','Schocken · Anleitung':'Schocken · Instructions',
 'Unteren Schocken-Button für alle einblenden':'Show the bottom start button for everyone',
 'Spieler, NPCs & neues Spiel':'Players, NPCs & new game',
 'Menschen treten freiwillig über den Spieltisch bei. Der SL kann ebenfalls beitreten. NPCs hier vor dem Öffnen der Lobby eintragen.':'Players join voluntarily at the game table. The GM can also join. Enter NPCs here before opening the lobby.',
 'NPCs – ein Name pro Zeile':'NPCs – one name per line',
 'Mit Laden beginnen (jede Hälfte / Finale)':'Start with a loading round (each half / final)',
 'Würfel wieder hereinnehmen erlauben':'Allow held dice to be returned',
 '3. Wurf standardmäßig verdeckt':'Third roll hidden by default',
 'Wurfarten umbenennen':'Rename roll types','Standardnamen wiederherstellen':'Restore default names',
 'Standardset':'Standard set','Tavernenset':'Tavern set','Wurfnamen übernehmen':'Apply roll names',
 'Lobby öffnen':'Open lobby','Verbindungen erneuern':'Refresh connections',
 'Gespeichertes Schockenspiel durch ein neues ersetzen?':'Replace the saved Schocken game with a new one?',
 'Schocken-Verbindungen erneuert.':'Schocken connections refreshed.',
 'Fortsetzen':'Resume','Pause':'Pause','Rückgängig':'Undo','Spiel beenden':'End game',
 'Spiel für alle Teilnehmer einschließlich der aktiven Runde beenden?':'End the game for everyone, including the current round?',
 'NPC-Steuerung':'NPC controls','GM steuert':'Controlled by GM','Automatisch':'Automatic',
 'Automatik einschalten':'Enable automatic play','Selbst steuern':'Control manually','Moderationsprotokoll':'Moderation log',
 'Spiel pausiert: kein GM verbunden. Der gespeicherte Stand bleibt erhalten.':'Game paused: no GM connected. The saved game is retained.',
 'Der SL öffnet eine Lobby. Danach kannst du freiwillig beitreten.':'The GM opens a lobby. You can then choose to join.',
 'Finale':'Final','Hälfte {0}':'Half {0}',
 '{0} · Durchgang {1} · Mitte: {2} Deckel':'{0} · Round {1} · Pool: {2} counters',
 '⏸ Spiel pausiert':'⏸ Game paused',' Deckel':' counters',' · Hälfte verloren':' · half lost',
 'Lobby · Schocken':'Lobby · Schocken','Lobby verlassen':'Leave lobby','Beitreten':'Join','Spiel starten':'Start game',
 'an':'on','aus':'off','Regeln: Laden {0} · Wiederhereinnehmen {1} · Dritter Wurf verdeckt {2}':'Rules: loading {0} · return held dice {1} · hidden third roll {2}',
 'Spiel durch den GM beendet':'Game ended by the GM','Spiel beendet: {0} verliert.':'Game over: {0} loses.',
 'Hälfte beendet.':'Half finished.','Zweite Hälfte starten':'Start second half','Finale starten':'Start final',
 '{0} ist am Zug':"{0}'s turn",'Laden · ':'Loading · ',' · NPC wartet auf GM':' · NPC waiting for GM',
 ' · GM übernimmt bei Bedarf':' · GM may take over',
 '{0}{1} / {2} Würfe{3}{4}':'{0}{1} / {2} rolls{3}{4}',
 'Würfeln':'Roll','Aufdecken':'Reveal','Sechsen drehen':'Turn sixes','Offen beenden':'Finish openly','Verdeckt beenden':'Finish hidden',
 'Einkaufen / wieder mitspielen':'Buy in / rejoin','Eigenen Wurf aufdecken':'Reveal my roll',
 'Dieser Durchgang':'This round','Letzter Durchgang':'Previous round','Letzter abgeschlossener Durchgang':'Last completed round','verdeckt':'hidden',
 '{0} · {1} Wurf/Würfe · {2}':'{0} · {1} roll(s) · {2}',
 'dürfen vor weiteren Würfen zurückgenommen werden':'may be returned before rolling again','bleiben liegen':'remain held',
 'Herausgelegte Würfel {0}. {1} und {2} zählen nur auf Hand. {3} liegt unter {4}.':'Held dice {0}. {1} and {2} only count when rolled together. {3} ranks below {4}.',
 '{0} erhält {1} Deckel ({2}).':'{0} receives {1} counters ({2}).',
 'Wieder hereinnehmen':'Return to cup','Herausgelegt':'Held','Zum Herauslegen anklicken':'Click to hold',
 'Anleitung in den Chat posten':'Post instructions to chat',
 'Die Spielleitung kann die Anleitung im Chat teilen.':'The GM can share the instructions in chat.',
 'Die Anleitung wird von der Spielleitung im Chat geteilt.':'The GM shares the instructions in chat.',
 'Taverngames: unteren Startbutton einblenden':'Taverngames: show bottom start button',
 'Für alle Teilnehmer. Auch über den eigenen Taverngames-Reiter erreichbar.':'For all participants. The game is also accessible through the Taverngames tab.',
 'Taverngames: Sprache / Language':'Taverngames: Language / Sprache',
 'Sprache für Spieltisch, Moderation und Chat. Gilt für die gesamte Welt.':'Language for the game table, moderation and chat. Applies to the whole world.',
 'Einfacher Wurf':'Simple roll','Straße':'Straight','Jennie/General':'Jennie/General','Schock doof':'Schock 2',
 'Schock Aus':'Schock Out','Bettlerwurf':"Beggar's Roll",'Triumphzug':'Triumphal March','Knappenbund':"Squires' Bond",'Ritterorden':'Order of Knights',
 'Prinzenschock':"Prince's Schock",'Fürstenschock':"Lord's Schock",'Königsschock':"King's Schock",'Kaiserschock':"Emperor's Schock",'Gotteshand':'Hand of God',
 'Schocken – Spiel beendet!':'Schocken – Game over!','Gewonnen:':'Winners:','Verloren:':'Loser:',
 'Unbekanntes Format':'Unknown format','Altes Modul Schocken zuerst deaktivieren.':'Disable the old Schocken module first.',
 'Die aktive GM-Verbindung hat gewechselt. Bitte Fenster neu öffnen.':'The active GM connection changed. Please reopen the window.',
 'Verbindung noch nicht bereit. GM kann Verbindungen erneuern.':'Connection is not ready. The GM can refresh connections.',
 'Spielstand wurde inzwischen geändert. Bitte erneut versuchen.':'The game state changed. Please try again.',
 'Nur GM kann starten.':'Only the GM can start.','Nur verbundene Spieler auswählen.':'Select connected players only.',
 'NPC-Namen müssen 1–60 Zeichen haben (maximal 20 Teilnehmer insgesamt).':'NPC names must contain 1–60 characters (up to 20 participants in total).',
 'Kein Schritt zum Zurücknehmen.':'No action to undo.','Bitte die laufende Aktion kurz abwarten.':'Please wait for the current action to finish.',
 'Für Schocken muss ein GM verbunden sein.':'A GM must be connected to play Schocken.',
 'Ungültige Verbindung.':'Invalid connection.',
 'Schocken: Gespeicherter Tisch gehört zu einem anderen GM-Browser. Dort fortsetzen oder ausdrücklich ein neues Spiel starten.':'Schocken: the saved table belongs to another GM browser. Continue there or explicitly start a new game.',
 'Taverngames: native Sidebar-Schnittstelle fehlt. Einstieg über den unteren Button bleibt verfügbar.':'Taverngames: native sidebar API is missing. The bottom start button remains available.',
 'Bitte zuerst das alte Modul Schocken deaktivieren. Taverngames startet nicht parallel.':'Disable the old Schocken module first. Taverngames will not run alongside it.',
 'Taverngames: Die native ApplicationV2-Schnittstelle fehlt in dieser Foundry-Version.':'Taverngames: this Foundry version lacks the native ApplicationV2 API.',
 'Foundry ApplicationV2 fehlt. Das native Taverngames-Fenster kann nicht geöffnet werden.':'Foundry ApplicationV2 is missing. The native Taverngames window cannot be opened.',
 'Schocken: Spiel gespeichert, Chat-Ankündigung fehlgeschlagen: {0}':'Schocken: game saved, but chat announcement failed: {0}',
 'Ungültige Wurfnamen.':'Invalid roll names.','Wurfnamen müssen 1–60 Zeichen haben.':'Roll names must contain 1–60 characters.',
 'Ungültige Würfel.':'Invalid dice.','2–20 unterschiedliche Spieler wählen.':'Choose 2–20 distinct players.',
 'Ungültige Laden-Einstellung.':'Invalid loading option.','Ungültige Regeloption.':'Invalid rule option.','Ungültiger NPC.':'Invalid NPC.',
 'Kein Spiel vorhanden.':'No game exists.','Dieses Spiel ist beendet.':'This game has ended.','Nur GM.':'GM only.',
 'Beitritt ist nur in der Lobby möglich.':'You can only join in the lobby.','Ungültiger Teilnehmer.':'Invalid participant.',
 'Du bist bereits dabei.':'You have already joined.','Der Tisch ist voll.':'The table is full.','Du bist nicht dabei.':'You have not joined.',
 'Nur GM kann die Lobby starten.':'Only the GM can start the lobby.','Aufdecken gerade nicht möglich.':'Revealing is not possible now.',
 'Kein verdeckter Becher.':'No hidden cup.','Kein verdeckter eigener Wurf.':'You have no hidden roll.','Ungültige NPC-Steuerung.':'Invalid NPC control.',
 'Keine nächste Hälfte verfügbar.':'No next half is available.','Einkaufen gerade nicht möglich.':'Buying in is not possible now.',
 'Das Spiel läuft gerade nicht.':'The game is not running.','Du bist nicht am Zug.':'It is not your turn.',
 'Nur der dritte Wurf kann verdeckt gewürfelt werden.':'Only the third roll may be hidden.','Wurflimit erreicht.':'Roll limit reached.',
 'Alle Würfel sind herausgelegt.':'All dice are held.','Ungültige Zufallszahl.':'Invalid random value.',
 'Herauslegen nicht möglich.':'Holding is not possible.','Herausgelegte Würfel bleiben liegen.':'Held dice must remain held.',
 'Nach dem Drehen muss ein Würfel zum erneuten Würfeln bleiben.':'After turning sixes, at least one die must remain available to roll.',
 'Wiederhereinnehmen nicht erlaubt.':'Returning held dice is not allowed.','Drehen nicht möglich.':'Turning sixes is not possible.',
 'Mindestens zwei frische Sechsen nötig.':'At least two freshly rolled sixes are required.',
 'Erst würfeln; nach Sechsen drehen erneut würfeln.':'Roll first; after turning sixes, roll again.','Unbekannte Aktion.':'Unknown action.',
 '{0} verloren: {1}':'{0} lost: {1}','{0} kauft sich ein.':'{0} buys in.',
 'Foundry {0} · getestet (Praxistest bestätigt)':'Foundry {0} · tested (confirmed playtest)',
 'Foundry {0} · nicht getestet':'Foundry {0} · not tested','unbekannt':'unknown'
};
export function t(text){return language()==='en'?(EN[text]??text):text;}
export function tr(parts,...values){
  const key=parts.reduce((out,part,index)=>out+(index?`{${index-1}}`:'')+part,'');
  return t(key).replace(/\{(\d+)\}/g,(_match,index)=>String(values[Number(index)]));
}
const labelKeys=['Einfacher Wurf','Straße','Jennie/General','Schock doof','Schock Aus','Bettlerwurf','Triumphzug','Knappenbund','Ritterorden','Prinzenschock','Fürstenschock','Königsschock','Kaiserschock','Gotteshand'];
export function labelName(value){const key=labelKeys.find(key=>key===value||EN[key]===value);return key?t(key):value;}
export function translatedNames(names){return Object.fromEntries(Object.entries(names).map(([key,value])=>[key,labelName(value)]));}
export function logText(text){
  const lost=text.match(/^(Finale|Hälfte \d+) verloren: (.+)$/);
  if(lost){const half=lost[1].startsWith('Hälfte ')?tr`Hälfte ${lost[1].slice(7)}`:t('Finale');return tr`${half} verloren: ${lost[2]}`;}
  const buy=text.match(/^(.+) kauft sich ein\.$/);return buy?tr`${buy[1]} kauft sich ein.`:t(text);
}
