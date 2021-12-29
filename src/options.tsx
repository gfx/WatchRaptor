import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import manifest from "../public/manifest.json";

type OptionsMainProps = {
};

const OptionsMain: React.FC<OptionsMainProps> = ({
}) => {
  return <main>
    <h1>${manifest.name}</h1>
    <section>
      <p>
        Welcome to ${manifest.name}!
      </p>
    </section>
  </main>;
};

const OptionsApp: React.FC = () => {
  return <OptionsMain/>;
};

window.addEventListener("DOMContentLoaded", async () => {
  ReactDOM.render(
    <OptionsApp />,
    document.getElementById("app"),
  );
});
