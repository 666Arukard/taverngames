# Taverngames – Foundry Extension

**Version 1.3.4**. Alle sechs Spiele sind regulär verfügbar: Schocken, Farkle, Schweinchen, Schiff–Kapitän–Mannschaft, Kniffel und Straßenlotto. Kniffel wurde von Daniel am 14. Oktober 2026 für die stabile Version freigegeben.

## Installation und Einstieg

Die neue reguläre Updateadresse (nach Veröffentlichung auf GitHub) lautet:

`https://github.com/666Arukard/taverngames/releases/latest/download/module.json`

Alle sechs Spiele sind ohne Beta-Test-Schalter erreichbar. Der Beta-Schalter schaltet zusätzlich Lügenwürfel und Drachenhort frei. Modul-ID und vorhandene Spielstände bleiben erhalten. Die bisherige Serveradresse bleibt als Übergang für bestehende Installationen bestehen.

Englisch ist Standard; Deutsch kann in denselben Moduleinstellungen gewählt werden. Der Taverngames-Reiter ist nur für SL sichtbar. Start öffnet Spieltisch und separates Moderationsfenster; Anleitung kann der SL in den Chat posten. Spieler verwenden die unteren Spielbuttons, die der SL im jeweiligen Moderationsfenster freigibt, und klicken Beitreten. Die neuen unteren Buttons sind standardmäßig aus.

## Lügenwürfel und Drachenhort · Beta

In den Foundry-Moduleinstellungen **Taverngames: Beta-Test** aktivieren. Beide Spiele erscheinen zusätzlich im SL-Reiter; untere Spielerbuttons werden jeweils in der Moderation freigegeben. Abschalten der Beta verbirgt ihre Fenster/Launcher und stoppt deren NPC-Automatik, ohne gespeicherte Partien zu löschen.

Lügenwürfel: fünf geheime W6 je Person, Mindestgebote über alle Becher, Einsen als Joker, Anzweifeln kostet dem Verlierer einen Würfel. Genau erfüllte Gebote sind gültig. Der Verlierer beginnt die neue Runde, bei Ausscheiden der nächste Aktive. Letzter Teilnehmer mit Würfeln gewinnt. Spieler erhalten nur eigene Becher; SL sehen zusätzlich manuell übernommene NPC-Becher. NPCs verwenden keine fremden geheimen Würfel.

Drachenhort: neun Felder 3–11, zwei W6. Normale Felder kosten eine Münze oder zahlen ab bereits drei Münzen alles aus. Eine2 kostet neun, eine12 sammelt alles ein. Nicht bedienbare Zahlung: Rest frei verteilen, dann ausscheiden. Letzter Aktiver bekommt das Brett. Eintritt/Spielmünzen (Standard2 Gold/30 Münzen) oder virtuelle Zocker-Bestände, vorzeitiges SL-Ende mit gleichmäßiger Restverteilung nur an Aktive und anteiliger Gegenwert-Vorschau. Unteilbare Reste per geheimem Tipp, anschließendem SL-Wurf und Gleichstands-Wiederholung. Beide Modi bleiben rein intern: keine Charakter-Geldbestände lesen oder verändern. Eintritt und Auszahlungen sind nur virtuelle Vorschauen.

English: enable **Beta testing** for Liar’s Dice and Dragon’s Hoard. Both have separate saves, optional bottom launchers, named controllable NPCs and source-attributed instructions. Liar’s Dice keeps cups private and resolves exact bids correctly. Dragon’s Hoard supports virtual token/gambler modes, partial payments, elimination, early ending and remainder guesses. Neither beta game reads or changes character wallets. Existing six regular games remain available.

