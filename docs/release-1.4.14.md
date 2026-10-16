# Taverngames 1.4.14

Schweinchen: Der letzte 3D-Würfel bleibt bis zum nächsten Wurf oder Zugende liegen. Eine Eins bleibt bis Weiter sichtbar. Automatische NPCs warten nach Abschluss der Animationen fünf Sekunden.

Schocken-3D aus 1.4.13 durch Daniel getestet. Die 3D-Anbindung bleibt Beta.

- Ein einzelner liegender Schweinchen-Würfel; nur dieser wird beim nächsten Wurf ersetzt.
- Eine Eins bleibt für Menschen bis Weiter sichtbar. NPCs warten fünf Sekunden nach Animationsabschluss.
- Neue Würfe, Punkte sichern und Weiter sind während laufender Gegenanimationen gesperrt.
- Bereinigung bei Zugwechsel, Abbruch und deaktivierter 3D-Beta; bisherige Regeln und Historie bleiben erhalten.

Schweinchen nutzt den vorhandenen Persistent-Dice-Adapter: Der letzte Würfel bleibt bis zum nächsten Wurf oder Zugende liegen. Eine Eins wartet auf Weiter; automatische NPCs warten nach Animationsabschluss fünf Sekunden. Gegenanimationen und Ausfallsicherung bleiben berücksichtigt. Sichern, Weiter, Partiewechsel, Abbruch und Abschalten der 3D-Beta räumen eigene Stücke auf.

Regelengine, Wertung, Historie und Saveformat unverändert. Kein zweiter Zufallswurf, keine DSN-Sockets oder User-Flag-Änderungen. Ohne DSN bleibt das ursprüngliche Spiel verwendbar. Acht stabile Spiele; die neue Schweinchen-3D-Anbindung und Chō-Han bleiben Beta. Echte Schweinchen-3D-Abnahme steht aus.

Welt nach Installation neu laden. website.json enthält acht Blöcke und Eintragszahlen. Kompakte 3D-Bedienung und neutrale Chō-Han-Würfel mit optionaler SL-Einsicht bleiben Planung.

## English
Pig keeps its last 3D die until the next roll or turn end. A one remains until Continue; automatic NPCs wait five seconds after animation completion. Uses the existing persistent-dice adapter and multiplayer gates, with cleanup on banking, continuing or aborting. Rules, history and saves unchanged. The new 3D integration remains beta; live testing pending.
