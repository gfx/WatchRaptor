/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import { debug, info, warn } from "./log";
import { Registry } from "./registry";

type StatusType = "unknown" | "pending" | "success" | "fail";

const containerClassName = "watchraptor-container";

const registry = new Registry<StatusType>();

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

  const type = "ci-status-changed";
  const documentTitle = document.title;

  chrome.runtime.sendMessage({
    type,
    documentTitle,
    statusMessage,
    status,
  });
};

const STATUS_ITEM_QUERY_SEPARATOR = "/";

const getStatusIdFromItem = (statusItem: Element): string => {
  // Extract the name of the status item (e.g. "CI / build (pull_request)") which should be unique in the CI statuses. This is used to identify the status item.
  return statusItem.querySelector("div > strong")!.textContent!.trim();
};

const queryStatusItem = (element: ParentNode, q: string): Element | null => {
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

const findStatusItemByStatusId = (
  element: ParentNode,
  statusId: string
): Element | null => {
  for (const statusItem of element.querySelectorAll(
    ".merge-status-list .merge-status-item"
  )) {
    if (getStatusIdFromItem(statusItem) === statusId) {
      return statusItem;
    }
  }
  return null;
};

const queryContainer = (
  target: ParentNode,
  statusId: string
): HTMLElement | null => {
  return target.querySelector<HTMLElement>(
    `.${containerClassName}[data-watchraptor-id="${statusId}"]`
  );
};

// GitHub status item -> WatchRaptor UI container mapping
const statusItemToContainer = new WeakMap<Element, HTMLElement>();

const handleStatusIconChange = () => {
  (async () => {
    for await (const [statusItemQuery, oldStatus] of registry) {
      const statusItem = queryStatusItem(document, statusItemQuery);
      if (statusItem) {
        const statusIcon = statusItem.querySelector(".merge-status-icon");
        if (statusIcon) {
          const newStatus = getStatus(statusIcon);
          await registry.set(statusItemQuery, newStatus);

          if (oldStatus !== newStatus && newStatus !== "pending") {
            debug(`${statusItemQuery}: ${oldStatus} -> ${newStatus}`);
            notifyStatusChange(statusIcon);
          }
        }
      }
    }
  })();
};

type WatchCheckboxProps = Readonly<{
  statusItemQuery: string;
  statusIcon: Element;
}>;

const WatchCheckbox: React.FC<WatchCheckboxProps> = ({
  statusItemQuery,
  statusIcon,
}) => {
  const [disabled, setDisabled] = useState(true);
  const [checked, setChecked] = useState(false);
  const status = getStatus(statusIcon);

  const updateChecked = async (checked: boolean) => {
    setChecked(checked);
    setDisabled(true);
    if (checked) {
      await registry.set(statusItemQuery, status);
    } else {
      await registry.delete(statusItemQuery);
    }
    setDisabled(false);
  };

  useEffect(() => {
    (async () => {
      await updateChecked(await registry.has(statusItemQuery));
      setDisabled(false);
    })().catch((e) => warn(e));
  }, []);

  return (
    <div style={{
      display: "flex",
      padding: "2px",
    }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={() => {
          (async () => {
            setDisabled(true);
            updateChecked(!checked);
            setDisabled(false);
          })().catch((e) => warn(e));
        }}
      />
    </div>
  );
};

const adjustContainerPosition = ({
  statusItem,
  container,
}: {
  statusItem: Element;
  container: HTMLElement;
}): void => {
  const { left, top } = statusItem.getBoundingClientRect();
  container.style.left = `${Math.round(left + scrollX)}px`;
  container.style.top = `${Math.round(top + scrollY)}px`;
};

const generation = Date.now().toString();
let shutdown = false;

const intersectionObserver = new IntersectionObserver(
  (entries) => {
    if (shutdown) {
      intersectionObserver.disconnect();
      return;
    }

    for (const entry of entries) {
      const statusItem = entry.target as HTMLElement;
      const statusId = getStatusIdFromItem(statusItem);
      const container = queryContainer(document, statusId);
      if (container) {
        container.style.visibility = entry.isIntersecting
          ? "visible"
          : "hidden";
      }
    }
  },
  { threshold: 0.7 }
);

const adjustContainerPositionAll = () => {
  for (const container of document.querySelectorAll<HTMLElement>(
    `.${containerClassName}`
  )) {
    const statusId = container.dataset.watchraptorId!;
    const statusItem = findStatusItemByStatusId(document, statusId);
    if (statusItem) {
      adjustContainerPosition({ statusItem, container });
    }
  }
};

const handleMergeStatusListScroll = (e: Event): void => {
  if (shutdown) {
    e.target!.removeEventListener("scroll", handleMergeStatusListScroll);
    return;
  }

  adjustContainerPositionAll();
};

const install = (document: Document): boolean => {
  let installed = false;

  const mergeStatusList =
    document.querySelector<HTMLElement>(".merge-status-list");
  if (mergeStatusList) {
    mergeStatusList.removeEventListener("scroll", handleMergeStatusListScroll);
    mergeStatusList.addEventListener("scroll", handleMergeStatusListScroll);
  }

  for (const statusItem of document.querySelectorAll(
    ".merge-status-list .merge-status-item"
  )) {
    if (statusItem.querySelector(".avatar") == null) {
      // skip if the status item has not an avatar, or an icon for the workflow.
      continue;
    }
    const statusIcon = statusItem.querySelector(".merge-status-icon");
    if (statusIcon == null) {
      continue;
    }
    const statusId = getStatusIdFromItem(statusItem);
    const existingContainer = statusItemToContainer.get(statusItem);
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
          info(`shutting down (generation=${generation})`);
          return false;
        }

        // the current one is newer.
        existingContainer.remove();
      }
    }

    const container = document.createElement("div");
    container.classList.add(containerClassName);

    container.style.position = "absolute";
    container.style.visibility = "hidden"; // will be updated in the intersection observer

    container.dataset.watchraptorGeneration = generation;
    container.dataset.watchraptorId = statusId;

    document.body.appendChild(container);
    statusItemToContainer.set(statusItem, container);

    intersectionObserver.observe(statusItem);

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
  info(`injected (generation=${generation})`);

  if (install(document)) {
    info(`installed (generation=${generation})`);
  }

  const mutationObserver = new MutationObserver((mutations) => {
    if (shutdown) {
      mutationObserver.disconnect();
      return;
    }

    handleStatusIconChange();
    adjustContainerPositionAll();

    if (install(document)) {
      info(`installed in MutationObserver (generation=${generation})`);
    }
  });
  mutationObserver.observe(document, {
    childList: true,
    subtree: true,
  });
};

requestAnimationFrame(main);