Rule source / Regelquelle: [TZawalich, tavern-games-current](https://github.com/TZawalich/tavern-games-current). Independent implementation; no upstream code, images or server bundled.

## Wetten auf den Spielausgang / Outcome bets

1. Zuerst eine Spiel-Lobby öffnen und Teilnehmer beitreten lassen.
2. SL öffnet **Wetten** in der Moderation. Dies öffnet die Annahme und sperrt den Spielstart.
3. SL wählt per Schaltfläche Teilnehmende, Zuschauer oder Alle; bei Schocken ist standardmäßig die Vorhersage des Verlierers gewählt, sonst die des Gewinners. Vor der ersten Wette kann der Markt gewechselt werden.
4. Spieler öffnen **Wetten** am Spieltisch und setzen internes Gold auf einen Teilnehmer. SL platziert NPC-Wetten und kann zusätzliche NPC-Wetter anlegen. Standard100 interne Gold je Wetter; SL können ihr eigenes/NPC-Testguthaben vor einer Wette festlegen. Keine Charakter-Goldbestände werden gelesen oder gebucht.
5. Erste Wette sperrt die Teilnehmerliste. Wetten können vor Annahmeschluss zurückgenommen werden. SL schließt die Wettannahme und startet danach das Spiel in der Moderation.
6. Nach Spielende wird der gesamte Topf gleichmäßig unter allen richtigen Wettern verteilt, unabhängig von deren Einsatzhöhe. Unteilbare Kupferreste gehen in Reihenfolge der Wettabgabe. Abbruch oder kein richtiger Tipp führt zur vollständigen Rückzahlung. Auswertung samt Tipps, Einsätzen und Auszahlungen steht im Chat. Abgerechnete Wetten werden nicht doppelt ausgezahlt.

English: open a lobby, join players, then the GM opens **Bets** in moderation. Betting blocks game start until the GM closes it. Participants, observers or everyone may be allowed. Players and GM-controlled NPCs bet internal gold (default100 per bettor). The first bet locks the roster. The entire pot is shared equally among correct bettors; abort/no correct prediction refunds stakes. Results are posted to chat. No real character transactions. Farkle next games now prepare a lobby before starting.

## Anzeigen in 1.3.2

Der Reiter scrollt wieder, auch bei kleinen Fenstern. Würfel-/Glückskategorien verwenden Symbole mit Tooltip statt Text. Drachenhort zeigt zwei Würfel; bei Resttipps werden Würfeltyp, Zahlenbereich und Abstände erklärt: W6 bis6 Berechtigten, W10 bis10, W20 darüber. Lügenwürfel zeigt das angezweifelte Gebot und zählt passende Augen und Joker getrennt. Sechs Zweien plus drei Einsen ergeben neun Treffer. Dice So Nice bleibt später vorgesehen: eigener Becher privat/persistent, beim Aufdecken für alle sichtbar.

## Katalog und Bedienung

Kategorie-Symbole, Namenssuche und Favoriten-Tag wirken gemeinsam. Spiele sind je Kategorie alphabetisch nach sichtbarem Namen sortiert. SL können bis zu fünf Favoriten über rechtsbündige Sterne markieren (golden/ grau). Die Markierungen werden lokal im jeweiligen Foundry-Client gespeichert. Auswahl zurücksetzen löscht nur Filter, keine Markierungen. Kniffel bewahrt beim Würfeln anderer die Scrollposition; erst der eigene Zugbeginn springt nach oben. Summen-/Bonuszeilen trennen die hellen Zahlen- und Sonderwurffelder.

## Spielgruppen / Game categories

**Würfelspiele / Dice games:** Schocken, Farkle, Schweinchen, Schiff–Kapitän–Mannschaft, Kniffel.

**Glücksspiele / Games of chance:** Straßenlotto.

Kniffel-NPCs behalten nun unterschiedliche Zahlen für Straßen und bevorzugen fertige Kombinationen gegenüber dem flexiblen Chance-Feld. Der Bonusfortschritt zeigt nur die Summe der Zahlenfelder Einsen bis Sechsen: 60 ergibt keinen Bonus, ab 63 werden 35 Punkte addiert. Die Berechnung bleibt unverändert.

## Kniffel

Kniffel ist regulär im SL-Reiter erreichbar. Der SL kann den unteren Kniffel-Button in der Moderation freigeben; Spieler treten darüber freiwillig bei. Kategorieauswahl und Suche oben im Reiter filtern gemeinsam nach deutschen oder englischen Spielnamen. Die sechs Spiele bleiben unabhängig vom Beta-Schalter verfügbar.

Normale Schmidt-Kniffel-Regeln für 2–8 Teilnehmer. Fünf W6, höchstens drei Würfe, Würfel behalten/zurücknehmen, 13 bewusst ausgewählte Wertungsfelder mit Vorschau und Nullbestätigung. Früher Eintrag ist möglich. Oben 35 Bonus ab 63; zusätzliche Kniffel nach belegtem 50er-Feld bringen 50 Zusatzpunkte und den Höchstwert eines freien Feldes. Ein gestrichenes Kniffelfeld verhindert die Sonderwertung. Gleichstände teilen Plätze. NPCs sind automatisch oder manuell steuerbar; Folgepartien übernehmen Teilnehmer und leeren den Bogen. Serien und Einsätze sind für später vorgemerkt. Keine 3D-Würfelintegration.

English: all six games including Kniffel are available normally. The GM enables the bottom Kniffel launcher in moderation. Category selection and name search can be combined; German and English names are recognized. The score sheet header has explicit contrasting colors for dark table themes. Tags, duration filters, Kniffel series and stakes remain deferred.

Regelquelle / Rule source: [Schmidt Spiele, Kniffel 49203](https://www.schmidtspiele.de/files/Produkte/4/49203%20-%20Kniffel%C2%AE/49203_Kniffel_DE.pdf). Kniffel ist eine Marke von Schmidt Spiele. Kniffel von Daniel für 1.3.0 freigegeben; keine eigene Foundry-Live-Abnahme durch Codex behauptet.

## Neue Spiele

### Schweinchen

Ein W6, beliebig viele Würfe pro Zug. 2–6 erhöhen die ungesicherten Zugpunkte. Sichern beendet den Zug und addiert diese zum Gesamtstand. Eine 1 löscht die ungesicherten Zugpunkte; frühere Gesamtpunkte bleiben erhalten. Die 1 und der Punkteverlust bleiben sichtbar, bis der Spieler oder SL auf **Weiter** klickt. Automatische NPCs schalten nach mindestens fünf Sekunden selbst weiter. Pause und manuelle NPC-Steuerung stoppen die Automatik. Ein Klick auf einen Namen in der Spielerliste zeigt dessen letzte 20 gespeicherte Würfe dieser Partie; ältere Spielstände enthalten keine rückwirkende Historie. Bis zur Bestätigung sind weitere Würfe und Punktesicherung gesperrt. Standardziel 100, vom SL einstellbar. Sobald jemand das Ziel durch Sichern erreicht, haben alle anderen genau einen letzten Zug. Der höchste Gesamtstand gewinnt; Gleichstände teilen den Platz. Mindestens zwei Teilnehmer, NPCs zählen mit.

Der SL setzt Grundeinsatz und Währung vor Spielbeginn. Ab drei Personen: Platz 2 bekommt den Einsatz zurück, Platz 3 die Hälfte, Platz 1 den Rest. Zu zweit bekommt der Sieger den Topf. Gleiche Platzierungen erhalten ihre nominale Platzprämie jeweils vollständig; verwendet wird die Platzfolge 1/2/2/4. Bei **Tavernenbank** übernimmt die Bank nötige Zusatzprämien beziehungsweise einen Restbetrag. Bei **Gewinn neu aufteilen** bleibt der Gesamtbetrag im Topf: zuerst die Prämien unterhalb der Spitze, dann der verbleibende Betrag an die Erstplatzierten. Bei vier Spielern mit je 2 Gold und zwei Zweiten ergibt das 4/2/2/0. Bei geteilter Spitze erhalten alle den neu berechneten Anteil; unteilbare Kupferreste gehen in Beitrittsreihenfolge. Eine halbe Kupfermünze wird abgerundet, der Rest bleibt in der Erstplatzprämie. Die vollständige Vorschau erscheint vor jeder Buchung.

Regelvorlage: Daniel Brune, mit ausdrücklich beschriebenen Taverngames-Hausregeln.

### Schiff, Kapitän und Mannschaft

Fünf W6, höchstens drei Würfe pro Zug. Klicke selbst 6 als Schiff, dann 5 als Kapitän, dann 4 als Mannschaft an; mehrere Stufen dürfen im selben Wurf herausgelegt werden. Nur markierte Würfel bleiben beim nächsten Wurf liegen. Danach zählen die übrigen zwei Würfel als Ladung. Ohne vollständige Besatzung nach dem dritten Wurf zählt der Zug null. Verbleibende Würfe ersetzen beide Ladungswürfel gemeinsam, auch wenn das Ergebnis schlechter wird. Der dritte Wurf bleibt liegen: noch passende Besatzungswürfel markieren und **Zug abschließen** drücken, auch bei null Punkten. NPCs markieren automatisch und schließen fertige Züge nach mindestens fünf Sekunden ab, auch wenn sie bereits vor dem dritten Wurf gute Ladung behalten. Pause, Abbruch und manuelle Steuerung stoppen dies. Bereits in 1.1.1 gesicherte Würfel bleiben beim Fortsetzen gesichert.

Einzelspiel oder Serie mit 1–100 festen Runden beziehungsweise unbegrenzt vielen Runden. Serien addieren Ladungspunkte. Der Startspieler rotiert entgegen der Spielrichtung. Bei Gleichstand an der Spitze am Ende spielen nur die Führenden weitere vollständige Züge; diese entscheiden den Sieger und ändern nicht nachträglich den Serienpunktestand. **Nach dieser Runde abschließen** beendet eine unbegrenzte Serie regulär, sobald alle denselben Rundenumfang gespielt haben. Grundeinsatz einmal für die gesamte Serie; endgültiger Sieger erhält den Topf.

Regelquelle: [Bicycle Cards](https://bicyclecards.com/how-to-play/ship-captain-and-crew). Serien, Moderation und Einsatzverwaltung sind Taverngames-Ergänzungen.

### Straßenlotto

Der SL wählt Preis, Wert, Einsatz je Schein und Limits. Der SL legt **Zahlen je Tippschein** von 1–100 fest (Standard fünf). Jeder Schein enthält genau diese Anzahl unterschiedlicher Zahlen von 1–100; bereits verbindlich vergebene Zahlen sind für alle weiteren Scheine gesperrt. Maximal 20 Scheine, zusätzlich ein Personenlimit. NPCs geben automatisch einen Schein ab oder werden manuell vom SL gesteuert. Der SL schließt die Annahme und löst anschließend separat **W100 ziehen** im Moderationsfenster aus. Volle Loszahl und NPC-Aktionen lösen keinen automatischen Wurf aus. Die passende Zahl gewinnt den gesamten Gegenstand. Bei einer unverkauften Zahl behält der Händler Gegenstand und Einsätze.

Der Preis kann aus **Weltvorlagen** oder einem **Actor-Inventar** ausgewählt werden. Eine Weltvorlage wird als ein Stück ins Gewinnerinventar kopiert. Aus einem Actor-Inventar wird ein Stück entnommen; ein leerer Reststapel bleibt als Buchungsnachweis bestehen. Gefüllte Behälter müssen zuvor geleert werden. Gleiche Quelle und Gewinnerinventar: der Preis verbleibt dort. Bei fehlender Charakterzuordnung oder unterbrochener Übergabe unter Einsätze & Charaktere zuordnen und Preis übergeben / erneut versuchen. Wiederholschutz verhindert eine zweite Übergabe. Ohne bereits vorbereiteten Transfer kann der SL die Übergabe ausdrücklich selbst übernehmen; dies wird im Chat dokumentiert.

Ausgewählte Preise werden nach regulärer Ziehung automatisch übertragen, unabhängig vom Schalter für Währungsbuchungen. Rein beschriebene Preise werden manuell übergeben. Währungsabrechnung erfolgt anschließend auf SL-Befehl: Ticketpreise zum zugeordneten Händler, kein zusätzlicher Goldbonus für den Gegenstand.

Regelvorlage: Daniel Brune.

## Moderation und Spielende

Ausschließlich SL/Admin (Foundry-GM) darf Partien starten und administrativ beenden. Eigene Teilnahme ist dafür nicht erforderlich; **Spiel starten** steht direkt im Moderationsfenster zur Verfügung. Spieler dürfen weiterhin ihre eigenen Züge abschließen. Alle Spiele können über **Spiel beenden** im jeweiligen Moderationsfenster endgültig abgebrochen werden. Die aktive Runde endet für alle; weitere Aktionen und NPC-Automatik stoppen. Ein Abbruch erzeugt keine erfundenen Sieger und keine Einsatzbuchung. Ein reguläres Spielende wird im Chat bekanntgegeben. Pause, individuelle NPC-Steuerung, Folgepartien und Rückgängig sind vorhanden; verbindliche Lotterietipps und fertige Partien können nicht zurückgenommen werden.

Farkle bietet drei unabhängige optionale Hausregeln, alle standardmäßig aus: **Kleine Straße** aus fünf verschiedenen aufeinanderfolgenden Zahlen (1–5 oder 2–6) für 750 Punkte; **Einsen-Bonus** für drei/vier/fünf/sechs Einsen mit 1000/2000/3000/4000 Punkten; **Bei gesicherter Zielpunktzahl sofort beenden** im Zielmodus ohne Schlussrunde. Kombinationen entstehen weiterhin in einem Wurf. Der SL wählt die Regeln unter Neue Partie & Regeln vor dem Öffnen einer Lobby. Änderungen gelten für diese neue Partie; Folgepartien übernehmen den Regelsatz. Anzeige, Beste Auswahl und NPCs verwenden dieselbe Wertung.

Farkle: Beste Auswahl ist für normale Spieler standardmäßig gesperrt. Die Spielleitung behält die Hilfe auch ohne Häkchen; der Button erläutert diese Ausnahme als Hinweis. Erneut mit getrennten Clients geprüft.

## Verwaltetes Setzen und Charaktere

**Standardmäßig aus.** Moduleinstellung oder Häkchen unter Einsätze & Charaktere. D&D 5e/5.5e mit Standardwechselkursen: 1 Platin = 10 Gold, 1 Gold = 10 Silber = 100 Kupfer; 1 Elektrum = 5 Silber. Elektrum ist standardmäßig aus und bleibt dann vollständig unangetastet. Eigene Wechselkursmodule werden bei abweichenden Kursen gezielt abgelehnt.

1. Grundeinsatz und Währung in der neuen Partie wählen. Schocken/Farkle können den Einsatz im Abrechnungsfenster festlegen.
2. Alle Teilnehmer beitreten lassen und unter **Einsätze & Charaktere** eindeutige Actors zuordnen; voreingestellt ist der zugewiesene Spielercharakter. NPCs brauchen bei Buchungen ebenfalls einen Actor. Bank/Händler bei Bedarf auswählen.
3. **Zuordnung & Vorschau speichern**. Einsätze bleiben zunächst vorgemerkt; es wird vor Spielende kein Geld abgezogen oder reserviert.
4. Nach regulärem Ende die Vorschau prüfen: Einsätze, Bruttoauszahlungen, Nettobeträge und Bankanteil.
5. **Abrechnung buchen** bucht ausschließlich die Nettobeträge auf den Charakterbögen und dokumentiert alle Änderungen öffentlich im Chat. Vorhandene Münzen bleiben möglichst erhalten, nötiges Wechselgeld wird gebildet. Schocken/Farkle verwenden einen Gewinnertopf; die Bank-/Neuverteilungswahl ist dort eine zusätzliche Hausregel.

Bei unzureichendem Geld verhindert die Vorprüfung die Buchung. Bei Verbindungsfehlern während einer begonnenen Abrechnung **Offene Abrechnung fortsetzen** verwenden. Bestätigte Actor-Buchungen tragen Transaktionsnachweise und werden nicht wiederholt. Eine begonnene Abrechnung oder Preisübergabe ist vor einer neuen Partie abzuschließen. Einheiten werden intern als ganze Kupferwerte gerechnet. Der ursprüngliche GM-Browser enthält den Schlüssel für die verschlüsselten Spielstände und Buchungspläne. Bei einem anderen GM-Browser wird nicht mit einem leeren Buchungsstand weitergebucht.

## Veröffentlichungsdateien

`taverngames-1.2.0-server-upload.zip` entpacken und den Inhalt in den regulären Webordner `/fileadmin/DND/foundry/taverngames/` hochladen. Zuerst `releases/taverngames-1.2.0.zip` und CHANGELOG.html, zuletzt module.json. Das Modul-ZIP auf dem Server gepackt lassen. Anschließend Foundry-Modulaktualisierung. Bisherige Installationen aus dem alten `/beta/`-Kanal einmal über den regulären Manifest-Link installieren. Keine Dateien durch Codex ins Internet hochgeladen.

## English

**1.3.2** offers six regular games: Schocken, Farkle, Pig, Ship–Captain–Crew, Kniffel and Street lottery. No beta setting is required; toggling it does not hide or stop these games. Same module ID and regular update source. The GM-only tab has Start and Instructions for each game. Only the GM starts or aborts games, including without joining; moderation provides the start controls. Players join via bottom buttons enabled in moderation. All games support shared abort; unlimited Ship series can finish after the current round.

Pig follows Daniel's target-score rules (default 100), with one final turn each. A rolled 1 and lost turn points remain visible until the player or GM presses Continue; automatic NPCs continue after at least five seconds. Pause and manual control stop automation. Click a participant name to see their last 20 recorded rolls of the game. Ship supports single, fixed and unlimited rounds; cargo scores are added, final tie-breaks choose the winner. Players click 6, 5 and 4 in order to set them aside. The third roll stays visible until End turn, including for zero points; automatic NPCs end completed turns after at least five seconds, including earlier decisions to keep cargo. Lottery uses 1–100 globally unique numbers per ticket as configured by the GM (default five), up to 20 tickets and exactly one d100 draw explicitly triggered by the GM in moderation after acceptance closes. Selected world/inventory items are awarded once; missing assignments can be fixed and delivery retried.

Managed betting is **off by default** and applies only on the GM settlement command after a regular game ends. D&D 5e/5.5e standard coins are supported; electrum has its own off-by-default switch. Assign participant Actors and a bank/merchant, save the preview, then settle. Tied Pig ranks each receive the full nominal prize; the GM chooses bank funding or redistribution by reducing the first prize. The preview shows every stake, payout and net amount. Coin updates and item awards have durable receipts for recovery and are logged publicly. Aborted games charge nothing. Farkle's Best selection helper remains available to the GM while player access is disabled.

The three previously beta games are regular in 1.2.0 at Daniel's explicit request. Farkle adds three independent off-by-default house rules: five-die small straight for 750; three to six ones for 1000/2000/3000/4000; immediate target-mode end after banking the target. Existing saves retain standard rules. No new actual Foundry playtest by Codex is claimed. Upload the server package to the main folder, ZIP and changelog first, manifest last.

## Autoren und Regelquellen

1. Daniel Brune · Website https://dnd.brunecoaching.de · Discord arukard · E-Mail daniel@brunecoaching.de · KI-Unterstützung ChatGPT/Codex.
2. Philipp D. · Discord **theonlyzaodiac**.

Die danach im Manifest aufgeführten Namen sind als **Regelquellen/Referenzautoren** gekennzeichnet: Schockfreunde, PlayMonster, Schmidt Spiele, Awiana, Paul Cossmer/DnDDiary, Bicycle Cards, moses. Verlag, John McLeod/Pagat, TS Spielkarten und dessen genannte Wikipedia-Textquelle. Dies kennzeichnet die Herkunft der Regeln; technische Modulprogrammierung wird ihnen nicht zugeschrieben. Georg Haubner wird als Lektor der PDF-Vorlagen genannt; keine unbestätigte Website ergänzt. Die weiteren Awiana-/PDF-Spiele sowie Die böse Dreizehn, Klippklapp, Blackjack/17+4 und Schwimmen sind ausschließlich gespeicherte Regelreferenzen.

## Prüfung

136 automatisierte Tests, Syntaxprüfung und elf synthetische Browserprüfungen einschließlich Deutsch/Englisch und getrennter GM-/Spieler-Clients. Details in docs/validation.md; Release in docs/release-1.3.2.md. Foundry 14.369 bleibt auf Grundlage des Nutzer-Praxistests für das Basismodul verified. Freigabe der drei bisherigen Beta-Spiele durch Daniels ausdrücklichen Auftrag. Keine neue eigene Live-Abnahme behauptet. Historische Pakete bleiben unverändert.

Entwicklung: `node --test module/tests/*.test.mjs`, `node tools/check.mjs`, `node tools/browser-smoke.mjs`, `node tools/farkle-browser-smoke.mjs`, `node tools/farkle-multiplayer-smoke.mjs`, `node tools/tavern-browser-smoke.mjs`, `node tools/tavern-multiplayer-smoke.mjs`, `node tools/version-1.2-browser-smoke.mjs`. Browserprüfungen benötigen Playwright/Chrome. `tools/build-release.ps1` erzeugt konsistente Pakete.


## Version 1.3.4

Schweinchen bietet in der SL-Moderation unter Neue Partie & Regeln die standardmäßig ausgeschaltete Option „Bei gesicherter Zielpunktzahl sofort beenden“. Sie gilt ab der neu vorbereiteten Lobby und bleibt bei Folgepartien erhalten. Ohne diese Option wird die Schlussrunde gespielt; alte Spielstände bleiben unverändert. Die Spieleüberschriften sind etwas kleiner, zwischen den Einträgen liegt mehr Abstand.

Pig offers an optional immediate finish when the target is banked (GM moderation, New game & rules). Off by default, preserved for follow-up games. Existing saves retain the final round. Catalog headings are slightly smaller, with more space between games.
