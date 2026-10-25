# TavernGames 5.6.0 – 25.10.2026

## Deutsch

**Benötigt Foundry 14.369 oder neuer. Alle Clients nach Installation vollständig neu laden.**

Käsekästchen, Armdrücken und die Turniere für Vier gewinnt, Mühle und Käsekästchen sind nach Nutzerabnahme stabil. Neu als optionale Betas: Wetttrinken und Wettessen mit einstellbarem Start-SG, standardmäßig +1 je Runde, optionalen Doppelproben, internen Mali und geteilten Siegen sowie Dame auf einem 8×8-Brett mit langen Damen und konfigurierbaren Schlagregeln. Armdrücken kann die Bewegungsrichtung umschalten und blendet Wurfwürfel nach der Animation aus. Der Turnierplan zeigt Halbfinale, Finale und Sieger ohne überflüssige Freilos-Einführungsstufen. Insgesamt 27 stabile Spiele, vier stabile Turniere und drei neue Betas.

### Neue Wettkämpfe als Beta

Wetttrinken und Wettessen erlauben 2–16 Menschen und benannte NPCs. Hauptprobe: W20 plus Konstitutionsmodifikator, abzüglich interner Mali, gegen den aktuellen SG. Standard Start-SG10, Steigerung+1 pro Runde, SL kann1–100 beziehungsweise0–20 festlegen. Zwei misslungene Hauptproben insgesamt bedeuten Ausscheiden am Ende der Runde. Alle zuletzt aktiven Teilnehmer erhalten ihren vollständigen Zug; scheiden sie gleichzeitig aus, teilen sie den Sieg. Bereits früher Ausgeschiedene gewinnen dadurch nicht wieder. Die SL startet die nächste Runde. Natürliche1/20 sind keine automatischen Fehlschläge/Erfolge.

Doppelprobe ist standardmäßig an und optional abschaltbar. Sie wird auch nach misslungener Hauptprobe gewürfelt. Beim Trinken: zweite Konstitutionsprobe gegen denselben SG, Misslingen erhöht den kumulativen Malus um1 bis Partieende; dieser gilt für folgende Haupt- und Zusatzproben. Beim Essen: Zusatzprobe Geschicklichkeit gegen denselben SG, Misslingen verursacht−1 nur auf die nächste Hauptprobe. Danach verfällt dieser Malus vor der Zusatzprobe. Sekundärfehlschläge zählen nicht zusätzlich zu den zwei Ausscheidensfehlern.

Vor seiner nächsten Portion darf ein Teilnehmer aufgeben. NPCs prüfen automatisch vor jeder Portion einen unabhängigen W20; bei1 geben sie auf. Auch manuell gesteuerte NPCs behalten diese Regel. Dieser Entscheidungswurf ist unabhängig von Göttlicher Hand und wird intern ohne weitere3D-Animation abgewickelt. Die eigentlichen Attributsproben können wie Armdrücken Vorteil/Nachteil und direkte Göttliche-Hand-Boni/Mali verwenden. D&D5e-Attribute werden nur gelesen; manuelle Werte für andere Systeme/NPCs, Standard10(+0). Keine Zustände oder Währungen auf Charakterbögen ändern sich.

Optional zahlt jeder einmal gleiche interne Spieltoken. Gewinner teilen den Topf gleichmäßig; unteilbare Resttoken nach Teilnehmerreihenfolge, Abbruch erstattet. Ausgangswetten verwenden die bestehende Verwaltung. Beide Spiele sind eigene TavernGames-Hausregeln nach Daniel Brune, keine behaupteten offiziellen D&D-Wettkampfregeln. Deutsche Anleitungen enthalten diese Herkunft; Englisch bleibt bis Review gesperrt.

### Dame als Beta

8×8, zwölf Steine je Seite, dunkle Felder. Einfache Steine ziehen und schlagen vorwärts diagonal; Rückwärtsschlagen ist optional und standardmäßig aus. Damen ziehen diagonal beliebig weit, überspringen je Schlag einen gegnerischen Stein und können dahinter freie Landefelder wählen. Mögliche Mehrfachsprünge werden mit demselben Stein fortgesetzt, auch ohne allgemeine Schlagpflicht. Keine Pflicht zur längsten Route. Erreichen der Grundreihe wandelt um und beendet den Zug.

Drei Schlagmodi: strikt erzwingen (Standard); optionaler Strafmodus mit auf Ausgangsfeld zurückgesetztem Zug und Zugverlust; oder ohne allgemeine Schlagpflicht. Keine Feld-Rückwärtsstrafe und kein Entfernen eines vergessenen Steins. Diese Interpretation wurde vor Umsetzung ausdrücklich angekündigt. Wer keine Steine oder keine legalen Züge hat, verliert. Remis bei dreifacher Stellung mit gleichem Zugrecht oder einstellbaren1–500 Zugpaaren ohne Schlag/einfachen Steinzug, Standard50. Serien1–100 Runden, wechselnder Starter, NPCs Leicht/Normal/Schwer/manuell, Token einmal je Serie, finaler Gesamtsieger beziehungsweise Erstattung bei Remis/Abbruch. Keine Göttliche Hand für Dame.

Das Brett besteht aus eigenem HTML/CSS und einem Schriftzeichen für die Dame, ohne neue Fremd- oder KI-Grafiken. Regeln mit Schmidt-Spiele-Referenz, Abweichungen/Remis-/Serienergänzungen als TavernGames-Absprachen benannt. Neue englische Anleitung bleibt bis Review gesperrt.

### Übernahmen und Korrekturen

