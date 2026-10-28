# Better Notifications

Thunderbird MailExtension for notifications and the app icon badge per account and folder. `README.md` covers features, setup and known limitations.

## Stack

* Manifest V3, Thunderbird 142+
* Plain ES modules, no bundler, no TypeScript, no dependencies
* Options page with plain DOM and CSS, no framework

## API rules

1. Use the `messenger.*` namespace, not `browser.*`.
2. Only documentation source: https://webextension-api.thunderbird.net/en/latest-mv3/. Not MDN, not the Chrome docs, no Firefox examples taken over unchecked.
3. Check signatures and property names against the MV3 docs before using them. MV2 patterns are off limits: `folder.type` (use `folder.specialUse`, an array), `MailFolder` as a parameter (use `MailFolderId`, i.e. `folder.id`), `browser_action` (use `action`).
4. No Experiment APIs; the only exception is `api/unreadBadge` for the app icon badge. It stays a thin hook, the background makes the decisions. Anything else that only works via an experiment gets documented as a limitation instead of built.
5. Keep permissions minimal: `accountsRead`, `messagesRead`, `notifications`, `storage`. A new permission only with a stated reason.

## Background

1. The background is an event page and gets unloaded. Register all listeners synchronously at top level, never inside `async` init functions or after an `await`.
2. No global state. Everything that has to survive a background restart lives in `messenger.storage.local`.
3. Load the config fresh on every event, do not cache it.

## Code style

1. Identifiers, comments and UI strings in English
2. `async`/`await`, no promise chains
3. Small, pure functions in `config.js` (notably `shouldNotify`), side effects only in `background.js` and `options.js`
4. Log errors in listeners with `console.error` and swallow them, so one error does not break the listener for good
5. No `innerHTML` assignments with data from messages or account names, only `textContent`

## Don't

1. Do not introduce a build step, a `package.json` or a linter setup. The release workflow only zips the files as they are.
2. No telemetry, no network access
3. No new features without asking first
