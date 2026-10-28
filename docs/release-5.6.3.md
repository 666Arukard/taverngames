# TavernGames 5.6.3

## Deutsch

Schwimmen erhält zwei Regeloptionen: Im ersten eigenen Zug jeder neuen Spielrunde darf standardmäßig nicht gepasst werden; optional gilt der Dreiertausch automatisch als Passen. Während des gesperrten ersten Zugs bleibt der Dreiertausch ohne Rundenschluss erlaubt. Schocken und Schweinchen zeigen keine zusätzliche Augensumme über den 3D-Würfeln; die obere Schweinchen-Anzeige bleibt erhalten. Kniffel-Extreme-Würfel erhalten mehr Platz und werden größer dargestellt. Die Beziehungstabelle für Schere, Stein, Papier öffnet sich in einem separaten, verschiebbaren und vergrößerbaren Fenster. Keine neuen Spiele oder Stable-Hochstufungen.

Unverändert 27 stabile Spiele, vier stabile Turniere und vier Betas. Alle Änderungen aus 5.6.1 und 5.6.2 sind enthalten; keine neue englische Anleitung freigegeben.

### Regeln und Darstellung

- Schwimmen: noFirstPass ist standardmäßig an. Jeder Spieler muss seinen ersten eigenen Zug jeder neuen Karten-/Spielrunde mit Tauschen oder Schieben verbringen. Ab seinem zweiten Zug darf er passen. Ein weiterer Zugumlauf setzt die Sperre nicht zurück; die nächste ausgeteilte Runde schon. Das Anfordern neuer Tischkarten bei 7/8/9 zählt nicht als Zug. NPCs beachten die Sperre.
- swapAllPass ist standardmäßig aus. Eingeschaltet erklärt ein Dreiertausch automatisch Passen, sofern der Spieler bereits passen darf und noch niemand gepasst hat. Alle anderen erhalten noch genau einen Zug. Ein weiterer Dreiertausch in diesen Schlusszügen setzt die Liste nicht neu auf. Knack/Blitz bleiben sofortige Rundenschlüsse. Beide Optionen sind in der Moderation vor der neuen Lobby einstellbar.
- Die reine 3D-Augensummen-Einblendung entfällt für Schocken und Schweinchen. Regeln/Wertungen und das obere Schweinchen-HUD mit Name, Zugpunkten und Gesichert bleiben unverändert. Summen anderer Spiele bleiben erhalten.
- Extreme: mehr reservierter Platz unter dem Spielfeldblock, bis 100 statt 72 Bildschirmpixel Würfeldurchmesser und bei Bedarf größere 3D-Skalierung. Enger Platz begrenzt die Größe weiterhin, damit sechs Würfel und W10 weder überlappen noch den Block verdecken. Klassisches Kniffel behält seine Größenbegrenzung. Echte DSN-Kamera/Perspektive zusätzlich im Praxistest prüfen.
- RPS: Button „Beziehungstabelle öffnen“ in der Moderation öffnet ein natives, verschiebbares/vergrößerbares Fenster mit anfänglich bis 1000 Pixel Breite. Große Tabellen scrollen darin. Änderungen sind sofort Teil desselben Vorlagenentwurfs; „Zur Moderation zurück“ schließt das Fenster ohne Verlust. Dauerhaft speichern weiterhin über „Regelset speichern“. Laufende Spiele behalten ihre eigenen Regeln. Fokus-/Klickschutz verhindert einen Austausch während der Eingabe. Schließen des Spiels/Deaktivieren der Beta schließt auch das Zusatzfenster.

Benötigt Foundry VTT ab 14.369. Nach dem Update alle Clients neu laden. Laut Entwicklerprüfung 741 automatisierte Tests und DE/EN-Browserprüfungen mit Foundry-/DSN-Testdoubles bestanden. Keine neue echte Foundry-Abnahme; die 3D-Anordnung bitte zusätzlich mit echtem Dice So Nice testen. Keine Charakter-Geldbuchungen.

## English

Thirty-One adds two rule options: passing is disabled by default on each participant’s first turn of every new hand; optionally, swapping all three cards automatically passes and starts final turns. A swap on the protected first turn remains allowed without closing the hand. Schocken and Pig no longer show an extra sum above their 3D dice; Pig’s player, turn points and banked score display remains. Kniffel Extreme dice get more room and a larger resting size. Rock, Paper, Scissors opens its relationship matrix in a separate movable, resizable window. No new games or stable promotions.

Thirty-One tracks the first completed turn separately for each participant and resets it only when a new hand is dealt. Refreshing a 7/8/9 table does not consume that turn. NPCs obey the same restriction. Swap-all closing respects the restriction and never replaces an existing final-turn list. Knack and Blitz still end a hand immediately.

The RPS matrix edits the same draft in an independent native window; save it in moderation for persistence. Existing games keep their rules snapshot. Larger Extreme dice remain bounded by available room. Ordinary Kniffel and other games' sums are preserved.

741 automated tests and German/English browser checks with Foundry/DSN doubles passed. Real Foundry/DSN playtesting remains required. No new English guide approval or Actor currency changes.

Both options are configured in moderation before opening a new lobby: first-turn passing restriction is enabled by default; swap-all passing is disabled by default. Once enabled, swap-all starts final turns only when passing is allowed and nobody has already passed. Other participants receive exactly one final turn.

Extreme resting dice can reach 100 screen pixels instead of 72, subject to available space; ordinary Kniffel retains its size limit. The matrix window starts at up to 1000 pixels wide and scrolls for large sets. Returning to moderation preserves the draft; save the rule set there for persistence. Closing the game or disabling Beta closes the extra window. Input focus and clicks remain protected across refreshes.

Unchanged: 27 stable games, four stable tournaments and four optional Beta games. All changes from 5.6.1 and 5.6.2 are included.

Requires Foundry VTT 14.369 or later. Reload all clients after updating.
