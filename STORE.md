# Store listing

Texts for the listing on addons.thunderbird.net (ATN). ATN keeps the listing per language, so the texts come in English and German. ATN has no API for the listing, so these are entered by hand.

## Same in every language

**Name**
```text
Better Notifications
```

**Add-on URL**
```text
better-notifications
```

**Category:** Message and News Reading

**Support website**
```text
https://github.com/muuvmuuv/Thunderbird-Better-Notifications/issues
```

**Homepage**
```text
https://github.com/muuvmuuv/Thunderbird-Better-Notifications
```

**Support email:** leave empty.

**License:** EUPL-1.2 if offered, else a custom license with the contents of `LICENSE`.

**This add-on is experimental:** leave unticked. It means "not ready for everyday use" and has nothing to do with Experiment APIs.

## English

**Summary**
```text
Notifications for new mail that you switch on or off per account and per folder, plus a choice of which accounts count toward the unread badge on the app icon.
```

**Description**
```text
Made for mailboxes you only connect to look into now and then while someone else takes care of them.

- Notifications per account, with an inherit, on or off override per folder
- Several new messages in one folder become one grouped notification
- Clicking a notification opens the message or the folder
- A "Badge" checkbox per account decides whether its unread mail counts on the app icon

Turn off Thunderbird's own alerts (Settings › General › Email notifications) so mail does not notify twice.

Privacy: the add-on collects and sends no data and makes no network requests.
```

**Tags**
```text
notifications, badge, accounts, imap
```

**Privacy policy**
```text
Better Notifications does not collect, send or share any data and makes no network requests. To show a notification it reads the sender and subject of new messages and the names of your accounts and folders, and this stays inside Thunderbird. Your settings are kept in the add-on's own storage in your Thunderbird profile.
```

**Release notes for 0.2.2**
```text
First release on addons.thunderbird.net.

- Notifications for new mail per account, with an inherit, on or off override per folder
- One grouped notification when several messages arrive in a folder at once
- A "Badge" checkbox per account decides whether its unread mail counts on the app icon
- Works with Thunderbird 142 to 159
```

**Notes to reviewer** (English only, for the ATN reviewers)
```text
Testing needs any IMAP account, no credentials from us. Turn off Settings › General › Email notifications › "Show an alert for new emails", then send mail to the account to get a notification. In the add-on options, untick "Badge" for an account: the unread count on the app icon drops by that account's inbox.

Experiment api/unreadBadge: no WebExtension API reaches the unread count on the app icon. The experiment only observes before-count-unread-for-folder (asked by MailNotificationService.confirmShouldCount) to skip folders of accounts the user excluded, then recounts. All decisions happen in background.js.
```

## Deutsch

**Zusammenfassung**
```text
Benachrichtigungen für neue E-Mails, die Sie pro Konto und pro Ordner ein- oder ausschalten. Außerdem legen Sie fest, welche Konten im Zähler ungelesener Nachrichten am App-Symbol mitzählen.
```

**Beschreibung**
```text
Gemacht für Postfächer, die Sie nur ab und zu einsehen, während sich jemand anderes darum kümmert.

- Benachrichtigungen pro Konto, mit Ausnahmen für einzelne Ordner
- Mehrere neue Nachrichten in einem Ordner werden zu einer gemeinsamen Benachrichtigung
- Ein Klick auf die Benachrichtigung öffnet die Nachricht oder den Ordner
- Ein Kästchen „Badge“ pro Konto legt fest, ob dessen ungelesene Nachrichten am App-Symbol mitzählen

Schalten Sie die eigenen Benachrichtigungen von Thunderbird aus (Einstellungen › Allgemein › E-Mail-Benachrichtigung › „Benachrichtigung bei neuen E-Mails anzeigen“), sonst kommt jede Nachricht doppelt.

Datenschutz: Das Add-on sammelt und sendet keine Daten und baut keine Netzwerkverbindungen auf.
```

**Tags**
```text
benachrichtigungen, badge, konten, imap
```

**Datenschutzerklärung**
```text
Better Notifications sammelt, sendet oder teilt keine Daten und baut keine Netzwerkverbindungen auf. Um eine Benachrichtigung anzuzeigen, liest das Add-on Absender und Betreff neuer Nachrichten sowie die Namen Ihrer Konten und Ordner. Diese Angaben verlassen Thunderbird nicht. Ihre Einstellungen liegen im eigenen Speicher des Add-ons in Ihrem Thunderbird-Profil.
```

**Versionshinweise für 0.2.2**
```text
Erste Version auf addons.thunderbird.net.

- Benachrichtigungen für neue E-Mails pro Konto, mit Ausnahmen für einzelne Ordner
- Eine gemeinsame Benachrichtigung, wenn mehrere Nachrichten auf einmal in einem Ordner eintreffen
- Ein Kästchen „Badge“ pro Konto legt fest, ob dessen ungelesene Nachrichten am App-Symbol mitzählen
- Läuft mit Thunderbird 142 bis 159
```
