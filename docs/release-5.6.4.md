# TavernGames 5.6.4

## Deutsch

Neue optionale Beta: Streichholzspiel mit zwei Spielern oder benannten NPCs. Standard: 21 Hölzer, pro Zug eins bis drei nehmen, wer das letzte nimmt verliert. Startmenge, Entnahmegrenze und die alternative Regel „Letztes nehmen gewinnt“ sind durch die SL einstellbar. Serien mit wechselndem Startspieler, NPC-Stärken und manuelle NPC-Steuerung, gemeinsame Spieltoken und Ausgangswetten. Darstellung direkt auf dem Spieltisch ohne zusätzliche Bilddateien. Alle Korrekturen aus 5.6.3 enthalten; keine Stable-Hochstufungen oder neuen englischen Anleitungsfreigaben.

Unverändert 27 stabile Spiele und vier stabile Turniere. Fünf Betas: Wetttrinken, Wettessen, Dame, Schere/Stein/Papier und Streichholzspiel; 36 Katalogeinträge. Neues Spiel unter Brettspiele und Beta-Filter. Kein bestimmtes Spielsystem oder Dice So Nice erforderlich. Acht bisher freigegebene englische Anleitungen bleiben verfügbar; die neue Streichholz-Anleitung Englisch bleibt bis Review gesperrt.

### Regeln und Umsetzung

Zwei Teilnehmer (Menschen, mitspielende SL und/oder benannte NPCs). Eine gemeinsame Reihe von Hölzern, keine Mehrhaufen-Nim-Variante. Standard 21, einstellbar 1–200; Entnahme 1 bis standardmäßig3, maximale Entnahme einstellbar1–20. Die tatsächliche Auswahl ist durch den verbleibenden Vorrat begrenzt. Jeder muss mindestens eines nehmen. Standard letzter Nehmer verliert; optional gewinnt er. Bei einem einzigen Holz ist daher je nach Regel sofort die gegenüberliegende Person oder der Nehmer Sieger.

Die SL beginnt/beendet/pausiert unabhängig von eigener Teilnahme, wählt ersten Spieler oder Zufall. In einer Serie1–100Runden wechselt anschließend der Starter. Jede gewonnene Runde zählt einen Punkt. Nach dem letzten Durchgang entscheidet die Zahl der Siege, bei Gleichstand geteilter Platz. Die SL beginnt Folgedurchgänge. Abbruch hat keinen Sieger. Klassische frei bewegliche Fenster bleiben alternativ zur Reiter-/Spielfeldansicht verfügbar.

NPCs: Leicht variiert, Normal wählt bevorzugt gute Züge mit gelegentlichen Fehlern, Schwer berechnet optimale Züge für diesen begrenzten Ein-Haufen-Regelsatz. Bereits verlorene Stellungen können dadurch nicht garantiert gewonnen werden. Manuelle NPC-Steuerung jederzeit durch SL wie bei den anderen Brettspielen. Göttliche Hand bleibt für dieses Spiel nicht implementiert.

Token optional einmal pro gesamter Serie, Sieger erhält Topf. Geteilte Gesamtsiege und Abbruch erstatten Einsätze. Ausgangswetten nutzen die gemeinsame Verwaltung und schließen vor Start. Keine Actor-Währung. Darstellung als CSS-Hölzer, entfernte Hölzer gedimmt; keine externen Bilddateien oder Installationsabhängigkeiten.

Benötigt Foundry VTT ab 14.369. Nach dem Update alle Clients neu laden. Laut Entwicklerprüfung 749 automatisierte Tests sowie deutsche und englische Zwei-Client-Browserprüfungen mit Foundry-Testdoubles bestanden; keine neue echte Foundry-Abnahme.

## English

New optional beta: Matchstick Game for two players or named NPCs. Defaults: 21 sticks, take one to three per turn, taking the last loses. The GM can configure the starting amount, take limit and the alternative last-stick-wins rule. Includes series with alternating starters, NPC difficulty/manual control, shared game tokens and outcome betting. The table uses an original HTML/CSS display without additional image assets. Includes all 5.6.3 fixes; no stable promotions or new English guide approvals.

Defaults are last-taker-loses, 21 starting sticks and a maximum take of 3. The two-player game enforces turns and requires taking at least one stick. GM settings allow 1–200 sticks, a take limit 1–20 and 1–100 rounds. Round wins score one point; the starter alternates; tied series share the result. NPC levels affect decisions only. Shared token stakes apply once per series; ties and aborts refund. No Actor currency changes or Divine Hand behavior.

27 stable games and four stable tournaments remain unchanged; five optional betas, 36 catalog entries. The new English guide awaits review. 749 automated tests and German/English two-client checks with Foundry doubles passed; no new live Foundry certification. No third-party image assets.

The game uses a single shared pile, not multi-pile Nim. Two participants may be players, the participating GM or named NPCs. Available moves are limited by the remaining sticks. With one stick, the selected end rule determines whether the taker or opponent wins. The GM can start, pause or end play without participating, choose the initial starter or select one randomly, and start subsequent rounds. Each round win scores one point; the total decides the series. Aborting has no winner.

Easy NPCs vary their moves; Normal favors good moves with occasional mistakes; Hard calculates optimal moves for this bounded single-pile rule set, without promising wins from lost positions. The GM can control NPCs manually. Outcome betting closes before play. Tied series and aborted games refund token stakes. Removed sticks are dimmed; floating windows remain available as an alternative to the sidebar/table view. No installation dependencies or specific game system are required. The eight previously approved English guides remain available; the new guide awaits review.

Requires Foundry VTT 14.369 or later. Reload all clients after updating.
