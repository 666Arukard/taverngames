# TavernGames 5.6.2

## Deutsch

Neue Beta: Schere, Stein, Papier mit klassischem Set, Echse/Spock und eigenen Regelsets. Beide Teilnehmer wählen unabhängig und verdeckt; erst nach beiden verbindlichen Entscheidungen wird aufgedeckt. Eigene Sets mit 3–25 frei benannten Figuren, optionalen Textsymbolen, vollständiger Beziehungstabelle und Balancehinweis; bis zu 20 Sets pro Welt speichern, kopieren und löschen. Einstellbares Siegziel, zufällig wählende oder manuell gesteuerte NPCs, gemeinsame Spieltoken und Ausgangswetten. Alle Korrekturen aus 5.6.1 enthalten. Keine Stable-Hochstufungen; die neue englische Anleitung wartet auf Review.

27 stabile Spiele, vier stabile Turniere und vier Beta-Spiele (35 Katalogeinträge). Keine bestehende Beta als stabil erklärt. Schere, Stein, Papier ist unter Brettspiele und dem Beta-Filter auffindbar. Es benötigt weder Dice So Nice noch ein bestimmtes Spielsystem. Nur die SL startet, pausiert oder beendet und startet den nächsten Durchgang; sie kann selbst mitspielen. Zwei Teilnehmer aus Spielern/SL/benannten NPCs.

### Neue Beta und eigene Figuren

Beide wählen unabhängig in beliebiger Reihenfolge. Die eigene Entscheidung ist sichtbar, fremde Entscheidungen bleiben bis zur zweiten verbindlichen Auswahl verborgen; auch gegenüber der SL. Danach erscheinen beide Figuren gleichzeitig und der Gewinner des Durchgangs. Identische Figuren geben keinen Punkt. Die SL startet den nächsten Durchgang. Standardziel drei Siege, einstellbar 1–100. Optionaler Token-Einsatz einmal pro gesamter Partie; der Gesamtsieger erhält den Topf. Abbruch erstattet. Gemeinsame Ausgangswetten bleiben vor dem Start möglich. Göttliche Hand ist hier nicht implementiert.

Die Moderation bietet Klassisch, Echse/Spock und gespeicherte eigene Vorlagen. Figurenname und optionales Textsymbol sind frei bearbeitbar; 3–25 Figuren, höchstens 20 eigene Sets pro Welt. Die Beziehungstabelle verlangt für jedes Paar genau einen Sieger; identische Figuren bleiben immer Remis. Sie zeigt unten gespiegelt denselben Sieger. Fehlende/ungültige Beziehungen oder doppelte Figurennamen verhindern Speichern und Lobbyeröffnung. Unausgewogene Sets sind nach Hinweis erlaubt. Speichern aktualisiert die geladene eigene Vorlage, „Als neues Regelset speichern“ erzeugt eine Kopie; Löschung entfernt nur die Vorlage. Eine bereits geöffnete Lobby beziehungsweise laufende Partie behält ihren Regelschnappschuss. Neue Regeln werden beim Öffnen einer neuen Lobby übernommen.

Automatische NPCs wählen gleichverteilt und unabhängig von geheimen Gegnerentscheidungen. Die SL kann sie auf manuell stellen und im Spiel über „Auswahl für“ bedienen. Es gibt hierfür keine vorgetäuschten NPC-Schwierigkeitsstufen. Alle Zeichen sind Textglyphen; keine neuen Bilddateien oder fremden Figurengrafiken.

### Enthaltene Korrekturen aus 5.6.1

Korrekturupdate ohne neue Spiele oder Stable-Hochstufungen: 27 stabile Spiele, vier stabile Turniere und drei Beta-Spiele bleiben erhalten.

- Wettkampfergebnisse und die Armdrücken-Markierung erscheinen erst passend zur Würfelanimation, auch während der kurzen Vorbereitung vor dem Animationsevent.
- Die untere Steuerung erhält laufende Klicks bei Aktualisierungen und unterscheidet Haupt- und Zusatzprobe. Aufeinanderfolgende Partien verwenden ihre eigenen Würfel-Klickaktionen.
- Göttliche Hand beeinflusst bei Armdrücken, Wetttrinken und Wettessen die tatsächliche W20-Zahl statt eines zusätzlichen Ergebnisbonus. 0 % bleibt unveränderter Zufall, mittlere Werte behalten Streuung, 100 % ergibt bei Glück 20 und bei Pech 1. Der Prozentwert ist keine Gewinnchance. Attribute, Vorteil/Nachteil und Spielmali gelten weiter. Historische Ergebnisse werden nicht umgeschrieben. Die zufällige NPC-Aufgabe bleibt unabhängig davon.
- Kniffel und Extreme platzieren ruhende 3D-Würfel bei eingeblendetem Spielfeld-Wertungsblock in einem freien Streifen darunter. Eigene Würfel lassen sich dort direkt zum Behalten oder Zurücknehmen anklicken, einschließlich W10. Die globale Markierungsrichtung wird berücksichtigt; fremde Züge, Animationen und Pausen bleiben geschützt. Fehlt geeigneter Platz, bleibt die bisherige Anordnung verfügbar.
- Eine NPC-Aufgabe ohne Würfelanimation kann die Wettkampf-Abschlussmeldung nicht mehr festhalten.
- Skat, Rommé, Doppelkopf, Halma, Canasta, Bridge und Backgammon sind als Regelplanung erfasst beziehungsweise ergänzt, nicht implementiert.

