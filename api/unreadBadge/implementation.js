/**
 * Experiment behind `messenger.unreadBadge`: keeps chosen accounts out of the
 * unread count Thunderbird shows on the app icon. No WebExtension API reaches
 * that count, so this hooks into `MailNotificationService.sys.mjs` internals
 * and may break with a Thunderbird update. The background script decides which
 * accounts to leave out.
 */
var unreadBadge = class extends ExtensionCommon.ExtensionAPI {
  /** Observer topic `MailNotificationService.confirmShouldCount` asks before it counts a folder. */
  #topic = "before-count-unread-for-folder";

  /** Keys of the incoming servers the badge leaves out. */
  #excludedServers = new Set();

  #lazy = {};

  /** Vetoes counting a folder that belongs to an excluded server. */
  #observer = (shouldCount, topic, folderURI) => {
    const server = this.#lazy.MailServices.folderLookup.getFolderForURL(folderURI)?.server;
    if (server && this.#excludedServers.has(server.key)) {
      shouldCount.QueryInterface(Ci.nsISupportsPRBool).data = false;
    }
  };

  constructor(extension) {
    super(extension);
    ChromeUtils.defineESModuleGetters(this.#lazy, {
      MailNotificationService: "resource:///modules/MailNotificationService.sys.mjs",
      MailServices: "resource:///modules/MailServices.sys.mjs",
    });
    Services.obs.addObserver(this.#observer, this.#topic);
  }

  getAPI() {
    return {
      unreadBadge: {
        setExcludedAccounts: async (accountIds) => {
          const { accounts } = this.#lazy.MailServices;
          this.#excludedServers = new Set(
            accountIds.map((id) => accounts.getAccount(id)?.incomingServer?.key).filter(Boolean)
          );
          this.#recount();
        },
      },
    };
  }

  onShutdown(isAppShutdown) {
    if (isAppShutdown) return;

    Services.obs.removeObserver(this.#observer, this.#topic);
    this.#recount();
    Services.obs.notifyObservers(null, "startupcache-invalidate");
  }

  /**
   * Recomputes the unread total like `MailNotificationService`'s constructor
   * does, which only counts once at startup and then applies deltas.
   */
  #recount() {
    const { MailNotificationService, MailServices } = this.#lazy;
    let total = 0;
    for (const server of MailServices.accounts.allServers) {
      if (server.type != "rss" && server.type != "nntp" && server.rootFolder) {
        total += MailNotificationService.countUnread(server.rootFolder);
      }
    }
    MailNotificationService.unreadCount = total;

    // ponytail: the new-mail count has no setter, so in "Total new messages" mode the filter only applies to mail arriving after a change
    if (!MailNotificationService.useNewCountInBadge) {
      MailNotificationService._notifyListeners(total);
    }
  }
};
