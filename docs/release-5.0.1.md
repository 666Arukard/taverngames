# TavernGames 5.0.1

**Benötigt Foundry 14.369 oder neuer. Alle Clients nach Installation vollständig neu laden.**

17 und 4: NPC-Aktionen warten regulär 1,2 statt 5 Sekunden. Die gemeinsame NPC-Abfrage läuft alle 250 ms und verhindert aufgestaute Timer. Der schwebende Würfeln-Button greift nach Neuzeichnungen auf die aktuelle Ansicht zu. Einstiegsbuttons werden lokal verborgen, solange die jeweilige Lobby geöffnet ist, und beim Schließen wieder sichtbar; übrigen Buttons weicht die Würfelsteuerung aus.

Seventeen and Four: regular NPC actions wait 1.2 instead of 5 seconds. Shared NPC polling runs every 250 ms and prevents queued timer backlogs. The floating Roll button resolves the current control after redraws. Launch buttons hide locally while their game lobby is open and return on close; dice controls avoid remaining launch buttons.

- 17 und 4: kürzere NPC-Reaktionszeit; gezielte Ergebnispausezeiten anderer Spiele bleiben erhalten.
- NPC-Zeitprüfung über alle 19 Spiele plus Kniffel Extreme.
- Schwebender Würfeln-Button funktioniert auch nach erneutem Zeichnen der Ansicht.
- Lokale Einstiegsbuttons bei offener Lobby ausblenden, beim Schließen wiederherstellen.
- Mau-Mau stabil; Glückstag und Schwimmen bleiben Beta.

17 stabile Spiele; Glückstag und Schwimmen / Knack bleiben optionale Betas. Einsätze verwenden interne Spieltoken. Die neuen Darstellungen und Abläufe noch in einer echten Foundry-Mehrspielerwelt prüfen.
