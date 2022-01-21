// This is the background worker that installs watcher.tsx to each GitHub PR page.
import manifest from "../public/manifest.json";
import { debug, info, warn } from "./log";

// @ts-expect-error
import appIconUri from "../public/assets/velociraptor128.png";

// chrome.storage.local.clear();

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  info(`installed (reason=${reason})`);
  await installScriptToAllTabs();
});

async function getGitHubPRsTabs(): Promise<ReadonlyArray<chrome.tabs.Tab>> {
  return await chrome.tabs.query({
    url: manifest.host_permissions,
  });
}

async function installScript({ url, tabId }: { url: string; tabId: number }) {
  info(`installScript: ${url}`);

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["./watcher.js"],
  });
}

async function installScriptToAllTabs() {
  for (const tab of await getGitHubPRsTabs()) {
    if (!tab.url) {
      continue;
    }
    const url = new URL(tab.url);
    if (!/\/pull\/\d+$/.test(url.pathname)) {
      continue;
    }

    installScript({
      tabId: tab.id!,
      url: tab.url,
    });
  }
}

chrome.webNavigation.onCommitted.addListener(
  (details) => {
    debug("chrome.webNavigation.onCommitted:", details);
    if (
      ["reload", "link", "typed", "generated", "auto_bookmark"].includes(details.transitionType)
    ) {
      const onComplete = () => {
        installScript({
          tabId: details.tabId!,
          url: details.url!,
        });
        chrome.webNavigation.onCompleted.removeListener(onComplete);
      };

      chrome.webNavigation.onCompleted.addListener(onComplete);
    }
  },
  {
    url: manifest.host_permissions.map((urlPrefix) => {
      return { urlPrefix };
    }),
  }
);

chrome.runtime.onMessage.addListener((message, sender, callback) => {
  debug("chrome.runtime.onMessage:", message, sender);

  if (message.type === "ci-status-changed") {
    const sym = ((status: string) => {
      if (status === "success") {
        return "✅";
      } else if (status === "fail") {
        return "❌";
      } else if (status === "pending") {
        return "⏳";
      } else {
        return "❓";
      }
    })(message.status);

    const tabId = sender.tab!.id!;
    const notificationId = `notification-${tabId}`;
    chrome.notifications.create(
      notificationId,
      {
        type: "basic",
        title: `${sym} ${message.statusMessage}`,
        message: message.documentTitle,
        iconUrl: appIconUri,
        requireInteraction: true,
      },
      () => {
        callback();
      }
    );
  } else if (message.type === "get-registry-items") {
    const senderTabId = sender!.tab!.id;
    if (!senderTabId) {
      throw new Error("sender.tab.id is null");
    }
    chrome.storage.local.get(`${senderTabId}`).then((root) => {
      callback(root[`${senderTabId}`] ?? {});
    });
  } else if (message.type === "set-registry-items") {
    const senderTabId = sender!.tab!.id;
    if (!senderTabId) {
      throw new Error("sender.tab.id is null");
    }
    chrome.storage.local
      .set({
        [`${senderTabId}`]: message.items,
      })
      .then(() => {
        callback();
      });
  } else {
    warn("unknown message", message);
  }

  return true;
});

chrome.notifications.onClicked.addListener(async (id) => {
  const [, tabId] = id.split("-");
  await chrome.tabs.update(Number.parseInt(tabId), { active: true });
  await chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, {
    focused: true,
  });
  chrome.notifications.clear(id);
});
