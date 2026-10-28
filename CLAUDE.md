# Account Notify

Thunderbird MailExtension für Benachrichtigungen pro Konto und Ordner. Umsetzung nach `PLAN.md`, Phase für Phase.

## Stack

* Manifest V3, Thunderbird 128+
* Plain ES Modules, kein Bundler, kein TypeScript, keine Dependencies
* Options Page mit plain DOM und CSS, kein Framework

## API-Regeln

1. Namespace `messenger.*` verwenden, nicht `browser.*`.
2. Einzige Doku-Quelle: https://webextension-api.thunderbird.net/en/latest-mv3/. Nicht MDN, nicht Chrome-Doku, keine Firefox-Beispiele ungeprüft übernehmen.
3. Signaturen und Property-Namen vor der Verwendung gegen die MV3-Doku prüfen. MV2-Muster sind tabu: `folder.type` (stattdessen `folder.specialUse`, ein Array), `MailFolder` als Parameter (stattdessen `MailFolderId`, also `folder.id`), `browser_action` (stattdessen `action`).
4. Keine Experiment APIs, einzige Ausnahme ist `api/unreadBadge` für den App-Icon-Badge. Es bleibt ein dünner Hook, die Entscheidung trifft der Background. Wenn sonst etwas nur per Experiment geht, als Einschränkung dokumentieren statt es zu bauen.
5. Permissions minimal halten: `accountsRead`, `messagesRead`, `notifications`, `storage`. Neue Permission nur mit Begründung.

## Background

1. Der Background ist eine Event Page und wird entladen. Alle Listener synchron auf Top-Level registrieren, nie innerhalb von `async` Init-Funktionen oder nach einem `await`.
2. Kein globaler State. Alles, was einen Neustart des Backgrounds überleben muss, liegt in `messenger.storage.local`.
3. Config bei jedem Event frisch laden, nicht cachen.

## Code-Stil

1. Bezeichner, Kommentare und UI-Strings auf Englisch
2. `async`/`await`, keine Promise-Ketten
3. Kleine, reine Funktionen in `config.js` (insbesondere `shouldNotify`), Seiteneffekte nur in `background.js` und `options.js`
4. Fehler in Listenern mit `console.error` loggen und schlucken, damit ein Fehler den Listener nicht dauerhaft bricht
5. Keine `innerHTML` Zuweisungen mit Daten aus Nachrichten oder Kontonamen, nur `textContent`

## Nicht tun

1. Keine Build-Pipeline, kein `package.json`, kein Linter-Setup einführen
2. Keine Telemetrie, keine Netzwerkzugriffe
3. Keine Features außerhalb von `PLAN.md` ohne Rückfrage