Benötigt Foundry VTT ab 14.369. Nach dem Update alle Clients neu laden. Laut Entwicklerprüfung 738 automatisierte Tests und DE/EN-Zweiclient-Browserprüfungen mit Foundry-Testdoubles bestanden; keine neue echte Foundry-Abnahme. Direkte 3D-Würfelbedienung bitte mit echtem Dice So Nice prüfen. Acht geprüfte englische Anleitungen bleiben verfügbar; die neue Anleitung wartet auf Review.

Regelreferenz Echse/Spock: [Sam Kass und Karen Bryla](https://www.samkass.com/theories/RPSSL.html). Eigene Regelfassung; kein fremdes Artwork oder Quellcode enthalten.

## English

New beta: Rock, Paper, Scissors with classic, Lizard/Spock and custom rule sets. Both participants choose independently and secretly; choices lock and reveal together only after both have selected. Custom sets support 3–25 named figures, optional text symbols, a complete relationship matrix and a balance warning; save, copy and delete up to 20 sets per world. Configurable target wins, random or manually controlled NPCs, shared game tokens and outcome betting. Includes all 5.6.1 fixes. No stable promotions; the new English guide awaits review.

27 stable games, four stable tournaments and four betas (35 catalog entries). Two participants choose independently; even the GM cannot inspect an opponent's unrevealed decision. Automatic NPCs choose randomly without using hidden opponent choices. Identical figures draw and do not score. The GM starts the next round; the first to the configured target wins the session. Optional stakes are reserved once for the entire session, paid to the winner, or refunded on abort.

The editor supports 3–25 named figures with optional text symbols and exactly one winner for every distinct pair. Missing/conflicting relationships are rejected, imbalance is warned about but allowed. Save up to 20 world rule sets, copy or delete them; active games retain their own rules snapshot. Classic and Lizard/Spock templates are included with source credits, without third-party artwork or copied source text. Divine Hand is not implemented for this game.

Includes all 5.6.1 fixes: guarded contest results, reliable bottom action buttons, actual d20 luck rather than an extra result bonus, and direct Kniffel/Extreme 3D hold/return selection below the on-field score sheet. Tests use Foundry/DSN doubles; real Foundry/DSN playtesting remains required. No new English guide approval or Actor currency transactions.

### Included fixes from 5.6.1

Maintenance release: 27 stable games, four stable tournaments and three optional Beta games remain available. No new games or promotions.

- Contest results and the Arm Wrestling marker remain hidden until the dice animation is ready, including the preparation before its event.
- Bottom controls retain active clicks across refreshes and distinguish main and secondary checks. Consecutive games use their own dice click handlers.
- Divine Hand biases actual d20 faces in Arm Wrestling, Drinking and Eating instead of adding a result bonus. At 0% randomness is unchanged; intermediate strengths retain variation; 100% produces 20 for favor or 1 for disfavor. This percentage is not a win probability. Attributes, advantage/disadvantage and game penalties still apply. Historical results remain unchanged; random NPC withdrawal is independent.
- Kniffel and Extreme can place resting 3D dice in a free strip below the on-table score sheet. Click your own dice to hold or return them, including the d10, respecting the global marking preference. Other players' turns, animations and pauses remain protected. The previous arrangement is available when suitable space is missing.
- NPC withdrawal without an animation no longer holds back the final contest announcement.
- Skat, Rummy, Doppelkopf, Halma, Canasta, Bridge and Backgammon are recorded or expanded as rule planning, not implemented.

Requires Foundry VTT 14.369 or later. Reload all clients after updating. The developer reports 738 automated tests and DE/EN two-client browser checks using Foundry doubles; no new live Foundry certification. The eight previously approved English guides remain available; the new guide awaits review.

Lizard/Spock rule reference: [Sam Kass and Karen Bryla](https://www.samkass.com/theories/RPSSL.html). Independently written rules; no third-party artwork or source code included.
