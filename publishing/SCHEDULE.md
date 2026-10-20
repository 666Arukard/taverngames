# Zeitgesteuerte Releases

Autorisierte Termine: 21.10.2026, 08:00 Europe/Berlin: 3.4.1; 12:00: 3.4.2.
Die Offsets sind +02:00 (06:00 bzw. 10:00 UTC). Kein Paket wird durch die Einrichtung hochgeladen.

Vor dem Termin den jeweiligen vollständigen Release als **Draft** hochladen: exakt passende ZIP,
module.json und website.json. Keine sofortige Veröffentlichung. Der Terminplan steht in
publishing/release-schedule.json. Keine anderen Versionen werden freigegeben.

GitHub prüft alle fünf Minuten; bei Auslastung sind Verzögerungen möglich. Termine laufen nach
zwei Stunden ab, damit ein später hochgeladener Entwurf nicht unbemerkt veröffentlicht wird.
Fehlender Entwurf bleibt unangetastet. Manuell gestartete Durchläufe sind standardmäßig Dry-run.
Keine neue Version bauen und keine Paketdateien oder Tags vorzeitig veröffentlichen.

Vor Freigabe: drei vollständige Assets, GitHub-SHA256, exakte Modulversion, ZIP-/Manifestgleichheit,
Foundry 14.369 und Website-Schema prüfen. Danach Draft veröffentlichen und Latest setzen.
GITHUB_TOKEN-Ereignisse starten den anderen Release-Workflow nicht: Foundry wird ausdrücklich
im selben Ablauf aufgerufen. Secret wird ausschließlich als Actions-Secret verwendet.

Release-Textmarker verhindern doppelte Veröffentlichungen. Ein vor dem Foundry-Aufruf dauerhaft
gesetzter Marker verhindert blindes Wiederholen bei unklarem Ergebnis. Bei Fehler GitHub-Actions
prüfen und den tatsächlichen Foundry-Stand feststellen; keine automatische Wiederholung eines
unklaren externen Schreibvorgangs. Kein neuer PAT als Repository-Secret erforderlich.
