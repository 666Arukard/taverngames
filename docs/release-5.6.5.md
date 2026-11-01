# TavernGames 5.6.5

## Deutsch

Neue Beta-Funktion für freie Spielnamen: dauerhafte Weltnamen in den Moduleinstellungen und temporäre Namen in der Moderation für eine Partie einschließlich ihrer Runden. Original- und Wunschnamen bleiben suchbar; die SL sieht den Originalnamen in Klammern. Neue Anzeigen, Anleitungsüberschriften und Chatmeldungen verwenden den gültigen Namen, bestehende Nachrichten bleiben unverändert. Die Namensfunktion hat einen eigenen standardmäßig ausgeschalteten Beta-Schalter. Schere, Stein, Papier kann ausgewogene Beziehungen automatisch erzeugen und manuell veränderte Verhältnisse anzeigen. Streichhölzer liegen in Fünferblöcken. Keine Stable-Hochstufungen und kein Schiffe versenken; beides bleibt für 6.0 vorgesehen.

### Umfang und Status

Unverändert 27 stabile Spiele und vier stabile Turniere, fünf Beta-Spiele: Dame, Schere/Stein/Papier, Streichholzspiel, Wettessen und Wetttrinken. Die Nutzerfreigaben sind notiert, ihr Stable-Übergang bleibt auf ausdrücklichen Wunsch bis 6.0 zurückgestellt. Schiffe versenken (10×10) ist nicht implementiert. Keine Hauptversion vorweggenommen; keine neue englische Anleitungsfreigabe.

### Namensfunktion aktivieren und verwenden

1. Moduleinstellungen → „Freie Spielnamen · Beta“ aktivieren (Standard aus, unabhängig von „Beta-Test“ für Spiele).
2. Ebenfalls in den Moduleinstellungen das Menü „Spielnamen bearbeiten“ öffnen. Namen für alle 36 Spiele/Turniere eintragen und „Spielnamen speichern“. Einzelner „Standard wiederherstellen“-Button speichert die Rücksetzung direkt; „Alle Standardnamen wiederherstellen“ setzt alle Weltnamen zurück.
3. Eine Lobby öffnen. In der Moderation „Name dieser Partie · Beta“ aufklappen, Namen eingeben und übernehmen. Leer beziehungsweise „Gespeicherten Namen verwenden“ entfernt nur die temporäre Überschreibung. Ein Spielstand muss vorhanden sein; nur die SL darf Namen setzen.

Rangfolge: temporärer Partiename → gespeicherter Weltname → sprachabhängiger Originalname. Maximal 80 druckbare Zeichen; Namen sind Text, kein HTML. Originalnamen/IDs/Regelmechaniken werden nicht geändert. Gespeicherte Namen gelten für diese Welt und für beide Oberflächensprachen; Originalnamen folgen weiter der eingestellten Sprache.

Die Suche akzeptiert weiterhin alle Originalnamen und zusätzlich gespeicherten/aktuellen Wunschname. Die SL-Übersicht zeigt „Wunschname (Originalname)“, Spieler sehen den gültigen Namen. Spieltitel in Fenstern/Reiteransicht und neuen Anleitungsüberschriften/Chatmeldungen werden angepasst. Anleitungstexte, Regelbegriffe und Quellenbezeichnungen bleiben erhalten; Titel werden über eine zentrale Platzhalterfunktion ersetzt. Geprüfte englische Anleitungen bleiben geprüft, gesperrte bleiben gesperrt.

Temporäre Namen gelten über Züge, Kartenhände, Halbzeiten und Serienrunden derselben Partie. Bei den kontinuierlichen kurzen Spielen bleibt er auch beim SL-Befehl „Nächste Runde“ erhalten; „Nächste Partie vorbereiten“/neue Lobby setzt ihn zurück. Ein ausgeschalteter Beta-Schalter ignoriert gespeicherte Namen und temporäre Überschreibungen, löscht diese aber nicht. Erneutes Einschalten stellt sie für weiterhin bestehende Partien wieder her. Alte Chatmeldungen werden nicht verändert. Persistente Aliase sind Welteinstellungen; temporäre Aliase werden mit dem vorhandenen verschlüsselten Spielstand gespeichert und empfängerbezogen projiziert. Kein zusätzlicher Zugriff auf geheime Karten/Würfel.

