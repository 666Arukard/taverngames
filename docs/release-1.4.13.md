# Taverngames 1.4.13

Schocken: Mitspieler sehen verdeckte 3D-Würfelwürfe ohne Augenzahlen mit dem normalen Dice-So-Nice-Ton. Herauslegen und Aufdecken zeigen die gespeicherten Werte an derselben Position ohne erneuten Wurf.

Die Schocken-Fensterkorrektur ist durch Daniel bestätigt. 3D und Chō-Han bleiben Beta.

- Mitspieler erhalten neutrale Wurfanimationen ohne geheime Zahlen; DSN übernimmt den Würfelsound nach eigenen Einstellungen.
- Herauslegen, Zurücknehmen, Aufdecken und Sechsendrehen ändern die ruhende Anzeige ohne zusätzliche Wurfanimation.
- Verdeckter dritter Wurf auch für den Würfelnden neutral; herausgelegte Würfel bleiben sichtbar.
- Keine Änderung an Regeln, Spielständen oder globalen DSN-Einstellungen.

Schocken zeigt geheime Würfel für nicht berechtigte Empfänger als neutrale 3D-Stücke ohne Augen mit dem normalen Dice-So-Nice-Sound. Herauslegen, Zurücknehmen, Sechsendrehen und Aufdecken aktualisieren die ruhenden Stücke an derselben Position ohne neuen Zufallswurf. Der verdeckte dritte Wurf bleibt auch für den Würfelnden neutral.

Die Empfängerprojektion enthält keine geheimen Werte für Mitspieler. Die neutrale Simulation verwendet ausschließlich konstante lokale Platzhalter und ein leeres Preset; keine DSN-Socket-Synchronisierung oder User-Flag-Änderungen. DSN-Soundeinstellungen bleiben maßgeblich. Ohne DSN ist die 2D-Oberfläche weiter verfügbar.

Acht stabile Spiele; die versionsabhängige 3D-Anbindung und Chō-Han bleiben Beta. Welt nach Installation neu laden. website.json enthält die acht vereinbarten Blöcke mit Eintragszahlen. Keine eigene Foundry-Live-Abnahme durch Codex.

## English
Schocken now shows neutral hidden 3D dice with normal DSN sound. Holding and revealing display stored values at the same resting position without a new throw. Hidden information is not sent to unauthorized recipients. Local constant placeholders and a blank preset are used without DSN synchronization. DSN and Cho-Han remain beta; reload the world after installing.
