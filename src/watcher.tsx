/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import manifest from "../public/manifest.json";

const getStatus = (statusIcon: HTMLElement): "unknown" | "pending" | "success" | "fail" => {
  const svg = statusIcon.querySelector("svg")!;
  if (svg == null) {
    console.warn(
      `[${manifest.name}] no svg found in the status icon element:`,
      statusIcon
    );
    return "unknown";
  }

  if (svg.classList.contains("hx_dot-fill-pending-icon")) {
    return "pending";
  } else if (svg.classList.contains("color-fg-danger")) {
    return "fail";
  } else if (svg.classList.contains("color-fg-success")) {
    return "success";
  } else {
    return "unknown";
  }
};

const notifyStatusChange = async (statusIcon: HTMLElement) => {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("Notifications is not permitted :(");
  }

  const status = getStatus(statusIcon);
  const notification  = new Notification(`CI status changed to ${status}`, {
    body: `Pull-request: "${document.title}"`,
    requireInteraction: true,
  });
};

const handleStatusIconChange = (event: Event) => {
  const statusIcon = event.target as HTMLElement;
  notifyStatusChange(statusIcon);
};

type WatchCheckboxProps = Readonly<{
  statusIcon: HTMLElement;
}>;

const WatchCheckbox: React.FC<WatchCheckboxProps> = ({ statusIcon }) => {
  const [checked, setChecked] = useState(false);
  const status = getStatus(statusIcon);

  useEffect(() => {
  }, []);
  return (
    <input
      type="checkbox"
      title={`${manifest.name}: ${status}`}
      checked={checked}
      onChange={() => {
        setChecked(!checked);

        // if (checked) {
        //   statusIcon.addEventListener("change", handleStatusIconChange);
        // } else {
        //   statusIcon.removeEventListener("change", handleStatusIconChange);
        // }

        notifyStatusChange(statusIcon);
      }}
    />
  );
};

function install(document: Document): boolean {
  let installed = false;
  for (const icon of document.querySelectorAll<HTMLElement>(
    ".merge-status-list .merge-status-icon"
  )) {
    for (const container of icon.querySelectorAll<HTMLElement>(
      ".watchraptor-checkbox-container"
    )) {
      container.remove();
    }

    const container = document.createElement("div");
    container.style.display = "inline-flex";
    container.style.alignItems = "center";
    container.style.marginLeft = "2px";
    container.classList.add("watchraptor-checkbox-container");

    icon.style.display = "flex";
    icon.appendChild(container);

    const checkbox = <WatchCheckbox statusIcon={icon} />;
    ReactDOM.render(checkbox, container);

    installed = true;
  }

  return installed;
}

function main() {
  console.log(`[${manifest.name}] installing`);

  if (!install(document)) {
    // The pull-request tab is being rendered.
    const observer = new MutationObserver((mutations) => {
      if (install(document)) {
        console.log(`[${manifest.name}] installed`);
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }
}

main();
