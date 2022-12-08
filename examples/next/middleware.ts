import { WhopSDK } from "@whop-sdk/core/browser";

const middleware = async () => {
  console.log(
    await new WhopSDK({
      TOKEN: process.env.WHOP_BOT_TOKEN,
    }).members.listMembers({
      whopCompany: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!,
    })
  );
};

export default middleware;

export const config = {
  matcher: ["/"],
};
