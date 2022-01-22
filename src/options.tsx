import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import manifest from "../public/manifest.json";

type OptionsMainProps = {};

const OptionsMain: React.FC<OptionsMainProps> = ({}) => {
  const [bytesInUse, setBytesInUse] = useState(0);

  useEffect(() => {
    chrome.storage.local.getBytesInUse(null, (bytes) => {
      setBytesInUse(bytes);
    });
  }, []);

  return (
    <main>
      <h1>{manifest.name} v{manifest.version}</h1>
      <hr />
      <section>
        <h2>Clear the Local Storage</h2>
        <p>It consumes {bytesInUse} bytes.</p>
        <p>
          <button onClick={() => {
            chrome.storage.local.clear();
            chrome.storage.local.getBytesInUse(null, (bytes) => {
              setBytesInUse(bytes);
            });
          }}>clear</button>
        </p>
      </section>
      <hr />
    </main>
  );
};

const OptionsApp: React.FC = () => {
  return <OptionsMain />;
};

window.addEventListener("DOMContentLoaded", async () => {
  ReactDOM.render(<OptionsApp />, document.getElementById("app"));
});
