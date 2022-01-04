// This is the background worker that installs watcher.tsx to each GitHub PR page.
import manifest from "../public/manifest.json";

// @ts-expect-error
import appIconUri from "../public/assets/velociraptor.png";

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  console.log(`${manifest.name} is installed: ${reason}`);
  await installScriptToAllTabs();
});

async function getGitHubPRsTabs(): Promise<ReadonlyArray<chrome.tabs.Tab>> {
  return await chrome.tabs.query({
    status: "complete",
    url: "https://github.com/*/*/pull/*",
  });
}

async function installScript({ url, tabId }: { url: string; tabId: number }) {
  console.log(`installing ${manifest.name} to ${url}`);

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

chrome.webNavigation.onCommitted.addListener((details) => {
  if (!details.url) {
    return;
  }

  if (
    ["reload", "link", "typed", "generated"].includes(details.transitionType) &&
    manifest.host_permissions.some((urlPrefix) =>
      details.url.startsWith(urlPrefix)
    )
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
});

chrome.tabs.onCreated.addListener((tab) => {
  const { id: tabId, url } = tab;
  if (
    tabId != null &&
    url != null &&
    manifest.host_permissions.some((urlPrefix) => url.startsWith(urlPrefix))
  ) {
    installScript({
      tabId,
      url,
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  console.log("message", message, sender);

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
    chrome.notifications.create(notificationId, {
      type: "basic",
      title: `${sym} ${message.title}`,
      message: message.statusMessage,
      iconUrl: appIconUri,
      requireInteraction: true,
    });
  }
});

chrome.notifications.onClicked.addListener((id) => {
  const [, tabId] = id.split("-");
  chrome.tabs.update(Number.parseInt(tabId), { active: true });
  chrome.notifications.clear(id);
});