Käsekästchen, Armdrücken und die drei zusätzlichen Turniere sind nach Daniels Abnahme stabil und ohne Beta-Schalter verfügbar. Vier Turniere insgesamt. Die Wettkampf-Kategorie bleibt wegen Armdrücken auch ohne Beta sichtbar. Der Beta-Filter zeigt nur die drei neuen Spiele. Kniffel7 und Karten-Kniffel bleiben spätere Planung, offizielle Referenzen dokumentiert; Dame/Wettessen/Wetttrinken sind keine reinen Planeinträge mehr.

Armdrücken: Standardmarker bewegt sich beim Sieg von Spieler1 in Richtung Spieler2, als würde dessen Arm heruntergedrückt. SL kann zur bisherigen Gewinner-Richtung wechseln; reine Darstellung, Gewinnerberechnung unverändert. Alle geworfenen Armdrück-Würfel werden nach vollständiger Animation gezielt ausgeblendet statt anschließend sichtbar zu bleiben. Das verändert keine DSN-Einstellung oder andere Würfel.

Turniermodell blendet überflüssige reine Freilos-Einführungsstufen älterer Darstellungen aus. Vier Teilnehmer zeigen zwei echte Halbfinals, Finale und Champion, keine anfänglichen Freilose. Automatisierte Tests prüfen den tatsächlichen Start aller vier Turniere und die Darstellung historischer zusätzlicher Einführungsstufen. Sieger ist ein Ergebnisfeld und keine weitere gespielte Runde. Diagramme beschriften Halbfinale/Finale/Sieger explizit. Reguläre Freilose bei drei oder anderen nicht passenden Teilnehmerzahlen bleiben erhalten. Keine Änderung der eigentlichen K.-o.-Entscheidung.

## English

**Requires Foundry 14.369 or later. Fully reload all clients after updating.**

Dots and Boxes, Arm Wrestling and the Four in a Row, Morris and Dots and Boxes tournaments are stable following user approval. New optional betas: Drinking Contest and Eating Contest with configurable starting DC, a default increase of +1 per round, optional secondary checks, internal penalties and shared victories, plus Checkers on an 8×8 board with flying kings and configurable capture rules. Arm Wrestling supports switching the marker direction and clears thrown dice after the animation. Tournament brackets show semifinals, final and champion without redundant bye-only introductory stages. The catalog contains 27 stable games, four stable tournaments and three new betas.

### New contest betas

Drinking Contest and Eating Contest support2–16 people or named NPCs. Each main check is a d20 plus Constitution modifier minus internal penalties against the current DC. Defaults: DC10 and+1 each round; the GM can choose1–100 and0–20 respectively. Two failed main checks cause elimination at round end. Everyone who started the round completes it; if the last remaining entrants all drop out together, they share first place. Earlier eliminated entrants are excluded. The GM starts the next round. Natural1/20 do not automatically fail/succeed.

Optional secondary checks are enabled by default and occur even after a failed main check. Drinking uses another Constitution check against the same DC; each failure adds a cumulative−1 penalty for later main and secondary checks until session end. Eating uses Dexterity; failure gives−1 only to the next main check, then expires before its secondary check. Secondary failures do not count toward elimination.

Participants may withdraw before their next portion. NPCs independently check a d20 before each portion and withdraw on1, including manually controlled NPCs. This decision is unaffected by Divine Hand and does not create an extra3D animation. Actual checks support advantage/disadvantage and direct Divine Hand adjustments as in Arm Wrestling. D&D5e attributes are read only; other systems and NPCs use manual attributes, default10(+0). No actor conditions or currency are changed.

Optional entry tokens are paid once per contest. Winners share the pot; indivisible tokens follow participant order, while aborting refunds entry. Outcome betting reuses existing controls. These are Daniel Brune's TavernGames house rules, not official D&D contest rules. German guides include credits; new English guides remain blocked until review.

### Checkers beta

8×8 board, twelve pieces each, dark squares only. Men move/capture diagonally forward; backward capture is optional and disabled by default. Flying kings move along diagonals and capture one enemy per jump, choosing an empty landing square beyond it. Further captures continue with that piece even when general compulsory captures are disabled; longest route is not required. Promotion ends the turn.

Capture settings: strictly enforced by default; optional penalty mode undoing a missed-capture quiet move to its origin and forfeiting the turn; or optional captures. No extra backward-square punishment or piece removal. No pieces or no legal moves loses. Threefold repetition or1–500 quiet move pairs produces a draw, default50, reset by captures or man moves. Series1–100 rounds alternate starters; NPC difficulty/manual control, one-time series tokens, final winner or refunds for drawn/aborted series. Divine Hand does not modify this board game.

Original HTML/CSS board with a font glyph for kings; no new third-party or AI images. Schmidt Spiele is credited as the rules reference; agreed variants, draw limits and series are identified as TavernGames additions. New English instructions remain blocked pending review.

### Stable promotions and fixes

Dots and Boxes, Arm Wrestling and three additional tournaments become stable following Daniel's approval. Four stable tournaments in total. The contest category remains available with beta disabled; beta filtering shows only the three new games. Kniffel7 and Karten-Kniffel remain planned, with official references recorded.

Arm Wrestling now defaults to pushing toward the opponent, with the old winner-facing direction selectable by the GM. This changes presentation only. Thrown Arm Wrestling dice are hidden after the complete animation instead of lingering, without changing DSN settings or unrelated dice.

The bracket renderer omits redundant bye-only introductory stages in older displays. Four entrants show two semifinals, a final and a champion result; the champion is not another played round. All four tournament engines are tested for correct four-entrant starts, while real byes for three or other unmatched participant counts remain. Actual knockout decisions are unchanged.


Prüfungen mit Foundry-/DSN-Doubles ersetzen keinen Live-Mehrspielertest. / Checks using Foundry/DSN doubles do not replace live multiplayer testing.
