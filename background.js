import { countsInBadge, isIgnoredFolder, loadConfig, senderName, shouldNotify } from "./config.js";

const ICON = "icons/icon-96.png";

/** Subject lines a grouped notification lists before cutting off. */
const SUMMARY_SUBJECTS = 3;

// The event page is unloaded when idle; only listeners registered synchronously
// here wake it up again. `true` = monitorAllFolders, so mail that filters move
// out of the inbox notifies too.
messenger.messages.onNewMailReceived.addListener(onNewMail, true);
messenger.notifications.onClicked.addListener(onNotificationClicked);
messenger.storage.local.onChanged.addListener(updateBadgeFilter);
messenger.accounts.onCreated.addListener(updateBadgeFilter);

// The event page starts on its own only on install, update and enable; an
// onStartup listener makes Thunderbird start it at launch too. The badge
// experiment loses its filter whenever the add-on stops, so every start of the
// page pushes it again.
messenger.runtime.onStartup.addListener(() => {});
updateBadgeFilter();

/** Hands the accounts left out of the badge to the badge experiment, which recounts the app icon badge. */
async function updateBadgeFilter() {
  try {
    const config = await loadConfig();
    const accounts = await messenger.accounts.list();
    const excluded = accounts.filter((account) => !countsInBadge(config, account.id));
    await messenger.unreadBadge.setExcludedAccounts(excluded.map((account) => account.id));
  } catch (error) {
    console.error("Account Notify: updating the badge filter failed", error);
  }
}

async function onNewMail(folder, list) {
  try {
    if (isIgnoredFolder(folder)) return;

    const config = await loadConfig();
    if (!shouldNotify(config, folder)) return;

    const messages = [...list.messages];
    let page = list;
    while (page.id) {
      page = await messenger.messages.continueList(page.id);
      messages.push(...page.messages);
    }

    const fresh = messages.filter((message) => !message.read && !message.junk);
    if (fresh.length === 0) return;

    await notify(config, folder, fresh);
  } catch (error) {
    console.error("Account Notify: handling new mail failed", error);
  }
}

async function notify(config, folder, messages) {
  if (messages.length < config.collapseThreshold) {
    for (const message of messages) {
      await messenger.notifications.create(`msg:${message.id}`, {
        type: "basic",
        title: senderName(message.author),
        message: message.subject || "(no subject)",
        iconUrl: ICON,
      });
    }
    return;
  }

  const account = await messenger.accounts.get(folder.accountId);
  const subjects = messages.slice(0, SUMMARY_SUBJECTS).map((message) => message.subject || "(no subject)");
  if (messages.length > SUMMARY_SUBJECTS) subjects.push("…");

  await messenger.notifications.create(`folder:${folder.id}`, {
    type: "basic",
    title: `${account.name} – ${folder.name}`,
    message: [`${messages.length} new messages`, ...subjects].join("\n"),
    iconUrl: ICON,
  });
}

async function onNotificationClicked(notificationId) {
  try {
    const tab = notificationId.startsWith("msg:")
      ? await messenger.messageDisplay.open({
          messageId: Number(notificationId.slice("msg:".length)),
          location: "tab",
          active: true,
        })
      : await showFolder(notificationId.slice("folder:".length));

    await messenger.windows.update(tab.windowId, { focused: true });
    await messenger.notifications.clear(notificationId);
  } catch (error) {
    console.error("Account Notify: opening notification failed", error);
  }
}

/** Shows the folder in the active mail tab, or in a new one when the active tab is something else. */
async function showFolder(folderId) {
  const [tab] = await messenger.mailTabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return messenger.mailTabs.create({ displayedFolderId: folderId });

  await messenger.mailTabs.update(tab.tabId, { displayedFolderId: folderId });
  return tab;
}
