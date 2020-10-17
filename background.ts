import { updateNotifications } from "./src/updateNotifications.js";

chrome.runtime.onInstalled.addListener(() => {
  (async () => {
    await chrome.notifications.create(null, {
      type: "basic",
      title: "Octoracker is successfully installed.",
      message: "To configure options, click this notification!",
      iconUrl: "./assets/fish_takotsubo.png",
    });
  })();
});

chrome.alarms.create("updateNotifications", {
  periodInMinutes: 1,
});

chrome.alarms.onAlarm.addListener(() => {
  (async () => {
    await updateNotifications();
  })();
});
