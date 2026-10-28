# Account Notify: Plan

Thunderbird MailExtension that replaces the native new mail notifications and filters them per account (optionally per folder).

## Scope

* Manifest V3, Thunderbird 142 or newer (the badge experiment needs the `MailNotificationService` singleton added in 142)
* No Experiment APIs except the badge filter (phase 8), no bundler, no dependencies
* Plain ES modules, plain DOM in the options page
* Local install only, not published on ATN

## Structure

```
Thunderbird-Better-Notifications/
  manifest.json
  background.js      Event listeners, filter logic, notifications
  config.js          Load/save/defaults (storage.local)
  options/
    options.html
    options.js       Account and folder toggles
    options.css
  icons/
    icon-48.png
    icon-96.png
  api/unreadBadge/
    schema.json
    implementation.js  Experiment: leave accounts out of the app icon badge
  CLAUDE.md
  PLAN.md
```

The manifest itself lives in `manifest.json`.

## Data model (storage.local)

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

Whether to notify is resolved in this order:

1. Folder override `accounts[accountId].folders[folder.path]`, if set
2. Account setting `accounts[accountId].enabled`, if set
3. `defaultEnabled`

`accounts[accountId].badge` decides separately whether the account counts toward the app icon badge (phase 8). Unset means it counts, as without the add-on.

## Phases

### 1. Scaffold

1. Create the directory structure and `manifest.json`
2. `config.js` with `loadConfig()`, `saveConfig(config)`, `shouldNotify(config, folder)` and defaults
3. Empty `background.js` that imports `config.js`
4. Load as a temporary add-on via "Debug Add-ons"

### 2. Core: event and filter

1. Register `messenger.messages.onNewMailReceived.addListener(handler, true)` synchronously at top level. The second parameter (`monitorAllFolders`, since TB 121) covers all folders instead of only the inboxes.
2. Handler signature: `(folder, messageList)`
3. Return early when `folder.specialUse` contains one of `junk`, `trash`, `drafts`, `sent`, `archives`, `templates`, `outbox`
4. Check `shouldNotify(config, folder)`
5. Collect all pages of the `messageList` (`messages.continueList(messageList.id)` while `id` is set)
6. Drop messages with `read === true` or `junk === true`

Sketch:

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

1. Below `collapseThreshold`: one notification per message, ID `msg:<message.id>`, title is the sender (display name extracted from `author`), text is the subject
2. From `collapseThreshold` on: one grouped notification, ID `folder:<folder.id>`, title is account name plus folder name, text is the count and the first subject lines
3. Get the account name via `messenger.accounts.get(folder.accountId)`
4. `messenger.notifications.create(id, { type: "basic", title, message, iconUrl })`

### 4. Click handling

1. `messenger.notifications.onClicked.addListener(handler)` at top level
2. ID with prefix `msg:`: `messenger.messageDisplay.open({ messageId, location: "tab", active: true })`
3. ID with prefix `folder:`: point the active mail tab at the folder via `messenger.mailTabs.update({ displayedFolderId })`
4. Then focus the window (`messenger.windows.update(windowId, { focused: true })`)
5. Close the notification via `messenger.notifications.clear(id)`

### 5. Options page

1. Render `messenger.accounts.list()`, hide Local Folders (`type === "local"`) because the event never fires there
2. One toggle per account for `enabled`
3. Collapsible folder list per account (`messenger.folders.getSubFolders`), a three-way state per folder: inherit, on, off
4. Global fields for `defaultEnabled` and `collapseThreshold`
5. Write every change straight to `storage.local`, no save button
6. Follow the light and dark theme via `prefers-color-scheme`

### 6. Optional

1. Quiet hours: a time window in the config, checked in the handler before `notify`
2. Custom sound per account via `new Audio(url).play()` in the background
3. Toolbar button (`action` API) as a global mute toggle with a badge
4. Export and import of the config as JSON in the options page

### 7. Packaging

1. Zip the contents of the directory (not the directory itself)
2. Rename to `account-notify.xpi`
3. Add-ons Manager > gear > Install Add-on From File. Thunderbird does not require a signature.

### 8. Badge filter (experiment)

A second checkbox "Badge" next to "Notify" per account. Accounts without the check no longer count toward the app icon badge. No WebExtension API covers this, hence the experiment `unreadBadge`:

1. The experiment observes the chrome topic `before-count-unread-for-folder`, which `MailNotificationService.confirmShouldCount` asks before every folder, and vetoes folders of excluded servers
2. `setExcludedAccounts(accountIds)` replaces the exclusion list and recounts the badge (`countUnread` per server, set `unreadCount`, `_notifyListeners`)
3. The background decides via `countsInBadge(config, accountId)` and sends the list on every start of the event page, on `storage.local.onChanged` and on `accounts.onCreated`
4. `onShutdown` removes the observer, recounts without the filter and invalidates the startup cache

## Manual prerequisite

Thunderbird's own alerts must be switched off globally, or every message notifies twice:

Settings > General > Email notifications, untick "Show an alert for new emails" and "Play the following sound file" (prefs `mail.biff.show_alert` and `mail.biff.play_sound`). A MailExtension cannot set prefs without an experiment.

## Known limitations

1. Local Folders do not fire `onNewMailReceived`. This affects POP accounts using the global inbox.
2. No action buttons (mark as read, delete) like the native notifications have, because the `notifications` API in Gecko does not support buttons.
3. `accountId` is local to the profile. After switching profiles or recreating an account, its config entry no longer applies.
4. The badge filter (phase 8) relies on Thunderbird internals (`MailNotificationService.sys.mjs`, marked deprecated there, with an `unreadCount` setter its comment reserves for tests) and can break with a Thunderbird update. Because of the experiment, Thunderbird asks for full access on install.
5. In the badge mode "Total new messages", the filter only applies to mail arriving after a change, because the new-message count cannot be reset from outside.
