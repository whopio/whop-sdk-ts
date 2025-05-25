// "use server"; // ensure that this file is not imported by the client bundle

import { WhopServerSdk, makeUserTokenVerifier } from "@whop/api";

// Initialize the Whop API client with your app's credentials
export const whopApi = WhopServerSdk({
  // Your app's API key - required for all API calls
  appApiKey: process.env.WHOP_API_KEY ?? "fallback",

  // The user ID that will make API calls on behalf of your app
  // This is typically your app's agent user
  onBehalfOfUserId: process.env.WHOP_AGENT_USER_ID,
});

// Create a function to verify user tokens
// This is used to authenticate requests from the Whop iframe
export const verifyUserToken = makeUserTokenVerifier({
  appId: process.env.WHOP_APP_ID ?? "fallback",
  dontThrow: true, // Return null instead of throwing on invalid tokens
});
