export type UserState = {
  userName: string;
  userAvatarUrl: string;
  accessToken: string;
};

export async function saveUserState(userState: UserState): Promise<void> {
  return new Promise<void>((resolve) => {
    chrome.storage.local.set(userState, () => {
      resolve();
    });
  });
}

export async function loadUserState(): Promise<UserState> {
  return new Promise<UserState>((resolve) => {
    chrome.storage.local.get([
      "userName",
      "userAvatarUrl",
      "accessToken",
    ], (userState: Partial<UserState>) => {
      resolve({
        userName: userState.userName ?? "",
        userAvatarUrl: userState.userAvatarUrl ?? "",
        accessToken: userState.accessToken ?? "",
      });
    })
  });
}
