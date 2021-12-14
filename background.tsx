// works as a ServiceWorker

import React from "react";
import ReactDOM from "react-dom";
import manifest from "./public/manifest.json";

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (process.env.NODE_ENV !== "production") {
    chrome.notifications.create({
      type: "basic",
      title: `${manifest.name} (v${manifest.version}) is successfully installed by ${reason}.`,
      message: "This is a development version.",
      iconUrl: "./assets/velociraptor.png",
    });
  }
});

chrome.alarms.create("updateNotifications", {
  delayInMinutes: 1 / 60,
  periodInMinutes: 10 / 60,
});

async function getGitHubPRsTabs(): Promise<ReadonlyArray<chrome.tabs.Tab>> {
  return await chrome.tabs.query({
    status: "complete",
    url: "https://github.com/*/*/pull/*",
  });
}

async function injectScript() {
  for (const tab of await getGitHubPRsTabs()) {
    const url = new URL(tab.url!);
    if (!/\/pull\/\d+$/.test(url.pathname)) {
      continue;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      files: ["./injected.js"],
    });
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  await injectScript();
});
