import {rpsGuide} from './rps-text.mjs';
import {newContestGuide,checkersGuide} from './new-contest-text.mjs';
import {contestGuide} from './contest-text.mjs';
import {dotsGuide} from './dots-text.mjs';
import {card21Guide} from './card21-text.mjs';
import {reviewedGuide} from './reviewed-guides.mjs';
import {morrisGuide} from './morris-text.mjs';
import {ticGuide} from './tic-tac-toe-text.mjs';
import {guideLanguageAvailable} from './guide-availability.mjs';
import {durakGuide} from './durak-text.mjs';
import {newGameGuide} from './new-games-text.mjs';
import {mauGuide} from './maumau-text.mjs';
import {kingsGuide} from './kings-text.mjs';
import {thirteenGuide} from './thirteen-text.mjs';
import {klippGuide} from './klippklapp-text.mjs';
import {pokerGuide} from './poker-text.mjs';
import {aalstechenGuide} from './aalstechen-text.mjs';
import {meiernGuide} from './meiern-text.mjs';
import {tokenGuide} from './token-guide.mjs';
import {seventeenGuide} from './seventeen-text.mjs';
import {betaGuide} from './beta-games-text.mjs';
import {kniffelGuide} from './kniffel-text.mjs';
import {f} from './farkle-text.mjs';
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const gameTitle=game=>({rps:f('Schere, Stein, Papier','Rock, Paper, Scissors'),drink:f('Wetttrinken','Drinking Contest'),eat:f('Wettessen','Eating Contest'),checkers:f('Dame','Checkers'),arm:f('Armdrücken','Arm Wrestling'),connecttournament:f('Vier-gewinnt-Turnier','Four in a Row Tournament'),morristournament:f('Mühle-Turnier','Morris Tournament'),dotstournament:f('Käsekästchen-Turnier','Dots and Boxes Tournament'),dots:f('Käsekästchen','Dots and Boxes'),card21:f('17 und 4','Seventeen and Four'),morris:f('Mühle',"Nine Men's Morris"),tictournament:f('Tic-Tac-Toe-Turnier','Tic-Tac-Toe Tournament'),oldmaid:f('Schwarzer Peter','Old Maid'),tictactoe:'Tic-Tac-Toe',connectfour:f('Vier gewinnt','Four in a Row'),durak:'Durak',lucky:f('Der Glückstag','Lucky Day'),swim:f('Schwimmen / Knack','Schwimmen / Knack'),maumau:'Mau-Mau',kings:f('Spiel der Könige','Game of Kings'),thirteen:f('Die böse Dreizehn','Wicked Thirteen'),klippklapp:'Klippklapp',poker:f('Würfelpoker','Dice Poker'),aalstechen:'Aalstechen',meiern:'Meiern',seventeen:f('17 und 4','Seventeen and Four'),chohan:'Chō-Han',liars:f('Lügenwürfel','Liar’s Dice'),hoard:f('Drachenhort','Dragon’s Hoard'),kniffel:'Kniffel',schocken:'Schocken',farkle:'Farkle',pig:f('Schweinchen','Pig'),ship:f('Schiff, Kapitän und Mannschaft','Ship, Captain and Crew'),lottery:f('Straßenlotto','Street lottery')})[game]??game;
const ERRORS={
"RPS: give the rule set a title (1–80 characters).":"Gib dem Regelset einen Namen mit 1–80 Zeichen.","RPS: use 3–25 figures.":"Verwende 3–25 Figuren.","RPS: invalid figure.":"Figuren benötigen einen gültigen Namen (bis 60 Zeichen) und ein optionales Textsymbol (bis 12 Zeichen).","RPS: duplicate figure ID.":"Eine Figur kommt mehrfach vor.","RPS: figure names must be unique.":"Die Figurennamen müssen eindeutig sein.","RPS: define exactly one winner for every pair.":"Lege für jedes Figurenpaar genau einen Sieger fest.","RPS: invalid relationship.":"Eine Figurenbeziehung ist ungültig.","RPS: conflicting or duplicate relationship.":"Eine Figurenbeziehung ist doppelt oder widersprüchlich.","RPS: missing relationship.":"Eine Figurenbeziehung fehlt.","RPS: target wins must be 1–100.":"Wähle 1–100 Siege als Ziel.","RPS: no selection available.":"Du kannst gerade keine Figur auswählen.","RPS: this selection belongs to another round.":"Diese Auswahl gehört zu einem anderen Durchgang.","RPS: your selection is already locked.":"Deine Auswahl ist bereits verbindlich abgegeben.","RPS: unknown figure.":"Diese Figur gehört nicht zu diesem Regelset.","RPS: you cannot choose for this participant.":"Du darfst für diesen Teilnehmer keine Figur auswählen.",

 'Invalid contest difficulty.':'Start-SG oder Steigerung sind ungültig.',
 'Invalid capture rule.':'Wähle eine gültige Schlagregel.',
 'Choose a legal checkers move.':'Wähle einen erlaubten Dame-Zug.',
 'Give up before the next portion.':'Aufgeben ist vor der nächsten Portion möglich.',
 'Invalid direction.':'Wähle eine gültige Bewegungsrichtung.',
 'Two to sixteen participants required.':'Es werden zwei bis sechzehn Teilnehmer benötigt.',
 'Invalid Tic-Tac-Toe variant.':'Wähle einen gültigen Tic-Tac-Toe-Modus.',
 'Extreme requires a three-piece variant.':'Extreme benötigt Verschwinden oder Verschieben.',
 'Play in the highlighted sub-board.':'Spiele im hervorgehobenen offenen Teilbrett.',
 'Select one of your own pieces in this board.':'Wähle einen eigenen Stein in diesem Teilbrett aus.',
 'Choose a suitable card deck.':'Wähle ein geeignetes Kartendeck.',
 'Choose the odd card and complete pairs.':'Wähle den Schwarzen Peter und vollständige Kartenpaare.',
 'Invalid card selection.':'Die Kartenauswahl ist ungültig.',
 'Every ordinary card needs a pair group.':'Jede normale Karte benötigt eine Paargruppe.',
 'Every pair group must contain exactly two cards.':'Jede Paargruppe muss genau zwei ausgewählte Karten enthalten.',
 'Draw from the previous active player.':'Ziehe beim vorherigen noch aktiven Spieler.',
 'Choose a hidden card.':'Wähle eine verdeckte Karte.',
 'Choose a legal Morris move.':'Wähle einen erlaubten Mühle-Zug.','Invalid quiet move limit.':'Ungültige Remisgrenze.',
 'Choose an empty field.':'Wähle ein freies Feld.',
 'Two players required.':'Es werden genau zwei Teilnehmer benötigt.',
 'Two to eight players required.':'Es sind zwei bis acht Teilnehmer möglich.',
 'Two to eight players required; choose enough cards.':'Es werden zwei bis acht Teilnehmer und mindestens eine Karte pro Person benötigt.',

 'Not enough game tokens for the buy-in.':'Jeder Teilnehmer benötigt fünf Grundeinsätze für den Einkauf.',
 'Complete the previous throw first.':'Schließe zuerst den vorherigen Wurf ab.',
 'Continue after the winning throw.':'Die nächste Runde folgt nach einer gewonnenen Kasse.',
 'Leave in the lobby.':'Du kannst die Lobby vor Spielbeginn verlassen.',
 'Invalid Klippklapp variant.':'Wähle Variante A, B oder C.',
 'Leave only outside your own turn.':'Du kannst nur außerhalb deines eigenen Zuges aussteigen.',
 'Close tiles before rolling again.':'Schließe zuerst passende Klappen. Nur bei Pasch darfst du ohne Schließen neu würfeln.',
 'Choose a valid tile combination.':'Wähle eine erlaubte Kombination offener Klappen.',
 'Complete your turn before declaring.':'Spiele deinen Zug zuerst vollständig aus.',
 'The announced remainder must be lower.':'Die Ansage muss zwischen 0 und 78 liegen und die vorige Ansage unterbieten.',
 'Challenge a zero remainder.':'Eine angesagte 0 muss angezweifelt werden.',
 'Finish the round first.':'Zuerst die laufende Runde abschließen.',
 'This game has no continuous rounds.':'Dieses Spiel verwendet seinen eigenen Rundenmodus.',
 'End the session before discarding tokens.':'Vor dem Verwerfen der Token die gesamte Partie beenden.',
 'Choose favor or disfavor.':'Wähle Begünstigen oder Benachteiligen.',
 'Invalid poker dice.':'Würfelpoker benötigt fünf gültige W8.',
 'Invalid die selection.':'Ungültige Würfelauswahl.',
 'Choose the starting player in the lobby.':'Wähle den Startspieler vor dem Start in der Lobby.',
 'Select a participating starting player.':'Wähle einen teilnehmenden Startspieler.',
 'Configure before the game ends.':'Token vor dem Partieende bearbeiten.',
 'Please wait for all dice animations to finish.':'Bitte vor dem Rundenwechsel alle Würfelanimationen abwarten.',

 'Invalid minimum raise.':'Ungültige Mindesterhöhung.',
 'Check instead of folding.':'Ohne offene Forderung kannst du schieben.',
 'Call the current bet first.':'Du musst die offene Forderung mitgehen oder aussteigen.',
 'No bet to call.':'Es gibt keine offene Forderung zum Mitgehen.',
 'Invalid raise.':'Ungültiger Erhöhungsbetrag.',
 'A short all-in does not reopen raising.':'Dieses kurze All-in eröffnet das Erhöhen nicht erneut.',
 'No opponent can match another raise.':'Kein Gegner kann eine weitere Erhöhung mitgehen.',
 'Raise below the minimum.':'Diese Erhöhung liegt unter dem Mindestbetrag.',
 'Choose a positive buy-in.':'Lege einen Grundeinsatz größer als null fest.',
 'Roll once per active round.':'Jeder aktive Teilnehmer darf pro Runde einmal würfeln.',
 'Continue after everyone rolled.':'Erst fortfahren, wenn alle Teilnehmer gewürfelt haben.',

 'Finish between revealed rounds.':'Die Partie kann nur zwischen aufgedeckten Durchgängen gewertet werden.',
 'Continue after revealing.':'Erst nach dem Aufdecken mit dem nächsten Durchgang fortfahren.',
 'Roll after accepting.':'Du kannst würfeln, wenn du an der Reihe bist und die vorige Ansage angenommen hast.',
 'Roll before declaring.':'Vor der Ansage musst du würfeln.',
 'The claim must increase.':'Die Ansage muss höher sein als die vorige Ansage.',
 'Challenge a declared Meier.':'Eine angesagte 21 muss angezweifelt werden.',
 'No claim to challenge.':'Es gibt keine Ansage zum Anzweifeln.',
 'Join in the lobby.':'Ein- und Austreten ist nur in der Lobby möglich.',
 'Invalid participant.':'Ungültiger Teilnehmer oder maximale Spielerzahl erreicht.',

 'Not enough game tokens.':'Nicht genügend freie Spieltoken vorhanden.',
 'Invalid token amount.':'Ungültige Anzahl Spieltoken.',
 'Invalid token limits.':'Ungültige Einsatzgrenzen für Spieltoken.',
 'Configure before committing stakes.':'Einsatzmodus vor verbindlichen Einsätzen einstellen.',
 'Enable game tokens first.':'Zuerst den Einsatzmodus Spieltoken aktivieren.',
 'Committed tokens cannot be removed.':'Reservierte Spieltoken können nicht entzogen werden.',
 'Choose a token stake first.':'Zuerst den Einsatz in Spieltoken bestätigen.',
 'Use game tokens only.':'Es sind nur Spieltoken erlaubt.',
 'Carry tokens to the next game or refund the carried pot first.':'Token für die Folgepartie übernehmen oder den offenen Topf zuerst erstatten.',
 'Carry tokens or refund the carried pot first.':'Token übernehmen oder den offenen Topf zuerst erstatten.',
 'Token settlement is final.':'Die Token-Abrechnung ist abgeschlossen und kann nicht zurückgenommen werden.',
 'Invalid NPC risk.':'Ungültiges NPC-Einsatzrisiko.',
 'Invalid stake limits.':'Ungültige Einsatzgrenzen.','Set stakes in the lobby.':'Einsätze können nur vor dem Start in der Lobby gewählt werden.','Stake is outside the allowed range.':'Der Einsatz liegt außerhalb der erlaubten Grenzen.','Each participant must choose a stake first.':'Zuerst müssen alle Teilnehmer ihren Einsatz bestätigen.',
 'Invalid bank budget.':'Ungültiges Bankbudget.',
 'Invalid dice mode.':'Ungültige Würfelvariante.','No more rolls.':'Du darfst nicht mehr würfeln.','Roll first.':'Würfle zuerst mindestens einmal.',
 'Outcome settlement is final.':'Eine ausgewertete Wette kann nicht zurückgenommen werden.',
 'Close betting before starting the game.':'Vor dem Spielstart die Wettannahme schließen.','Finish or refund the outcome bets first.':'Zuerst die Ausgangswetten abschließen oder zurückzahlen.','Participants are locked while outcome bets exist.':'Bei vorhandenen Wetten ist die Teilnehmerliste gesperrt.','Open a lobby first.':'Zuerst eine Lobby öffnen.','Open betting before the game starts.':'Wetten vor dem Spielstart öffnen.','Open betting first.':'Zuerst die Wettannahme öffnen.','The betting state changed. Please try again.':'Wettstand geändert. Bitte erneut versuchen.','Configure before placing bets.':'Die Wettoptionen vor der ersten Wette festlegen.','Invalid betting options.':'Ungültige Wettoptionen.','Invalid virtual balance.':'Ungültiges internes Guthaben.','Betting is closed.':'Die Wettannahme ist geschlossen.','You may not bet in this game.':'Du darfst bei dieser Partie nicht wetten.','One outcome bet per bettor.':'Pro Wetter ist eine Wette möglich.','Invalid outcome bet.':'Ungültige Ausgangswette.','Not enough virtual gold.':'Nicht genügend internes Gold.','No outcome bet to withdraw.':'Keine Wette zum Zurücknehmen.','Cancel bets before starting.':'Wetten vor dem Start stornieren.',

 'Automatic currency transactions are not available.':'Automatische Geldbuchungen sind hier nicht verfügbar.','Invalid virtual coin settings.':'Ungültige Einstellungen für virtuelle Münzen.','Invalid starting balance.':'Ungültiger Anfangsbestand.','Roll once per round.':'Jeder Becher darf genau einmal pro Runde gewürfelt werden.','Invalid bid.':'Ungültiges Gebot.','Bid is too low.':'Das Gebot muss erhöht werden.','No bid to challenge.':'Es gibt kein Gebot zum Anzweifeln.','No round to continue.':'Keine aufgedeckte Runde zum Fortsetzen.','Finish after the pending move.':'Zuerst den laufenden Zug oder die Restverteilung abschließen.','No partial payment.':'Keine Restzahlung erforderlich.','Distribute all remaining coins.':'Alle Restmünzen auf die Zahlenfelder verteilen.','Invalid guess.':'Ungültiger oder bereits abgegebener Tipp.','All guesses are required.':'Zuerst müssen alle Berechtigten tippen.',
 'Beta testing is disabled.':'Der Beta-Test ist ausgeschaltet.','Kniffel betting is not available.':'Einsatzverwaltung ist für Kniffel noch nicht verfügbar.','Invalid score field.':'Dieses Wertungsfeld ist ungültig oder bereits belegt.','Confirm zero score.':'Den Eintrag mit null Punkten bestätigen.','Invalid die.':'Ungültiger Würfel.','Return at least one die.':'Mindestens einen Würfel wieder hineinnehmen.',
 'Numbers per ticket must be between 1 and 100.':'Die Zahlenanzahl je Tippschein muss zwischen 1 und 100 liegen.','Choose the required number of different available numbers.':'Wähle die festgelegte Anzahl verschiedener freier Zahlen.','Electrum is disabled.':'Elektrum ist ausgeschaltet.',
 'GM only.':'Nur die Spielleitung darf das.','Unknown game.':'Unbekanntes Spiel.','No game exists.':'Keine Partie vorhanden.',
 'A GM must be connected.':'Eine Spielleitung muss verbunden sein.','The game is not running.':'Das Spiel läuft gerade nicht.',
 'The game state changed. Please try again.':'Spielstand geändert. Bitte erneut versuchen.','It is not your turn.':'Du bist nicht am Zug.',
 'Finish or end the current game first.':'Die laufende Partie zuerst beenden.','This game has ended.':'Dieses Spiel ist beendet.',
 'Place a bet first.':'Zuerst eine Wette platzieren.','The bank cannot cover these bets.':'Die Bank kann diese Wetten nicht decken.','Resolve or refund the carried pot first.':'Den übertragenen Topf zuerst ausspielen oder erstatten.','Both sides need a bet.':'Beide Seiten benötigen einen Gegeneinsatz.','Invalid rule option.':'Ungültige Regeloption.','Invalid target.':'Ungültige Zielpunktzahl.','Invalid stake.':'Ungültiger Grundeinsatz.','Invalid round mode.':'Ungültiger Rundenmodus.',
 'Invalid currency or funding.':'Ungültige Währung oder Finanzierungsart.','Invalid ticket limits.':'Ungültige Tippscheinlimits.',
 'Invalid prize.':'Ungültiger Hauptgewinn.','Invalid NPCs.':'Ungültige NPCs.','Invalid participant.':'Ungültiger Teilnehmer.',
 'Ticket acceptance is closed.':'Die Tippannahme ist geschlossen.','Ticket limit reached.':'Das Tippscheinlimit ist erreicht.',
 'Choose five different available numbers.':'Wähle fünf verschiedene freie Zahlen.','Join in the lobby.':'Beitritt ist nur in der Lobby möglich.',
 'Committed tickets cannot be withdrawn.':'Verbindliche Tippscheine können nicht zurückgezogen werden.',
 'A prize and at least one ticket are required.':'Ein Hauptgewinn und mindestens ein Tippschein sind erforderlich.',
 'Not enough participants.':'Nicht genügend Teilnehmer.','No rolls left.':'Keine Würfe mehr übrig.','Roll first.':'Zuerst würfeln.',
 'No bust to confirm.':'Es gibt keinen Einser-Wurf zu bestätigen.','Confirm the bust before continuing.':'Den Einser-Wurf zuerst mit „Weiter“ bestätigen.',
 'Select the next required die: ship, captain, then crew.':'Den passenden Würfel in der Reihenfolge Schiff (6), Kapitän (5), Mannschaft (4) auswählen.',
 'Ship, captain and crew are required.':'Schiff, Kapitän und Mannschaft müssen vollständig sein.','No action to undo.':'Kein Schritt zum Zurücknehmen.',
 'Finish the game before settlement.':'Die Partie muss vor der Abrechnung regulär beendet sein.',
 'Assign a character to every participant.':'Jedem Teilnehmer einen Charakter zuordnen.',
 'Assign the tavern bank or merchant.':'Tavernenbank oder Händler zuordnen.',
 'Settlement is already locked.':'Die Abrechnung ist bereits festgeschrieben.',
 'Each participant needs a different character.':'Jeder Teilnehmer benötigt einen anderen Charakter.',
 'Managed betting is disabled.':'Verwaltetes Setzen ist ausgeschaltet.','Configure the stakes first.':'Zuerst die Einsätze zuordnen.',
 'Managed currency currently supports D&D 5e/5.5e only.':'Währungsbuchungen unterstützen derzeit D&D 5e/5.5e.',
 'Not enough currency for settlement.':'Für die Abrechnung ist nicht genügend Geld vorhanden.',
 'Invalid character currency.':'Ungültiger Währungsbestand des Charakters.',
 'Settlement character is missing.':'Ein Charakter der Abrechnung fehlt.',
 'Currency update was not confirmed; resume settlement.':'Buchung nicht bestätigt. Abrechnung fortsetzen.',
 'Complete the pending settlement or prize delivery first.':'Offene Abrechnung oder Preisübergabe zuerst abschließen.',
 'Resume in the original GM browser before modifying wallets or items.':'Für Buchungen und Übergaben zuerst im ursprünglichen GM-Browser fortsetzen.',
 'Assign the winner character before delivery.':'Vor der Übergabe dem Gewinner einen Charakter zuordnen.',
 'The prize item is missing or out of stock.':'Der Preis fehlt oder ist nicht mehr vorrätig.',
 'The prize item is out of stock.':'Der Preis ist nicht mehr vorrätig.','The reserved source item is missing.':'Der reservierte Gegenstand fehlt.',
 'A prepared transfer must be completed.':'Eine vorbereitete Übergabe muss abgeschlossen werden.',
 'Select a world item or inventory item.':'Einen Welt- oder Inventargegenstand auswählen.'
 ,'GM authority changed. Resume with the active GM.':'Die aktive Spielleitung hat gewechselt. Dort fortsetzen.'
 ,'Custom currency conversions are not supported.':'Geänderte Währungswechselkurse werden noch nicht unterstützt.'
 ,'Empty the prize container before transfer.':'Den Preisbehälter vor der Übergabe leeren.'
 ,'Source update was not confirmed; retry delivery.':'Änderung des Vorrats nicht bestätigt. Übergabe erneut versuchen.'
 ,'Prize creation was not confirmed; retry delivery.':'Preisübergabe nicht bestätigt. Erneut versuchen.'
 ,'Prize delivery currently supports D&D 5e/5.5e only.':'Preisübergaben unterstützen derzeit D&D 5e/5.5e.'
};
Object.assign(ERRORS,{"The selected deck does not contain the required cards.": "Das Kartenset enthält nicht alle benötigten Karten eindeutig.", "The selected card set is unavailable.": "Das gewählte Kartenset ist nicht verfügbar.", "Two to five players.": "Mau-Mau benötigt zwei bis fünf Teilnehmer.", "This card cannot be played.": "Diese Karte kann gerade nicht ausgespielt werden.", "Choose a suit.": "Bitte eine Wunschfarbe wählen.", "Play a matching card first.": "Eine passende Karte ausspielen; weiteres Ziehen ist gerade nicht erlaubt.", "Draw first.": "Zuerst eine Karte ziehen.", "No missed call.": "Es gibt keine fristgerecht anfechtbare vergessene Ansage.", "The game has ended or is paused.": "Das Spiel ist beendet oder pausiert.", "Native Foundry Cards API is unavailable.": "Die native Foundry-Kartenverwaltung ist nicht verfügbar.", "A native game card is missing; restore the session stacks.": "Eine Spielkarte fehlt im Kartenbestand. Bitte Kartenbestände wiederherstellen."});
export const tavernError=message=>f(ERRORS[message]??message,message);
export function tavernGuide(game){if(game==='rps')return rpsGuide();if(['drink','eat'].includes(game))return newContestGuide(game);if(game==='checkers')return checkersGuide();if(['arm','connecttournament','morristournament','dotstournament'].includes(game))return contestGuide(game);if(game==='dots')return dotsGuide();if(game==='card21')return card21Guide();const reviewed=reviewedGuide(game);if(reviewed)return reviewed;if(game==='morris')return morrisGuide();if(game==='tictactoe')return ticGuide();if(!guideLanguageAvailable())return "<h2>Anleitung</h2><p>Die englische Anleitung ist noch nicht zur Veröffentlichung freigegeben. Die deutsche Anleitung ist über die Moduleinstellung Deutsch verfügbar.</p>";
 if(game==='tictactoe')return ticGuide();
 if(game==='durak')return durakGuide();
 if(['lucky','swim'].includes(game))return newGameGuide(game);
 if(game==='maumau')return mauGuide();
 if(game==='kings')return kingsGuide();
 if(game==='thirteen')return thirteenGuide();
  if(game==='klippklapp')return klippGuide();
  if(game==='poker')return pokerGuide();
  if(game==='aalstechen')return aalstechenGuide();
  if(game==='meiern')return meiernGuide();
  if(game==='seventeen')return seventeenGuide(gameTitle(game));
  if(['liars','hoard'].includes(game))return betaGuide(game)+tokenGuide(game);
  if(game==='kniffel')return kniffelGuide()+tokenGuide(game);
  const rules={
    pig:f('Du würfelst einen W6. Eine 2 bis 6 erhöht deine Zugpunkte. Du kannst weiterwürfeln oder die Punkte sichern und deinen Zug beenden. Eine 1 löscht nur die ungesicherten Zugpunkte. Sie bleibt sichtbar, bis du oder der SL mit Weiter zum nächsten Spieler schaltest; automatische NPCs schalten nach fünf Sekunden selbst weiter. Nach dem ersten gesicherten Erreichen des Ziels (Standard 100) haben alle anderen noch genau einen Zug. Der höchste Gesamtstand gewinnt. Optionale SL-Regel (standardmäßig aus): Bei gesicherter Zielpunktzahl sofort beenden, ohne Schlussrunde. Ein Klick auf einen Namen in der Spielerliste zeigt dessen letzte 20 gespeicherte Würfe dieser Partie. Beispiel: 4, 5 und 6 ergeben 15; eine folgende 1 macht daraus null Zugpunkte.',''),
    ship:f('Du hast fünf W6 und höchstens drei Würfe. Klicke selbst zuerst eine 6 als Schiff an, danach eine 5 als Kapitän und dann eine 4 als Mannschaft. Mehrere Stufen dürfen aus demselben Wurf herausgelegt werden; nur markierte Würfel bleiben beim nächsten Wurf liegen. Die zwei übrigen Würfel zählen als Ladung. Ohne vollständige Besatzung zählt dein Zug null. Übrige Würfe können beide Ladungswürfel gemeinsam ersetzen, auch wenn das neue Ergebnis schlechter ist. Der dritte Wurf bleibt sichtbar: Besatzung markieren und Zug abschließen drücken, auch bei null Punkten. NPCs markieren automatisch und schließen ihren fertigen Zug nach fünf Sekunden ab. Beispiel: 6/5/4/2/3 zählt nach dem Markieren fünf. Nach je einem Zug gewinnt die höchste Ladung. Führende mit Gleichstand wiederholen volle Züge bis zum eindeutigen Sieg.',''),
    lottery:f('Der SL legt Gegenstand, Wert, Ticketpreis und Limits fest. Der SL legt 1–100 Zahlen je Tippschein fest (Standard fünf). Ein verbindlicher Schein enthält genau diese Anzahl verschiedener Zahlen von 1–100. Jede Zahl ist pro Partie nur einmal verfügbar, auch bei mehreren Scheinen derselben Person. Maximal 20 Scheine sind möglich. Der SL schließt zuerst die Annahme und löst danach im Moderationsfenster mit W100 ziehen genau einen Wurf aus. Die Ziehung erfolgt nie automatisch. Mit aktiver Dice-So-Nice-Anbindung erhält jeder Tippscheinbesitzer eine eigene blanke 3D-Darstellung derselben Ziehung. Nach der Animation bleiben die Würfel blank und das Ergebnis geheim. Erst Aufdecken im Moderationsfenster zeigt die gespeicherte Zahl auf den Würfeln und im Fenster, ohne erneut zu würfeln. Auch ohne 3D muss der SL ausdrücklich aufdecken. Die Option SL: verdeckte Würfel einsehen ist standardmäßig aus und erlaubt ausschließlich der Spielleitung eine vorzeitige Einsicht, auch ohne eigenen Tippschein. Der Besitzer der passenden Zahl gewinnt den ganzen Gegenstand. Bei einer unverkauften Zahl behält der Händler Gegenstand und Einsätze. Beispiel: 11/15/21/30/42 gewinnt bei 21. Den Gegenstand wählt der SL aus.','')
  };
  const source=game==='ship'?'<a href="https://bicyclecards.com/how-to-play/ship-captain-and-crew" target="_blank" rel="noopener noreferrer">Bicycle Cards</a>':f('Regelvorgabe von Daniel Brune; Taverngames-Hausvariante.','');
  const betting=game==='pig'?f('Ab drei Personen bekommt Platz 2 den Einsatz zurück, Platz 3 die Hälfte und Platz 1 den Rest. Zu zweit erhält der Sieger den Topf. Gleiche Plätze erhalten jeweils ihre volle Platzprämie (Platzfolge 1/2/2/4). Die SL-Option Tavernenbank finanziert Zusatzprämien. Gewinn neu aufteilen reduziert stattdessen die Erstplatzprämie; bei geteilter Spitze bekommen alle denselben neu berechneten Anteil. Unteilbare Kupferreste gehen in Beitrittsreihenfolge. Vier Personen mit je 2 Gold und zwei Zweiten: 4/2/2/0 bei Neuverteilung.',''):game==='ship'?f('Hausregeln: Einzelspiel oder Serien mit fester beziehungsweise unbegrenzter Rundenzahl. Ladungspunkte werden addiert; Stechen am Serienende zählt nur zur Siegerermittlung. In unbegrenzten Serien kann der SL nach der laufenden Runde regulär abschließen. Grundeinsatz einmal für die ganze Serie; der Sieger erhält den Topf. Spiel beenden bricht ohne Abrechnung ab.',''):f('Ein ausgewählter Gegenstand wird automatisch einmal übergeben. Aus einem Inventar wird ein Stück entnommen; eine Weltvorlage wird kopiert. Fehlende Zuordnungen behebt der SL unter Einsätze & Spieltoken und versucht die Übergabe erneut.','');
  return `<h2>${gameTitle(game)} · ${f('Kurzanleitung','')}</h2><p>${rules[game]}</p><p>${betting}</p><p>${f('Nur die Spielleitung startet Partien und kann sie für alle abbrechen. Sie kann moderieren, ohne selbst mitzuspielen.','')}</p>${tokenGuide(game)}<h3>${f('Regelquelle','')}</h3><p>${source}</p>`;
}

