# Taverngames 1.4.6

Farkle erweitert die Dice-So-Nice-Beta um liegende 3D-Würfel und abgestimmte Anzeigezeiten. Die neue persistente Darstellung benötigt noch einen Praxistest. Acht Spiele bleiben stabil; Chō-Han und 3D bleiben Beta.

- Herausgelegte Würfel bleiben als gesperrte 3D-Objekte auf der normalen Würfelfläche liegen.
- Nur übrige Würfel werden neu animiert; eigene Stücke werden beim Zugende oder Abbruch entfernt.
- Auswahl frühestens nach zwei Sekunden und nach Animationsende; Fehlwürfe bleiben anschließend kurz sichtbar.
- Serverseitige Mehrspielersperre mit Rückmeldungen und maximal 15 Sekunden Wartezeit.
- Chō-Han-Becheranzeige und verdeckte Daten aus 1.4.5 bleiben erhalten.

Acht Spiele bleiben stabil; die neue persistente 3D-Darstellung für Farkle und Chō-Han bleiben Beta. Die bisherige sichtbare Grundanimation wurde vom Nutzer bestätigt; die neue persistente Renderer-/Mehrspieler-Darstellung benötigt noch einen echten Praxistest. Automatisierte DSN-/Physiktests verwenden nachgebildete Schnittstellen.

Nach dem Update Welt neu laden. Die 3D-Anbindung ist separat in den Moduleinstellungen aktivierbar und benötigt Dice So Nice. Interne DSN-APIs wurden gegen 6.4.4 geprüft; andere Versionen benötigen erneute Prüfung. Alte Mesh-Orientierungen werden nicht aus Spielständen wiederhergestellt; das Farkle-Fenster bleibt maßgeblich.

website.json enthält alle acht vereinbarten Blöcke. Manifest-Link unverändert.

## English
Farkle keeps selected dice as locked 3D pieces on the regular DSN surface and rerolls only the remaining dice. Selection waits at least two seconds and for animation completion; failed hands remain briefly visible. Includes bounded multiplayer animation gating and cleanup without changing other persistent dice. Cho-Han cup changes retained. Eight stable games; DSN extension and Cho-Han remain beta. Live testing of the new persistent renderer is pending.
