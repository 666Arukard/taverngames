# TavernGames 5.5.0 – 25.10.2026

## Deutsch

**Benötigt Foundry 14.369 oder neuer. Alle Clients nach Installation vollständig neu laden.**

**Mühle und 17 und 4 als Kartenspiel sind nach Daniels Praxistest stabil.** Beide stehen unabhängig vom Beta-Schalter bereit. Enthalten sind nun 25 stabile Spiele, ein stabiles Tic-Tac-Toe-Turnier und eine neue optionale Beta: **Käsekästchen**. Insgesamt 27 Katalogeinträge. Keine Kartengrafiken und keine neuen Pflichtmodule.

Käsekästchen: Zwei Teilnehmer verbinden abwechselnd benachbarte Rasterpunkte durch eine waagerechte oder senkrechte Linie. Eine vierte Seite erobert das Kästchen und gibt einen Punkt sowie einen weiteren Zug. Eine Linie kann zwei Kästchen erobern. Ohne Eroberung wechselt der Zug. Alle Kästchen vergeben beendet die Runde. Die meisten Punkte gewinnen; Gleichstand ist unentschieden. Menschen, benannte NPCs, NPC-Stärken Leicht/Normal/Schwer, manuelle SL-Steuerung, Pause und Abbruch. Der schwere NPC wählt bevorzugt schließende und anschließend möglichst wenig riskante Linien; keine perfekte Spielstrategie behauptet.

Die SL wählt ein Rechteck von 1–50 Kästchen je Richtung oder zeichnet eine eigene Spielfläche. Der freie Editor startet mit einem 50×50-Raster, lässt sich kleiner einstellen und unterstützt Zeichnen/Radieren, Leeren und ein Rechteck als Vorlage. Entlang der Rasterpunkte ziehen, die Bildlaufleisten verschieben den großen Editor. Geschlossene Flächen ohne Kreuzungen oder offene Enden sind erforderlich; getrennte Flächen und geschlossene Löcher sind möglich. Ungültige Formen werden vor Lobbyeröffnung und erneut auf der maßgeblichen Instanz zurückgewiesen. Die Außenlinie begrenzt nur die Fläche und ist **kein bereits gesetzter Spielzug**. Randseiten müssen im Spiel ebenfalls gesetzt werden.

Das Spielbrett liegt zentral auf dem Tisch, zeigt die tatsächlich ausgewählte Form statt der leeren Rasterumgebung und unterstützt Zoom, Einpassen und Scrollen. Ein freier Rand wird beim Überfahren hervorgehoben; Klick setzt ihn. Tastatur: Brett fokussieren, Pfeiltasten wählen eine freie Linie, Eingabe setzt sie. Blaue und goldene Linien sowie farbige Kästchen mit Spielerzahl unterscheiden die Teilnehmer. Ein unveränderter Polling-Stand ersetzt nicht den Brett-DOM. Nach Rundenende startet die SL die Folgerunde; der Startspieler wechselt. Bei 1–100 Runden werden die eroberten Kästchen addiert. Optionale Spieltoken werden einmal für die gesamte Serie eingezahlt; finaler Sieger erhält den Topf, bei Gleichstand/Abbruch Erstattung. Keine Charakterbuchungen und keine Göttliche Hand bei diesem Brettspiel.

Grundregeln anhand der eigenen Anleitungen von [kinder](https://www.kinder.com/de/de/kinder-spiel-und-spass/spiele/kaesekaestchen) und [BrettspielNetz](https://www.brettspielnetz.de/spielregeln/kaesekaestchen.php) überprüft. Eigene Formulierungen und eigene SVG-Brettdarstellung. Freier Editor, Serien, NPCs und Token sind TavernGames-Ergänzungen. Neue deutsche Anleitung mit Quellen, Englisch bis Review gesperrt. Sechs bereits freigegebene englische Anleitungen bleiben verfügbar.

Vorbereitete Änderungen sind mit enthalten:

- Kniffel und Extreme: gemeinsamer SL-Schalter „Wertungsblock anzeigen“ für Lobby oder Spielfeld. Auf dem Feld kompakt ohne Scrollen, stabiler DOM bei unverändertem Polling. Nur aktuelle Zugwürfel bleiben sichtbar, keine Augensummen-Beschriftung. Fensteransicht verwendet weiterhin den Lobbyblock.
- 17 und 4 Karten: eigene Kartensumme über der Hand, aus der berechtigten Empfängerprojektion. Fremde Startkarten bleiben verdeckt.
- Drachenhort: NPC-Reaktion zwei statt fünf Sekunden. Ergebnisfenster von drei Sekunden und Animationsschutz bleiben maßgeblich.
- Schwarzer Peter: Gegnerfeld und Gegenhand zentriert, kompaktere Gegenkarten und oben anliegende, stärker überlappende Paarablage. Bildschirmabhängige Kartengrößen halten Platz für vollständige Paare frei; weitere Paare scrollbar.

## English

**Requires Foundry 14.369 or later. Fully reload all clients after updating.**

**Nine Men’s Morris and Seventeen and Four as a card game are stable following user testing.** Both remain available with beta testing disabled. The catalog now has 25 stable games, one stable Tic-Tac-Toe tournament and one optional beta, **Dots and Boxes**: 27 entries in total. No bundled card images or new required modules.

Two participants alternate placing a horizontal or vertical edge between adjacent points. Completing a box awards one point and another move. A single edge may complete two boxes. Without a capture, play passes to the other participant. The round ends when all boxes have been claimed. Most points win; equal points mean a draw. Human players, named NPCs, Easy/Normal/Hard difficulty, manual NPC control, pause and abort are supported. Hard prefers captures and then less risky moves; it is not advertised as perfect play.

Choose a rectangle of 1–50 boxes in each direction or draw a custom board. The editor initially offers a 50×50 grid and supports smaller sizes, draw/erase, clear and a rectangle template. Drag along grid points; scroll to navigate the editor. Outlines must be closed without crossings or open ends. Disconnected regions and enclosed holes are supported. Invalid shapes are rejected before opening the lobby and again by the authoritative rules. The outline selects the playable area; it does **not** pre-play boundary edges.

The central playing field crops to the selected area, with zoom, fit and scrolling. Hover previews an unused edge, click plays it. Keyboard users can focus the board, select free edges with arrow keys and play with Enter. Blue/gold edges and numbered colored boxes distinguish the participants. Unchanged polling preserves the actual board DOM. Series allow 1–100 rounds, alternate the starter and add box scores. The GM starts the following round. Optional token stakes apply once to the entire series, paying the final winner or refunding a draw/abort. No character currency transactions or Divine Hand support for this board game.

The rules were checked against kinder and BrettspielNetz; the text and SVG presentation are original. Custom boards, series, NPCs and game tokens are TavernGames additions. The new guide is initially German only, pending English review. The six previously approved English guides remain available.

Also included: a GM choice between lobby and playing-field Kniffel/Extreme score sheets, stable polling, removal of completed-turn dice and eye-sum overlays; your own Seventeen and Four card total above your hand, with opponents’ cards still private; shorter Dragon’s Hoard NPC waits while preserving the result-display/animation lock; and centered Old Maid opponent cards plus a tighter, upper-aligned public pair display with responsive sizing and scrolling.


Prüfungen mit Foundry-/DSN-Doubles ersetzen keinen Live-Mehrspielertest. / Checks using Foundry/DSN doubles do not replace live multiplayer testing.
