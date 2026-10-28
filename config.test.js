// Run with `node --test`. Not part of the packaged add-on.
import assert from "node:assert/strict";
import { test } from "node:test";
import { accountNotifies, countsInBadge, isIgnoredFolder, senderName, shouldNotify } from "./config.js";

const inbox = { accountId: "account1", path: "/INBOX", specialUse: ["inbox"] };
const lists = { accountId: "account1", path: "/INBOX/Lists", specialUse: [] };

test("shouldNotify resolves folder, then account, then default", () => {
  const config = {
    defaultEnabled: true,
    accounts: { account1: { enabled: false, folders: { "/INBOX/Lists": true } } },
  };
  assert.equal(shouldNotify(config, lists), true);
  assert.equal(shouldNotify(config, inbox), false);
  assert.equal(shouldNotify(config, { ...inbox, accountId: "account2" }), true);
  assert.equal(shouldNotify({ defaultEnabled: false, accounts: { account1: { folders: {} } } }, inbox), false);
});

test("isIgnoredFolder matches special-use folders only", () => {
  assert.equal(isIgnoredFolder({ specialUse: ["junk"] }), true);
  assert.equal(isIgnoredFolder(inbox), false);
  assert.equal(isIgnoredFolder({}), false);
});

test("senderName extracts the display name", () => {
  assert.equal(senderName("Jane Doe <jane@example.com>"), "Jane Doe");
  assert.equal(senderName('"Doe, Jane" <jane@example.com>'), "Doe, Jane");
  assert.equal(senderName("<jane@example.com>"), "jane@example.com");
  assert.equal(senderName("jane@example.com"), "jane@example.com");
  assert.equal(senderName(""), "Unknown sender");
});

test("accountNotifies falls back to defaultEnabled", () => {
  const config = { defaultEnabled: false, accounts: { account1: { enabled: true }, account2: { folders: {} } } };
  assert.equal(accountNotifies(config, "account1"), true);
  assert.equal(accountNotifies(config, "account2"), false);
  assert.equal(accountNotifies(config, "account3"), false);
});

test("countsInBadge defaults to counted, independent of notifications", () => {
  const config = { defaultEnabled: false, accounts: { account1: { enabled: false }, account2: { enabled: true, badge: false } } };
  assert.equal(countsInBadge(config, "account1"), true);
  assert.equal(countsInBadge(config, "account2"), false);
  assert.equal(countsInBadge(config, "account3"), true);
});