### Spieländerungen

RPS: „Beziehungen ausgewogen erzeugen“ in der separaten Beziehungstabelle ersetzt alle Beziehungen des Vorlagenentwurfs. Namen und Symbole bleiben erhalten. Ungerade Figurenanzahl: gleiche Siegzahl für alle; gerade: bestmögliche Differenz von eins. Manuell frei veränderbar; Übersicht je Figur mit Siegen, Niederlagen und Hinweisen auf starke/schwache Figuren. Vollständige, aber unausgewogene Sets dürfen gespeichert werden. Ungültige Namen/fehlende Beziehungen bleiben gesperrt. Laufende Spiele behalten unveränderte Regeln.

Streichholzspiel: Darstellung in Gruppen zu maximal fünf Hölzern, Restgruppe zuletzt. Bei 21 also 5 + 5 + 5 + 5 + 1. Entfernte Hölzer bleiben wie bisher gedimmt; Entnahmeregeln unverändert. Eigene HTML/CSS-Darstellung, keine neue Bilddatei.

Benötigt Foundry VTT ab 14.369. Nach dem Update alle Clients neu laden. Laut Entwicklerprüfung 753 automatisierte Tests und DE/EN-Browserprüfungen mit Foundry-Testdoubles bestanden, einschließlich aller 36 Panels und Zweiclient-Namensprüfungen. Keine neue echte Foundry-/DSN-Live-Abnahme; keine Charakter-Geldbuchungen.

## English

New beta feature for custom game names: persistent world names in module settings and temporary names in moderation for a session including its rounds. Original and custom names remain searchable; the GM sees the original in parentheses. New displays, instruction headings and chat messages use the effective name; existing messages remain unchanged. Naming has a separate beta switch, disabled by default. Rock, Paper, Scissors can generate balanced relationships and report imbalance after manual edits. Matchsticks are grouped in blocks of five. No stable promotions and no Battleship; both remain planned for 6.0.

Enable Custom game names · Beta separately in module settings. Saved names apply to this world; temporary moderation names override them for the session and its rounds. A new session resets the temporary name. The GM overview retains the original in parentheses and search accepts both original and custom names. Restore individual/all defaults in the settings menu. Names are plain text, limited to 80 printable characters. Stable game IDs, rules and source credits are preserved; only title placeholders change. Existing chat messages are never rewritten. Disabling the feature ignores aliases without deleting them.

The RPS generator retains figure names/symbols and regenerates complete relationships: odd counts allow identical wins, even counts differ by one. Manual edits and unbalanced complete sets remain allowed with warnings. Matchsticks use five-stick blocks and a final remainder group. All five existing beta games remain beta; Battleship and stable promotions wait for 6.0.

753 automated tests and DE/EN browser checks with Foundry/DSN doubles passed, including all 36 panels and two-client naming. No new live certification or English guide approval.

Name priority is temporary session name, saved world name, then the language-specific original. Saved aliases apply in both interface languages. Only the GM may set names; a session must exist for a temporary override. Clear it or choose Use saved name to remove only that override. Single-name reset buttons save immediately; the settings menu can also restore all original world names.

Session aliases persist across turns, hands, halves and series rounds, including Next round in continuous games; preparing a new session or opening a new lobby resets them. Re-enabling the Beta restores retained aliases for sessions that still exist. Temporary aliases use existing encrypted session storage and recipient projections, without exposing secret cards or dice. Rule terminology, source labels and guide review status remain unchanged.

The RPS generator replaces all relationships in the current draft. Odd figure counts give each figure the same number of wins; even counts minimize the difference to one. Per-figure wins/losses and strong/weak warnings update after edits. Invalid names and missing relationships still block saving. Active games keep their rules snapshot. Matchsticks remain dimmed when removed; 21 sticks appear as 5 + 5 + 5 + 5 + 1.

Unchanged: 27 stable games, four stable tournaments and five Beta games (36 entries). Previously noted approvals are held until the explicitly planned 6.0 transition; 10×10 Battleship is not implemented. No new dependencies, artwork or Actor currency transactions.

Requires Foundry VTT 14.369 or later. Reload all clients after updating.
