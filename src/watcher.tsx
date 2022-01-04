/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import React, { useState } from "react";
import ReactDOM from "react-dom";

import { debug, info, warn } from "./log";

type StatusType = "unknown" | "pending" | "success" | "fail";

const registry = new Map<string, StatusType>();

const getStatus = (statusIcon: Element): StatusType => {
  const svg = statusIcon.querySelector("svg")!;
  if (svg == null) {
    warn(`no svg found in the status icon element:`, statusIcon);
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

const notifyStatusChange = async (statusIcon: Element) => {
  const status = getStatus(statusIcon);
  const statusMessage = statusIcon
    .nextElementSibling!.nextElementSibling!.textContent!.replaceAll(
      /\s+/g,
      " "
    )
    .trim();

  chrome.runtime.sendMessage({
    type: "ci-status-changed",
    title: document.title,
    statusMessage,
    status,
  });
};

const STATUS_ITEM_QUERY_SEPARATOR = "/";

const getStatusIdFromItem = (statusItem: Element): string => {
  // Extract the name of the status item (e.g. "CI / build (pull_request)") which should be unique in the CI statuses. This is used to identify the status item.
  return statusItem.querySelector("div > strong")!.textContent!.trim();
};

const queryItem = (element: ParentNode, q: string): Element | null => {
  const separatorPos = q.indexOf(STATUS_ITEM_QUERY_SEPARATOR);
  const first = q.substring(0, separatorPos);
  const second = q.substring(separatorPos + 1);
  for (const statusItem of element.querySelectorAll(first)) {
    if (getStatusIdFromItem(statusItem) === second) {
      return statusItem;
    }
  }
  return null;
};

const handleStatusIconChange = () => {
  for (const [statusItemQuery, oldStatus] of registry) {
    const statusItem = queryItem(document, statusItemQuery);
    if (statusItem) {
      const statusIcon = statusItem.querySelector(".merge-status-icon");
      if (statusIcon) {
        const newStatus = getStatus(statusIcon);
        registry.set(statusItemQuery, newStatus);

        if (oldStatus !== newStatus && newStatus !== "pending") {
          debug(`${statusItemQuery}: ${oldStatus} -> ${newStatus}`);
          notifyStatusChange(statusIcon);
        }
      }
    }
  }
};

type WatchCheckboxProps = Readonly<{
  statusItemQuery: string;
  statusIcon: HTMLElement;
}>;

const WatchCheckbox: React.FC<WatchCheckboxProps> = ({
  statusItemQuery,
  statusIcon,
}) => {
  const [checked, setChecked] = useState(registry.has(statusItemQuery));
  const status = getStatus(statusIcon);

  const register = (checked: boolean) => {
    if (checked) {
      registry.set(statusItemQuery, status);
    } else {
      registry.delete(statusItemQuery);
    }
  };

  register(checked);

  return (
    <div>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {
          setChecked(!checked);
          register(checked);
        }}
      />
    </div>
  );
};

const generation = Date.now().toString();
let shutdown = false;

const install = (document: Document): boolean => {
  let installed = false;

  for (const statusItem of document.querySelectorAll(
    ".merge-status-list .merge-status-item"
  )) {
    const statusId = getStatusIdFromItem(statusItem);
    const existingContainer = document.body.querySelector<HTMLElement>(
      `.watchraptor-checkbox-container[data-watchraptor-id="${statusId}"]`
    );
    if (existingContainer) {
      const installedGeneration =
        existingContainer.dataset.watchraptorGeneration ?? "0";
      if (installedGeneration === generation) {
        continue;
      } else {
        // A different generation of the script is installed.
        if (
          Number.parseInt(installedGeneration) > Number.parseInt(generation)
        ) {
          // the current one is older.
          shutdown = true;
          return false;
        }

        // the current one is newer.
        existingContainer.remove();
      }
    }

    const container = document.createElement("div");
    container.classList.add("watchraptor-checkbox-container");

    container.style.position = "absolute";

    container.dataset.watchraptorGeneration = generation;
    container.dataset.watchraptorId = statusId;

    document.body.appendChild(container);

    const rect = statusItem.getBoundingClientRect();
    container.style.left = `${Math.round(rect.left + scrollX)}px`;
    container.style.top = `${Math.round(rect.top + scrollY)}px`;

    const statusIcon =
      statusItem.querySelector<HTMLElement>(".merge-status-icon")!;
    const statusItemQuery = [
      ".merge-status-list .merge-status-item",
      statusId,
    ].join(STATUS_ITEM_QUERY_SEPARATOR);

    const checkbox = (
      <WatchCheckbox
        statusItemQuery={statusItemQuery}
        statusIcon={statusIcon}
      />
    );
    ReactDOM.render(checkbox, container);

    installed = true;
  }

  return installed;
};

const main = (): void => {
  info(`installing (generation=${generation})`);

  if (install(document)) {
    info(`installed (generation=${generation})`);
  }

  // The pull-request tab is being rendered.
  const observer = new MutationObserver((mutations) => {
    if (shutdown) {
      info(`shutting down (generation=${generation})`);
      observer.disconnect();
      return;
    }

    debug("registry", ...registry);
    handleStatusIconChange();

    if (install(document)) {
      info(`installed (generation=${generation})`);
    }
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
  });
};

main();
