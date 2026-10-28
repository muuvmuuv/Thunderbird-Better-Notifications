# Better Notifications

A Thunderbird add-on that replaces the built-in new mail alerts with notifications you switch on or off per account and per folder. It can also keep accounts out of the unread count on the app icon.

Made for mailboxes you only connect to look into now and then while someone else takes care of them.

## Features

- Notifications per account, with an inherit, on or off override per folder
- Several messages arriving in one folder at once become one grouped notification (the threshold is configurable)
- Clicking a notification opens the message, or the folder for a grouped one
- A “Badge” checkbox per account decides whether its unread mail counts on the app icon (Dock or taskbar)
- Junk, trash, drafts, sent, archives, templates and outbox never notify

## Install

Requires Thunderbird 142 or newer.

1. Install [Better Notifications from addons.thunderbird.net](https://addons.thunderbird.net/thunderbird/addon/better-notifications/). Thunderbird keeps it up to date from there.
2. Confirm the request for full access (see [below](#why-full-access)).
3. Turn off Thunderbird’s own alerts, or every message notifies twice: Settings › General › Email notifications, untick “Show an alert for new emails” and the sound option.

On macOS, notifications also need to be allowed for Thunderbird under System Settings › Notifications.

Every release is also attached to the [GitHub releases](https://github.com/muuvmuuv/Thunderbird-Better-Notifications/releases) as `better-notifications.xpi`, for “Install Add-on From File…” under the gear in Add-ons and Themes.

## Settings

Open the add-on’s options in Add-ons and Themes.

- **Notify by default**: applies to accounts you have not switched on or off yourself.
- **Group into one notification**: how many messages a folder must receive at once to get a single notification.
- Per account, **Notify** and **Badge**, plus **Notifications per folder** for overrides on single folders.

Every change applies right away.

## Why full access?

No regular add-on API can change the unread count on the app icon. The badge filter is a small experiment (`api/unreadBadge`) that hooks into Thunderbird’s internal count, and Thunderbird grants every experiment full access. Everything else uses the regular APIs with the `accountsRead`, `messagesRead`, `notifications` and `storage` permissions. The add-on makes no network requests and collects no data.

## Limitations

- Local Folders do not report new mail, so POP accounts that use the global inbox do not notify.
- Notifications have no action buttons (mark as read, delete), because the add-on API does not support them.
- Settings are tied to Thunderbird’s internal account IDs. After recreating an account or switching profiles, set it up again.
- The badge filter relies on Thunderbird internals and can break with a Thunderbird update. That is why each version declares the newest Thunderbird it was tested with, and a new Thunderbird release is unlocked only after testing.
- With the app icon set to show “Total new messages”, the badge filter only applies to mail arriving after a change.

## Development

- Load the add-on from source: Tools › Developer Tools › Debug Add-ons › Load Temporary Add-on, then pick `manifest.json`.
- Run the tests with `node --test`.
- To release, bump `version` in `manifest.json`, commit, then tag and push `v<version>`. The release workflow checks that tag and version match, runs the tests and attaches `better-notifications.xpi` to a GitHub release. It then uploads the file to addons.thunderbird.net as a new listed version, using the repository secrets `ATN_JWT_ISSUER` and `ATN_JWT_SECRET` from Developer Hub › Manage API Keys.
- When a new Thunderbird release works, raise the version's compatibility on ATN (Manage Status & Versions), and `strict_max_version` in `manifest.json` for the next release.

## License

[EUPL-1.2](LICENSE)
