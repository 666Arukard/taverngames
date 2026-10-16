# Taverngames 1.4.8

Die Dice-So-Nice-Beta lässt bei Farkle, Kniffel und Schiff alle ausgerollten Würfel während der Auswahl liegen. Auswahl ohne zusätzliche feste Wartezeit; die neue Darstellung benötigt einen Praxistest.

- Auswahl direkt nach abgeschlossenem Ausrollen, ohne feste Zwei-Sekunden-Pause.
- Halten und Zurücknehmen ersetzt keine 3D-Stücke; erst der nächste Wurf ersetzt die freien Würfel.
- Herausgelegte Stücke bleiben beim Weiterwürfeln liegen; Bereinigung am Zugende und bei Abbruch.
- Die lokale Auswahl wartet nicht auf langsamere Clients. Folgeaktionen bleiben bis zu deren Rückmeldung gesperrt.
- Chō-Han-Regelquellen in der Modulübersicht ergänzt: Daniels Sammlung, Dice-Play und NetExl.

Acht Spiele bleiben stabil; die 3D-Erweiterung und Chō-Han bleiben Beta. Alle ausgerollten Stücke bleiben bei der Auswahl sichtbar. Neue Würfe ersetzen nur freie Stücke; gehaltene Stücke behalten Position und Identität. Hot Dice geben alle sechs Würfel frei.

Bereits bestätigende Spieler können lokal auswählen, während langsamere Clients noch animieren. Neue Würfe und Zugabschluss bleiben bis zu den notwendigen Rückmeldungen beziehungsweise der 15-Sekunden-Ausfallsicherung gesperrt. Die feste Zwei-Sekunden-Auswahlpause entfällt; nur die Farkle-Fehlwurfanzeige bleibt kurz sichtbar.

189 automatisierte Tests im Build dokumentiert. DSN/Physik sind nachgebildet; der tatsächliche Übergang und die neue Darstellung benötigen weiterhin einen Live-Praxistest. Keine neue eigene Foundry-Abnahme. Nach Installation Welt neu laden.

website.json enthält alle acht Blöcke und die dynamischen Eintragszahlen für aktuelle Spiele, aktuelle Funktionen, geplante Spiele, geplante Funktionen und Regelquellen. Manifest-Link unverändert.

## English
Farkle, Kniffel and Ship keep all landed dice visible during selection, with no fixed extra selection delay. Selection/unselection preserves pieces; the next roll replaces only free dice. Locally acknowledged players may select while slower clients finish, but rerolls and turn completion remain guarded. Added Cho-Han attribution. Eight stable games; DSN and Cho-Han remain beta. Live renderer testing pending.
