// This is the background worker that installs watcher.tsx to each GitHub PR page.
import manifest from "../public/manifest.json";

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (process.env.NODE_ENV !== "production") {
    chrome.notifications.create({
      type: "basic",
      title: `${manifest.name} (v${manifest.version}) is successfully installed by ${reason}.`,
      message: "This is a development version.",
      iconUrl: "./assets/velociraptor.png",
    });
  }

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
