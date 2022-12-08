import { WhopSDK } from "@whop-sdk/core/browser";
import { logMembers } from "./lib/test";

const middleware = async () => {
  await logMembers(
    new WhopSDK({
      TOKEN: process.env.WHOP_BOT_TOKEN,
    }).members
  );
};

export default middleware;

export const config = {
  matcher: ["/"],
};
