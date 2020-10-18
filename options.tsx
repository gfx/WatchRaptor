import * as firebase from "firebase/app";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { graphql } from "@octokit/graphql";
import "firebase/auth";

import { firebaseConfig } from "./firebaseConfig";
import { ready } from "./src/ready";
import { loadUserState, saveUserState, UserState } from "./src/UserState";

const onSigninWithGitHubSubmit = () => {
  const provider = new firebase.auth.GithubAuthProvider();
  provider.addScope("notifications");
  firebase.auth().signInWithRedirect(provider);
}

const tryToGetGitHubUser = async (accessToken: string) => {
  const query = `
{
  viewer {
    login
    avatarUrl
  }
}
`;

  try {
    const data = await graphql<{ viewer: any }>(query, {
      headers: {
        authorization: `token ${accessToken}`,
      }
    });
    return [data.viewer, undefined];
  } catch (error) {
    return [undefined, error];
  }
};

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
    <h1>Octracker</h1>
    <section>
      <h2>Sign-In with GitHub (not yet implemented)</h2>
      <p>
        <button disabled onClick={onSigninWithGitHubSubmit}>
          Sign-in with GitHub
      </button>
      </p>
    </section>

    <section>
      <h2>Personal Access Token</h2>
      <p>
        <input type="password"
          value={accessTokenCandidate}
          onChange={async (event) => {
            const token = event.target.value.trim();
            setAccessTokenCandidate(token);

            if (token === "") {
              // reset everything
              onUserStateSet({
                accessToken: "",
                userName: "",
                userAvatarUrl: "",
              });
              return;
            }

            // TODO: lodash.debounce() does not work with async functions
            const [user, error] = await tryToGetGitHubUser(token);

            if (error) {
              setErrorMessage(`${error}`);
            }

            if (user) {
              console.log("Successfully fetched the GitHub user data");

              onUserStateSet({
                accessToken: token,
                userName: user.login,
                userAvatarUrl: user.avatarUrl,
              });
            }
          }} />
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
  firebase.initializeApp(firebaseConfig);

  try {
    const result = await firebase.auth().getRedirectResult();
    if (result.credential) {
      const credential = result.credential as firebase.auth.OAuthCredential;
      const accessToken = credential.accessToken;

      console.log("Successfully sign-in as:", result);
      // FIXME: build UserState and save it
    }
  } catch (error) {
    // FIXME: handle errors
    const errorCode = error.code;
    const errorMessage = error.message;
    console.warn(error);
  }

  ReactDOM.render(
    <OptionsApp />,
    document.getElementById("app"),
  );
});