Object.assign(ERRORS,{"One to ten participants.":"Es sind ein bis zehn Teilnehmer möglich.","No cards available.":"Es sind keine Karten mehr verfügbar.","No more cards.":"Es können keine weiteren Karten gezogen werden.","It is not the bank turn.":"Die Bank ist noch nicht am Zug.","Please wait for the result display.":"Bitte warten, bis die Ergebnisanzeige beendet ist."});

Object.assign(ERRORS,{'Grid size must be between 1 and 50.':'Die Rastergröße muss zwischen 1 und 50 liegen.','Draw a closed outline.':'Bitte eine geschlossene Außenlinie zeichnen.','Outline must not cross or touch itself.':'Die Außenlinie darf sich nicht kreuzen oder selbst berühren.','Choose an unused board edge.':'Bitte eine freie Linie auf dem Spielfeld wählen.'});

Object.assign(ERRORS,{'Attributes must be between 1 and 30.':'Attributswerte müssen zwischen 1 und 30 liegen.','Invalid roll mode.':'Ungültiger Wurfmodus.','Roll once per phase.':'Pro Phase darf jeder einmal würfeln.','No readable D&D character attributes.':'Kein lesbarer D&D-Charakterbogen mit passenden Attributen zugeordnet.','Control the NPC manually first.':'Den NPC zuerst auf manuelle Steuerung umstellen.'});
