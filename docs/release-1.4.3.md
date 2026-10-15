# Taverngames 1.4.3

Korrektur der Dice-So-Nice-Beta anhand des Diagnoseberichts: Die Anbindung verwendet nun das aktuelle Foundry-Spielobjekt. Die echte Anzeige muss weiterhin im Praxistest bestätigt werden.

- Aktuelles Spielobjekt beim Animationsaufruf statt veralteter Referenz vom Laden.
- API-Prüfung und Diagnosetest fangen Ausnahmen ab und zeigen einen Fehlerstatus.
- Der 3D-Schalter benötigt keinen Welt-Neustart.
- Acht Spiele stabil; Chō-Han und die 3D-Anbindung bleiben Beta.

Nach Installation der neuen Modulskripte die Welt neu laden. Die Spracheinstellung benötigt weiterhin Neuladen. Acht stabile Spiele und die Chō-Han-Beta bleiben erhalten. Keine zusätzlichen Zufallswürfe oder DSN-Broadcasts privater Ergebnisse.

Der Nutzer hat die Korrektur vor Veröffentlichung erfolgreich getestet. Keine eigene Foundry-/DSN-Live-Abnahme durch Codex. Die 3D-Anbindung bleibt Beta. website.json enthält alle acht vereinbarten Blöcke.

## English
The DSN beta now resolves the current Foundry game object at animation time. API checks and diagnostics handle exceptions instead of getting stuck. No world reload is needed for the 3D toggle; reload the world after installing new scripts. Eight stable games unchanged; Cho-Han and the 3D integration remain beta.
