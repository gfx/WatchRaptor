import { Octokit } from "@octokit/rest";
import { loadUserState } from "./UserState";


export async function updateNotifications() {
  const userState = await loadUserState();

  if (!userState.accessToken) {
    console.log("Skipped updateNotifications because of missing accessToken");
  }

  const rest = new Octokit({
    auth: userState.accessToken,
  });

  const notificationList = await rest.activity.listNotificationsForAuthenticatedUser({
    per_page: 10,
  });

  console.log(notificationList);
}
