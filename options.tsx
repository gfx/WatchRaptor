import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import { ready } from "./src/ready";
import { loadUserState, saveUserState, UserState } from "./src/UserState";

type OptionsMainProps = {
  accessToken: string,
  userName: string;
  userAvatarUrl: string;

  errorMessage?: string;

  onUserStateSet(userState: UserState): void;
};

const OptionsMain: React.FC<OptionsMainProps> = ({
  accessToken, userName, userAvatarUrl,
  onUserStateSet,
}) => {
  const [accessTokenCandidate, setAccessTokenCandidate] = useState(accessToken);
  const [errorMessage, setErrorMessage] = useState("");

  return <main>
    <h1>notify-check-changed</h1>
    <section>
      <h2>Personal Access Token</h2>
      <p>
        Hello, world!
      </p>
    </section>

    {errorMessage &&
      <section style={{ "color": "red" }}>
        <p>{errorMessage}</p>
      </section>
    }

    {userName && userAvatarUrl &&
      <section>
        <h2>Logged-In as:</h2>
        <p>
          <img
            src={userAvatarUrl}
            width={32}
            height={32} />
          <span>
            {userName}
          </span>
        </p>
      </section>
    }
  </main>;
};

const OptionsApp: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [userName, setUserName] = useState("");
  const [userAvatarUrl, setUserAvatarUrl] = useState("");

  useEffect(() => {
    (async () => {
      const userState = await loadUserState();
      setUserName(userState.userName);
      setUserAvatarUrl(userState.userAvatarUrl);
      setAccessToken(userState.accessToken);
      setInitialized(true);
    })();
  });

  if (initialized) {
    return <OptionsMain
      accessToken={accessToken}
      userName={userName}
      userAvatarUrl={userAvatarUrl}
      onUserStateSet={async (userState) => {
        await saveUserState(userState);

        setAccessToken(userState.accessToken);
        setUserName(userState.userName);
        setUserAvatarUrl(userState.userAvatarUrl);
      }}
    />;
  } else {
    return <main><p>loading ...</p></main>;
  }
};

ready(async () => {
  ReactDOM.render(
    <OptionsApp />,
    document.getElementById("app"),
  );
});
