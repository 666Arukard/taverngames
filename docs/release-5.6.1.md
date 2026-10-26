# TavernGames 5.6.1

## Deutsch

Korrekturupdate ohne neue Spiele oder Stable-Hochstufungen: 27 stabile Spiele, vier stabile Turniere und drei Beta-Spiele bleiben erhalten.

- Wettkampfergebnisse und die Armdrücken-Markierung erscheinen erst passend zur Würfelanimation, auch während der kurzen Vorbereitung vor dem Animationsevent.
- Die untere Steuerung erhält laufende Klicks bei Aktualisierungen und unterscheidet Haupt- und Zusatzprobe. Aufeinanderfolgende Partien verwenden ihre eigenen Würfel-Klickaktionen.
- Göttliche Hand beeinflusst bei Armdrücken, Wetttrinken und Wettessen die tatsächliche W20-Zahl statt eines zusätzlichen Ergebnisbonus. 0 % bleibt unveränderter Zufall, mittlere Werte behalten Streuung, 100 % ergibt bei Glück 20 und bei Pech 1. Der Prozentwert ist keine Gewinnchance. Attribute, Vorteil/Nachteil und Spielmali gelten weiter. Historische Ergebnisse werden nicht umgeschrieben. Die zufällige NPC-Aufgabe bleibt unabhängig davon.
- Kniffel und Extreme platzieren ruhende 3D-Würfel bei eingeblendetem Spielfeld-Wertungsblock in einem freien Streifen darunter. Eigene Würfel lassen sich dort direkt zum Behalten oder Zurücknehmen anklicken, einschließlich W10. Die globale Markierungsrichtung wird berücksichtigt; fremde Züge, Animationen und Pausen bleiben geschützt. Fehlt geeigneter Platz, bleibt die bisherige Anordnung verfügbar.
- Eine NPC-Aufgabe ohne Würfelanimation kann die Wettkampf-Abschlussmeldung nicht mehr festhalten.
- Skat, Rommé, Doppelkopf, Halma, Canasta, Bridge und Backgammon sind als Regelplanung erfasst beziehungsweise ergänzt, nicht implementiert.

Benötigt Foundry VTT ab 14.369. Nach dem Update alle Clients neu laden. Keine neuen englischen Anleitungen freigegeben; keine Charakter-Geldbuchungen.

Laut Entwicklerprüfung: 729 automatisierte Tests und Zweiclient-Browserprüfungen mit Foundry-/Dice-So-Nice-Doubles. Die direkte 3D-Würfelbedienung benötigt noch einen Praxistest mit echtem Dice So Nice; keine neue Live-Foundry-Abnahme.

## English

Maintenance release: 27 stable games, four stable tournaments and three optional Beta games remain available. No new games or promotions.

- Contest results and the Arm Wrestling marker remain hidden until the dice animation is ready, including the preparation before its event.
- Bottom controls retain active clicks across refreshes and distinguish main and secondary checks. Consecutive games use their own dice click handlers.
- Divine Hand biases actual d20 faces in Arm Wrestling, Drinking and Eating instead of adding a result bonus. At 0% randomness is unchanged; intermediate strengths retain variation; 100% produces 20 for favor or 1 for disfavor. This percentage is not a win probability. Attributes, advantage/disadvantage and game penalties still apply. Historical results remain unchanged; random NPC withdrawal is independent.
- Kniffel and Extreme can place resting 3D dice in a free strip below the on-table score sheet. Click your own dice to hold or return them, including the d10, respecting the global marking preference. Other players' turns, animations and pauses remain protected. The previous arrangement is available when suitable space is missing.
- NPC withdrawal without an animation no longer holds back the final contest announcement.
- Skat, Rummy, Doppelkopf, Halma, Canasta, Bridge and Backgammon are recorded or expanded as rule planning, not implemented.

Requires Foundry VTT 14.369 or later. Reload all clients after updating. No new English guides have been approved; no Actor currency changes.

The developer reports 729 automated tests and two-client browser checks with Foundry/Dice So Nice doubles. Direct 3D dice interaction still needs practical verification with real Dice So Nice; this is not a new live Foundry certification.
