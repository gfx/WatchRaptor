import React from "react";
import ReactDOM from "react-dom";

import manifest from "./public/manifest.json";

type WatchCheckboxProps = Readonly<{
  isPending: boolean;
}>;

const WatchCheckbox: React.FC<WatchCheckboxProps> = ({ isPending }) => {
  const checked = false;
  return <input
    type="checkbox"
    checked={checked}
    disabled={!isPending}
    style={{
      cursor: isPending ? "pointer" : "not-allowed",
    }}
  />;
};

function main() {
  console.log(`[${manifest.name}] 👀`);

  for (const icon of document.querySelectorAll<HTMLElement>(
    ".merge-status-list .merge-status-icon"
  )) {
    let container = icon.querySelector<HTMLElement>(".watchraptor-checkbox-container");
    if (!container) {
      icon.style.display = "flex";

      container = document.createElement("div");
      container.style.display = "inline-flex";
      container.style.alignItems = "center";
      container.style.marginLeft = "2px";
      container.classList.add("watchraptor-checkbox-container");
      icon.appendChild(container);
    }

    const isPending = !!icon.querySelector("svg.hx_dot-fill-pending-icon");
    const checked = false;
    const checkbox = <WatchCheckbox isPending={isPending} />;
    ReactDOM.render(checkbox, container);
  }
}

main();
