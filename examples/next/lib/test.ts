import type { MembersService } from "@whop-sdk/core/node/services/MembersService";

export const logMembers = async (sdk: MembersService) => {
  await sdk.listMembers({
    whopCompany: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!,
  });
};
