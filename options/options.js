import { accountNotifies, countsInBadge, isIgnoredFolder, loadConfig, saveConfig } from "../config.js";

const config = await loadConfig();

const defaultEnabled = document.getElementById("default-enabled");
const collapseThreshold = document.getElementById("collapse-threshold");
const accountList = document.getElementById("accounts");
const accountTemplate = document.getElementById("account-template");
const folderTemplate = document.getElementById("folder-template");

defaultEnabled.checked = config.defaultEnabled;
defaultEnabled.addEventListener("change", async () => {
  config.defaultEnabled = defaultEnabled.checked;
  syncAccountToggles();
  await save();
});

collapseThreshold.value = config.collapseThreshold;
collapseThreshold.addEventListener("change", async () => {
  const value = Math.round(collapseThreshold.valueAsNumber);
  if (!(value >= 1)) {
    collapseThreshold.value = config.collapseThreshold;
    return;
  }
  collapseThreshold.value = value;
  config.collapseThreshold = value;
  await save();
});

try {
  const accounts = (await messenger.accounts.list()).filter((account) => account.type !== "local");
  accounts.forEach(renderAccount);
  syncAccountToggles();
  document.getElementById("no-accounts").hidden = accounts.length > 0;
} catch (error) {
  console.error("Better Notifications: listing accounts failed", error);
}

function renderAccount(account) {
  const node = accountTemplate.content.cloneNode(true);
  const name = node.querySelector(".account-name");
  name.textContent = account.name;
  name.id = `account-${account.id}`;
  node.querySelector(".toggles").setAttribute("aria-labelledby", name.id);

  const notify = node.querySelector(".account-enabled");
  notify.dataset.accountId = account.id;
  notify.addEventListener("change", async () => {
    settingsFor(account.id).enabled = notify.checked;
    await save();
  });

  const badge = node.querySelector(".account-badge");
  badge.checked = countsInBadge(config, account.id);
  badge.addEventListener("change", async () => {
    settingsFor(account.id).badge = badge.checked;
    await save();
  });

  const details = node.querySelector("details");
  details.addEventListener("toggle", () => loadFolders(account, details.querySelector(".folders")), { once: true });

  accountList.append(node);
}

/** Shows each account's effective state; untouched accounts follow `defaultEnabled`. */
function syncAccountToggles() {
  for (const toggle of accountList.querySelectorAll(".account-enabled")) {
    toggle.checked = accountNotifies(config, toggle.dataset.accountId);
  }
}

async function loadFolders(account, list) {
  try {
    const folders = await messenger.folders.getSubFolders(account.rootFolder.id, true);
    appendFolders(account.id, folders, list, 0);
  } catch (error) {
    console.error("Better Notifications: loading folders failed", error);
  }
}

function appendFolders(accountId, folders, list, depth) {
  for (const folder of folders) {
    if (isIgnoredFolder(folder)) continue;
    list.append(folderRow(accountId, folder, depth));
    appendFolders(accountId, folder.subFolders ?? [], list, depth + 1);
  }
}

function folderRow(accountId, folder, depth) {
  const node = folderTemplate.content.cloneNode(true);
  node.querySelector("li").style.setProperty("--depth", depth);
  node.querySelector(".folder-name").textContent = folder.name;

  const select = node.querySelector("select");
  const override = config.accounts[accountId]?.folders?.[folder.path];
  select.value = override === undefined ? "inherit" : override ? "on" : "off";
  select.addEventListener("change", async () => {
    const overrides = settingsFor(accountId).folders;
    if (select.value === "inherit") delete overrides[folder.path];
    else overrides[folder.path] = select.value === "on";
    await save();
  });

  return node;
}

function settingsFor(accountId) {
  const settings = (config.accounts[accountId] ??= {});
  settings.folders ??= {};
  return settings;
}

async function save() {
  try {
    await saveConfig(config);
  } catch (error) {
    console.error("Better Notifications: saving settings failed", error);
  }
}
