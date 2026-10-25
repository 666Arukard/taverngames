import {language} from './i18n.mjs';
// Complete bilingual guides individually approved by Daniel, 25 October 2026.
const GUIDES={
 "oldmaid": {
  "de": [
   [
    "Schwarzer Peter",
    "Die Spielleitung wählt vor Spielbeginn ein Kartendeck und bestimmt eine einzelne Karte als Schwarzen Peter. Alle anderen teilnehmenden Karten werden zu Paaren aus jeweils genau zwei Karten zugeordnet. Karten können von der Teilnahme ausgeschlossen werden.",
    "Standardmäßig bilden Karten mit gleichem Wert folgende Paare: Herz beziehungsweise Bierkrug mit Karo beziehungsweise Münze; Kreuz beziehungsweise Schwert mit Pik beziehungsweise Schild. Die Spielleitung kann diese Paarungen an das verwendete Kartenset anpassen. Der Schwarze Peter bleibt ohne Partnerkarte."
   ],
   [
    "Spielablauf",
    "Alle ausgewählten Karten werden gemischt und möglichst gleichmäßig verteilt. Vollständige Paare auf der Hand werden automatisch offen abgelegt – auch direkt nach dem Austeilen. Abgelegte Paare bleiben für alle sichtbar.",
    "Wer am Zug ist, zieht eine verdeckte Karte beim vorherigen noch aktiven Teilnehmer. Entsteht dadurch ein neues Paar, wird es automatisch abgelegt. Danach ist der nächste Teilnehmer an der Reihe. Teilnehmer ohne Handkarten werden übersprungen.",
    "Eigene Handkarten sind nur für ihren Besitzer sichtbar. Die Spielleitung kann außerdem die Hände der NPCs sehen, die sie manuell steuert."
   ],
   [
    "Rundenende",
    "Standardmäßig endet die Runde, sobald der erste Teilnehmer keine Karten mehr hat. Dieser Teilnehmer gewinnt. Wer zu diesem Zeitpunkt den Schwarzen Peter besitzt, verliert.",
    "Optional kann weitergespielt werden, bis nur noch eine Person den Schwarzen Peter auf der Hand hat. Diese Person verliert; alle anderen gewinnen gemeinsam."
   ],
   [
    "Spieltoken",
    "Optional zahlen alle Teilnehmer vor Spielbeginn denselben Spieltoken-Einsatz. Der Gewinner erhält den gesamten Topf. Bei mehreren Gewinnern wird der Topf gleichmäßig unter ihnen aufgeteilt. Bei einem Spielabbruch werden die Einsätze zurückgegeben.",
    "Die Spieltoken werden ausschließlich innerhalb von TavernGames verwaltet. Geldbestände auf Charakterbögen werden nicht verändert."
   ],
   [
    "Quelle",
    "ASS Altenburger – Schwarzer Peter: https://www.spielkarten.com/spielregeln/schwarzer-peter/ . Die freie Deck- und Paarwahl, die Fortsetzungsvariante und die Spieltoken-Regeln sind TavernGames-Ergänzungen."
   ]
  ],
  "en": [
   [
    "Old Maid",
    "Before play begins, the GM selects a card deck and designates one card as the Old Maid. All other included cards are assigned to pairs of exactly two cards each. Cards may also be excluded from the game.",
    "By default, cards of the same rank form the following pairs: Hearts or Tankards pair with Diamonds or Coins; Clubs or Swords pair with Spades or Shields. The GM may adjust these pairings to suit the selected deck. The Old Maid has no matching partner."
   ],
   [
    "How to Play",
    "All selected cards are shuffled and dealt as evenly as possible. Complete pairs in a player’s hand are automatically discarded face up, including immediately after the deal. Discarded pairs remain visible to everyone.",
    "On your turn, draw one face-down card from the previous participant who still has cards. If this creates a new pair, it is automatically discarded. Play then passes to the next participant. Participants with empty hands are skipped.",
    "Players can only see their own hand cards. The GM can also see the hands of NPCs they control manually."
   ],
   [
    "Ending the Round",
    "By default, the round ends as soon as the first participant has no cards left. That participant wins. Whoever holds the Old Maid at that moment loses.",
    "An optional rule allows play to continue until only one participant has a card left: the Old Maid. That participant loses, and everyone else shares the win."
   ],
   [
    "Game Tokens",
    "Optionally, all participants contribute the same game-token stake before play begins. The winner receives the entire pot. If there are multiple winners, the pot is divided equally among them. If the game is aborted, all stakes are returned.",
    "Game tokens are managed entirely within TavernGames. Currency on character sheets is not changed."
   ],
   [
    "Source",
    "ASS Altenburger – Schwarzer Peter: https://www.spielkarten.com/spielregeln/schwarzer-peter/ . Custom deck selection, configurable pairs, the optional continued-play variant and the game-token rules are TavernGames additions."
   ]
  ]
 },
 "connectfour": {
  "de": [
   [
    "Vier gewinnt",
    "Zwei Teilnehmer spielen gegeneinander auf einem Brett mit sieben Spalten und sechs Reihen. Jeder verwendet eine eigene Steinfarbe."
   ],
   [
    "Spielablauf",
    "Die Spieler lassen abwechselnd einen Stein in eine beliebige noch nicht volle Spalte fallen. Der Stein landet immer auf dem untersten freien Feld dieser Spalte. Bereits gelegte Steine können nicht verschoben oder entfernt werden.",
    "Wer zuerst vier eigene Steine waagerecht, senkrecht oder diagonal verbindet, gewinnt die Runde. Die Gewinnreihe wird hervorgehoben und die Runde endet sofort.",
    "Beispiel: Liegen drei deiner Steine nebeneinander in der untersten Reihe und das angrenzende Feld ist frei, kannst du mit einem Stein in der passenden Spalte die Viererreihe vervollständigen.",
    "Ist das gesamte Brett belegt, ohne dass eine Viererreihe entstanden ist, endet die Runde unentschieden."
   ],
   [
    "Serien",
    "Die Spielleitung kann eine einzelne Runde oder eine Serie mit 1 bis 100 Runden festlegen. Den ersten Startspieler kann sie auswählen oder auslosen. In den folgenden Runden wechseln sich die Startspieler ab.",
    "Jeder Rundensieg zählt einen Punkt. Für ein Unentschieden erhält niemand einen Punkt. Wer am Ende die meisten Punkte hat, gewinnt die Serie. Bei gleicher Punktzahl endet die Serie unentschieden."
   ],
   [
    "NPCs",
    "Es können zwei echte Spieler, ein Spieler gegen einen NPC oder zwei NPCs gegeneinander antreten.",
    "Die Spielleitung kann für jeden NPC Leicht, Normal oder Schwer auswählen. Neue NPCs starten auf Normal. Alternativ kann die Spielleitung einen NPC manuell steuern."
   ],
   [
    "Spieltoken",
    "Optional zahlen beide Teilnehmer denselben Spieltoken-Einsatz einmal für die gesamte Serie. Der Seriensieger erhält den gesamten Topf. Bei unentschiedener Serie oder einem Spielabbruch erhalten beide ihren Einsatz zurück.",
    "Es werden ausschließlich interne TavernGames-Spieltoken verwendet. Geldbestände auf Charakterbögen bleiben unverändert."
   ],
   [
    "Regelgrundlage",
    "Klassisches Vier-in-einer-Reihe auf einem 7×6-Brett. Serien und Spieltoken-Regeln sind TavernGames-Ergänzungen."
   ]
  ],
  "en": [
   [
    "Four in a Row",
    "Two participants compete on a board with seven columns and six rows. Each uses a different counter colour."
   ],
   [
    "How to Play",
    "Players take turns dropping one counter into any column that is not full. The counter always lands in the lowest available space in that column. Counters already placed cannot be moved or removed.",
    "The first player to connect four of their own counters horizontally, vertically or diagonally wins the round. The winning line is highlighted, and the round ends immediately.",
    "Example: If three of your counters lie next to each other along the bottom row and the adjacent space is empty, dropping a counter into the correct column completes your line of four.",
    "If the entire board fills up without a line of four, the round ends in a draw."
   ],
   [
    "Series",
    "The GM may select a single round or a series of 1 to 100 rounds. They can choose the first starting player or determine one randomly. The starting player alternates in subsequent rounds.",
    "Each round win earns one point. A drawn round awards no points. The participant with the most points at the end wins the series. Equal scores result in a drawn series."
   ],
   [
    "NPCs",
    "Two human players, a human player and an NPC, or two NPCs can compete.",
    "The GM can set each NPC’s difficulty to Easy, Normal or Hard. New NPCs default to Normal. Alternatively, the GM can control an NPC manually."
   ],
   [
    "Game Tokens",
    "Optionally, both participants contribute the same game-token stake once for the entire series. The series winner receives the entire pot. If the series ends in a draw or the game is aborted, both participants receive their stakes back.",
    "Only internal TavernGames game tokens are used. Currency on character sheets remains unchanged."
   ],
   [
    "Rules basis",
    "Classic four-in-a-row on a 7×6 board. Series and game-token rules are TavernGames additions."
   ]
  ]
 },
 "tictournament": {
  "de": [
   [
    "Tic-Tac-Toe-Turnier",
    "In diesem K.-o.-Turnier treten 2 bis 16 Teilnehmer gegeneinander an. Echte Spieler und NPCs können gemeinsam teilnehmen. Die Spielleitung muss nicht selbst mitspielen.",
    "Vor dem Start wählt die Spielleitung die Tic-Tac-Toe-Variante aus. Alle Begegnungen verwenden dieselben Regeln. Auch Extreme ist möglich. Die Regeln der jeweiligen Variante stehen in der Tic-Tac-Toe-Anleitung."
   ],
   [
    "Auslosung und Begegnungen",
    "Die Begegnungen werden beim Turnierstart zufällig ausgelost. Geht die Teilnehmerzahl nicht passend auf, erhalten einige Teilnehmer ein Freilos und kommen ohne Begegnung weiter.",
    "Wer eine Begegnung gewinnt, erreicht die nächste Turnierstufe. Der Verlierer scheidet aus. Die Spielleitung startet jeweils die nächste Begegnung. Der Turnierplan zeigt die Paarungen, Freilose und bisherigen Sieger.",
    "Wer die letzte Begegnung gewinnt, gewinnt das Turnier. Platzierungsspiele sind in dieser ersten Version nicht vorgesehen."
   ],
   [
    "Unentschieden",
    "Endet eine Begegnung unentschieden, wird sie wiederholt. Dabei wechselt der Startspieler.",
    "Nach dem dritten Unentschieden entscheidet die Spielleitung: Losentscheid bestimmt einen der beiden Teilnehmer zufällig zum Sieger der Begegnung. Bei Weiterspielen spielen die beiden eine weitere Runde mit gewechseltem Startspieler.",
    "Endet auch diese Runde unentschieden, erhält die Spielleitung dieselbe Auswahl erneut. Ohne Entscheidung wird nicht automatisch gelost."
   ],
   [
    "NPCs und Spieltoken",
    "Für jeden NPC kann die Spielleitung die Schwierigkeit Leicht, Normal oder Schwer einstellen. Neue NPCs starten auf Normal. Alternativ kann die Spielleitung einen NPC manuell steuern.",
    "Optional zahlen alle Teilnehmer denselben Spieltoken-Einsatz einmal für das gesamte Turnier. Zwischen den Begegnungen wird kein weiterer Einsatz verlangt. Der Turniersieger erhält den gesamten Topf. Bei einem Abbruch werden die Einsätze zurückgegeben.",
    "Es werden ausschließlich interne TavernGames-Spieltoken verwendet. Geldbestände auf Charakterbögen bleiben unverändert."
   ],
   [
    "Regelgrundlage",
    "Tic-Tac-Toe mit den gewählten Varianten. Das Turnierformat und die Spieltoken-Regeln sind TavernGames-Ergänzungen."
   ]
  ],
  "en": [
   [
    "Tic-Tac-Toe Tournament",
    "This knockout tournament supports 2 to 16 participants. Human players and NPCs can take part together. The GM does not need to participate.",
    "Before starting, the GM selects the Tic-Tac-Toe variant. Every match uses the same rules. Extreme is also available. See the Tic-Tac-Toe instructions for the rules of each variant."
   ],
   [
    "Draw and Matches",
    "Match pairings are randomly drawn when the tournament begins. If the number of participants does not fill the bracket, some participants receive a bye and advance without playing a match.",
    "The winner of each match advances to the next stage. The loser is eliminated. The GM starts each subsequent match. The tournament bracket shows pairings, byes and previous winners.",
    "The winner of the final match wins the tournament. Placement matches are not included in this first version."
   ],
   [
    "Drawn Games",
    "If a game ends in a draw, it is replayed with the other participant moving first.",
    "After the third drawn game in the same match, the GM chooses: Decide by lot randomly selects one of the two participants as the match winner. Play again starts another game, alternating the starting player.",
    "If that game also ends in a draw, the GM receives the same choice again. No random decision is made automatically while the GM has not chosen an option."
   ],
   [
    "NPCs and Game Tokens",
    "The GM can set each NPC’s difficulty to Easy, Normal or Hard. New NPCs default to Normal. Alternatively, the GM can control an NPC manually.",
    "Optionally, every participant contributes the same game-token stake once for the entire tournament. No additional stake is required between matches. The tournament winner receives the entire pot. If the tournament is aborted, all stakes are returned.",
    "Only internal TavernGames game tokens are used. Currency on character sheets remains unchanged."
   ],
   [
    "Rules basis",
    "Tic-Tac-Toe with the selected variants. The tournament format and game-token rules are TavernGames additions."
   ]
  ]
 },
 "aalstechen": {
  "de": [
   [
    "Aalstechen",
    "Jeder Teilnehmer beginnt mit fünf Würfeln: einem W4, W6, W8, W10 und W12. Ziel ist es, als letzter Teilnehmer noch mindestens einen Würfel zu besitzen. Die Augensumme spielt keine Rolle."
   ],
   [
    "Würfelrunden",
    "In jeder Würfelrunde würfelt jeder Teilnehmer alle seine verbliebenen Würfel einmal. Jeder Würfel, der eine 1 zeigt, scheidet dauerhaft aus.",
    "Die Teilnehmer dürfen gleichzeitig würfeln. Echte Spieler lösen ihren Wurf selbst aus. Alle können sehen, welche Würfel den anderen noch zur Verfügung stehen.",
    "Nach fünf Würfelrunden folgt eine Setzphase. Anschließend beginnt der nächste Block mit fünf Würfelrunden. Dieser Ablauf wiederholt sich bis zum Spielende."
   ],
   [
    "Spieltoken und Setzphasen",
    "Beim Spiel mit Einsatz legt die Spielleitung den gleichen Grundeinsatz und die verfügbaren Starttoken fest. Alle Teilnehmer kaufen sich zu Beginn ein.",
    "Nach jeweils fünf Würfelrunden können die verbliebenen Teilnehmer schieben, wenn noch kein zusätzlicher Einsatz gefordert wird; mitgehen, um einen geforderten Einsatz auszugleichen; erhöhen, um einen höheren Einsatz zu verlangen; aussteigen, wenn sie einen geforderten Einsatz nicht bezahlen möchten; oder all-in gehen, indem sie ihre verbleibenden verfügbaren Token einsetzen.",
    "Wer aussteigt, kann den Topf nicht mehr gewinnen. Bereits eingesetzte Token bleiben im Topf.",
    "Kann jemand einen höheren Einsatz nur teilweise mitgehen, ist diese Person all-in. Haupt- und Nebentöpfe werden getrennt geführt. Jeder kann nur die Topfanteile gewinnen, an denen er mit seinem Einsatz beteiligt ist.",
    "Ohne Spieltoken entfallen die Setzphasen."
   ],
   [
    "Spielende",
    "Wer alle Würfel verliert, scheidet aus. Bleibt nur ein Teilnehmer mit Würfeln übrig, gewinnt dieser das Spiel.",
    "Verlieren alle noch verbliebenen Teilnehmer in derselben Würfelrunde ihre letzten Würfel, teilen sie sich den Sieg. Beim Spiel mit Token werden die jeweiligen Töpfe unter den dafür berechtigten Gewinnern aufgeteilt.",
    "Die Spielleitung kann NPCs automatisch spielen lassen oder manuell steuern sowie das Spiel pausieren oder abbrechen. Bei einem Abbruch werden die gebundenen Einsätze zurückgegeben."
   ],
   [
    "Regelgrundlage",
    "Aalstechen nach der Awiana-Regelvorlage: https://awiana.fandom.com/de/wiki/Aalstechen?oldid=5758 . Die hier beschriebene Variante mit wiederkehrenden Setzphasen, All-in und Nebentöpfen ist die mit Daniel abgestimmte TavernGames-Variante."
   ]
  ],
  "en": [
   [
    "Aalstechen",
    "Each participant starts with five dice: one d4, d6, d8, d10 and d12. The aim is to be the last participant with at least one die remaining. The total of the dice does not matter."
   ],
   [
    "Dice Rounds",
    "During each dice round, every participant rolls all their remaining dice once. Any die showing a 1 is permanently removed from that participant’s pool.",
    "Participants may roll simultaneously. Human players trigger their own rolls. Everyone can see which dice the other participants still have.",
    "After five dice rounds, a betting phase takes place. Another block of five dice rounds then begins. This continues until the game ends."
   ],
   [
    "Game Tokens and Betting",
    "When playing for stakes, the GM sets an equal initial buy-in and the available starting tokens. Every participant pays the buy-in at the beginning.",
    "After every five dice rounds, the remaining participants may check if no additional contribution is required; call to match the required contribution; raise to increase the required contribution; fold if they do not want to match a required contribution; or go all-in by committing all their remaining available tokens.",
    "A participant who folds can no longer win the pot. Tokens already contributed remain in the pot.",
    "If a participant can only partially match a higher contribution, they are all-in. Main and side pots are tracked separately. Each participant can only win the pots to which their contribution makes them eligible.",
    "When playing without game tokens, betting phases are skipped."
   ],
   [
    "Ending the Game",
    "A participant who loses all their dice is eliminated. If only one participant has dice remaining, that participant wins.",
    "If all remaining participants lose their last dice during the same dice round, they share the win. When playing for tokens, each pot is divided among its eligible winners.",
    "The GM may let NPCs play automatically or control them manually, and may pause or abort the game. If the game is aborted, committed stakes are returned."
   ],
   [
    "Rules basis",
    "Aalstechen based on the Awiana rules reference: https://awiana.fandom.com/de/wiki/Aalstechen?oldid=5758 . The recurring betting phases, all-in rules and side pots form the TavernGames variant agreed with Daniel."
   ]
  ]
 }
};
export function reviewedGuide(scope){const sections=GUIDES[scope]?.[language()==='de'?'de':'en'];return sections?.map(([title,...paragraphs],i)=>`<${i?'h3':'h2'}>${title}</${i?'h3':'h2'}>`+paragraphs.map(p=>`<p>${p}</p>`).join('')).join('')??null;}
