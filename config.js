/**
 * Config storage and the pure decision helpers shared by the background
 * script and the options page.
 */

/** Settings used for every key `storage.local` does not hold yet. */
export const DEFAULTS = {
  defaultEnabled: true,
  collapseThreshold: 3,
  accounts: {},
};

/** `MailFolder.specialUse` values whose new mail never notifies. */
export const IGNORED_SPECIAL_USE = new Set(["junk", "trash", "drafts", "sent", "archives", "templates", "outbox"]);

/** Reads the config from `storage.local`, with `DEFAULTS` filling missing keys. */
export async function loadConfig() {
  return messenger.storage.local.get(structuredClone(DEFAULTS));
}

/** Writes the whole config to `storage.local`. */
export async function saveConfig(config) {
  await messenger.storage.local.set(config);
}

/** Whether an account notifies: its own setting, else `defaultEnabled`. */
export function accountNotifies(config, accountId) {
  return config.accounts[accountId]?.enabled ?? config.defaultEnabled;
}

/** Whether an account's unread mail counts toward the app icon badge; unset counts, as in Thunderbird itself. */
export function countsInBadge(config, accountId) {
  return config.accounts[accountId]?.badge ?? true;
}

/**
 * Whether new mail in `folder` should notify: the folder override wins, then
 * the account setting, then `defaultEnabled`.
 */
export function shouldNotify(config, folder) {
  return config.accounts[folder.accountId]?.folders?.[folder.path] ?? accountNotifies(config, folder.accountId);
}

/** Whether `folder` is a special-use folder that never notifies (junk, trash, sent, …). */
export function isIgnoredFolder(folder) {
  return (folder.specialUse ?? []).some((use) => IGNORED_SPECIAL_USE.has(use));
}

/** Display name from a `MessageHeader.author` such as `"Doe, Jane" <jane@example.com>`, else the address. */
export function senderName(author) {
  const match = /^\s*"?(.*?)"?\s*<([^>]*)>\s*$/.exec(author ?? "");
  return (match ? match[1] || match[2] : author ?? "").trim() || "Unknown sender";
}
