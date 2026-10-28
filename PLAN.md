# Account Notify: Plan

Thunderbird MailExtension, die die nativen Benachrichtigungen ersetzt und pro Konto (optional pro Ordner) filtert.

## Rahmen

* Manifest V3, Thunderbird 128 oder neuer
* Keine Experiment APIs außer dem Badge-Filter (Phase 8), kein Bundler, keine Dependencies
* Plain ES Modules, plain DOM in der Options Page
* Nur lokale Installation, keine Veröffentlichung auf ATN

## Struktur

```
tb-account-notify/
  manifest.json
  background.js      Event-Listener, Filterlogik, Notifications
  config.js          Laden/Speichern/Defaults (storage.local)
  options/
    options.html
    options.js       Konto- und Ordner-Toggles
    options.css
  icons/
    icon-48.png
    icon-96.png
  api/unreadBadge/
    schema.json
    implementation.js  Experiment: Konten aus dem App-Icon-Badge nehmen
  CLAUDE.md
  PLAN.md
```

## manifest.json

```json
{
  "manifest_version": 3,
  "name": "Account Notify",
  "version": "0.1.0",
  "description": "New mail notifications per account and folder.",
  "browser_specific_settings": {
    "gecko": {
      "id": "account-notify@heilemann.local",
      "strict_min_version": "128.0"
    }
  },
  "icons": { "48": "icons/icon-48.png", "96": "icons/icon-96.png" },
  "permissions": ["accountsRead", "messagesRead", "notifications", "storage"],
  "background": { "scripts": ["background.js"], "type": "module" },
  "options_ui": { "page": "options/options.html" }
}
```

`strict_min_version` an die tatsächlich genutzte Thunderbird-Version anpassen.

## Datenmodell (storage.local)

```json
{
  "defaultEnabled": true,
  "collapseThreshold": 3,
  "accounts": {
    "account1": {
      "enabled": false,
      "badge": false,
      "folders": {
        "/INBOX/Lists": false
      }
    }
  }
}
```

Auflösung der Entscheidung, ob benachrichtigt wird, in dieser Reihenfolge:

1. Ordner-Override `accounts[accountId].folders[folder.path]`, falls gesetzt
2. Konto-Einstellung `accounts[accountId].enabled`, falls gesetzt
3. `defaultEnabled`

`accounts[accountId].badge` steuert unabhängig davon, ob das Konto im App-Icon-Badge zählt (Phase 8). Nicht gesetzt heißt: zählt mit, wie ohne Add-on.

## Phasen

### 1. Scaffold

1. Verzeichnisstruktur und `manifest.json` anlegen
2. `config.js` mit `loadConfig()`, `saveConfig(config)`, `shouldNotify(config, folder)` und Defaults
3. Leeres `background.js`, das `config.js` importiert
4. Als temporäres Add-on über "Debug Add-ons" laden

### 2. Kern: Event und Filter

1. `messenger.messages.onNewMailReceived.addListener(handler, true)` synchron auf Top-Level registrieren. Der zweite Parameter (`monitorAllFolders`, seit TB 121) aktiviert alle Ordner statt nur der Inboxen.
2. Handler-Signatur: `(folder, messageList)`
3. Früh abbrechen, wenn `folder.specialUse` eines von `junk`, `trash`, `drafts`, `sent`, `archives`, `templates`, `outbox` enthält
4. `shouldNotify(config, folder)` prüfen
5. Alle Seiten der `messageList` einsammeln (`messages.continueList(messageList.id)`, solange `id` gesetzt ist)
6. Nachrichten mit `read === true` oder `junk === true` verwerfen

Skizze:

```js
import { loadConfig, shouldNotify } from "./config.js";

const IGNORED = new Set(["junk", "trash", "drafts", "sent", "archives", "templates", "outbox"]);

messenger.messages.onNewMailReceived.addListener(async (folder, list) => {
  if ((folder.specialUse ?? []).some((use) => IGNORED.has(use))) return;

  const config = await loadConfig();
  if (!shouldNotify(config, folder)) return;

  const messages = [...list.messages];
  let page = list;
  while (page.id) {
    page = await messenger.messages.continueList(page.id);
    messages.push(...page.messages);
  }

  const fresh = messages.filter((m) => !m.read && !m.junk);
  if (fresh.length === 0) return;

  await notify(config, folder, fresh);
}, true);
```

### 3. Notifications

1. Unterhalb von `collapseThreshold`: eine Benachrichtigung pro Nachricht, ID `msg:<message.id>`, Titel ist der Absender (Anzeigename aus `author` extrahieren), Text ist der Betreff
2. Ab `collapseThreshold`: eine Sammelbenachrichtigung, ID `folder:<folder.id>`, Titel ist Kontoname plus Ordnername, Text ist die Anzahl und die ersten Betreffzeilen
3. Kontoname über `messenger.accounts.get(folder.accountId)` holen
4. `messenger.notifications.create(id, { type: "basic", title, message, iconUrl })`

### 4. Klick-Handling

1. `messenger.notifications.onClicked.addListener(handler)` auf Top-Level
2. ID mit Präfix `msg:`: `messenger.messageDisplay.open({ messageId, location: "tab", active: true })`
3. ID mit Präfix `folder:`: aktiven Mail-Tab per `messenger.mailTabs.update({ displayedFolderId })` auf den Ordner setzen
4. Danach das Fenster fokussieren (`messenger.windows.update(windowId, { focused: true })`)
5. Benachrichtigung per `messenger.notifications.clear(id)` schließen

### 5. Options Page

1. `messenger.accounts.list()` rendern, lokale Ordner (`type === "local"`) ausblenden, da das Event dort nicht feuert
2. Pro Konto ein Toggle für `enabled`
3. Aufklappbare Ordnerliste pro Konto (`messenger.folders.getSubFolders`), pro Ordner ein Dreifach-Zustand: erben, an, aus
4. Globales Feld für `defaultEnabled` und `collapseThreshold`
5. Jede Änderung direkt in `storage.local` schreiben, kein Speichern-Button
6. Farben über `prefers-color-scheme` an helles und dunkles Theme anpassen

### 6. Optional

1. Ruhezeiten: Zeitfenster in der Config, im Handler vor `notify` prüfen
2. Eigener Sound pro Konto über `new Audio(url).play()` im Background
3. Toolbar-Button (`action` API) als globaler Mute-Toggle mit Badge
4. Export und Import der Config als JSON in der Options Page

### 7. Packaging

1. Inhalt des Verzeichnisses (nicht das Verzeichnis selbst) zippen
2. In `account-notify.xpi` umbenennen
3. Add-on-Manager > Zahnrad > Add-on aus Datei installieren. Thunderbird verlangt keine Signatur.

### 8. Badge-Filter (Experiment)

Pro Konto eine zweite Checkbox "Badge" neben "Notify". Konten ohne Haken zählen nicht mehr im App-Icon-Badge. Dafür gibt es keine WebExtension API, deshalb ein Experiment `unreadBadge`:

1. Das Experiment hängt sich an den Chrome-Observer `before-count-unread-for-folder`, den `MailNotificationService.confirmShouldCount` vor jedem Ordner fragt, und lehnt Ordner ausgeschlossener Server ab
2. `setExcludedAccounts(accountIds)` ersetzt die Ausschlussliste und zählt den Badge neu (`countUnread` pro Server, `unreadCount` setzen, `_notifyListeners`)
3. Der Background entscheidet über `countsInBadge(config, accountId)` und schickt die Liste bei jedem Start der Event Page, bei `storage.local.onChanged` und bei `accounts.onCreated`
4. `onShutdown` meldet den Observer ab, zählt ohne Filter neu und invalidiert den Startup-Cache

## Manuelle Voraussetzung

Die nativen Alerts müssen global abgeschaltet werden, sonst kommt jede Benachrichtigung doppelt:

Einstellungen > Allgemein > E-Mail-Benachrichtigung, "Benachrichtigung bei neuen E-Mails anzeigen" und "Folgende Audiodatei abspielen" deaktivieren (Prefs `mail.biff.show_alert` und `mail.biff.play_sound`). Eine MailExtension kann ohne Experiment keine Prefs setzen.

## Bekannte Einschränkungen

1. Lokale Ordner lösen `onNewMailReceived` nicht aus. Betrifft POP-Konten mit globalem Posteingang.
2. Keine Aktionsbuttons (als gelesen markieren, löschen) wie bei den nativen Benachrichtigungen, da die `notifications` API in Gecko keine Buttons unterstützt.
3. `accountId` ist profil-lokal. Nach Profilwechsel oder Neuanlage eines Kontos ist der jeweilige Config-Eintrag hinfällig.
4. Der Badge-Filter (Phase 8) nutzt Thunderbird-Interna (`MailNotificationService.sys.mjs`, dort als deprecated markiert, `unreadCount`-Setter laut Kommentar nur für Tests) und kann mit einem Thunderbird-Update brechen. Wegen des Experiments fragt Thunderbird bei der Installation nach vollem Zugriff.
5. Im Badge-Modus "Gesamtzahl neuer Nachrichten" wirkt der Filter erst für Mail, die nach einer Änderung eintrifft, weil sich der Zähler neuer Nachrichten von außen nicht zurücksetzen lässt.
