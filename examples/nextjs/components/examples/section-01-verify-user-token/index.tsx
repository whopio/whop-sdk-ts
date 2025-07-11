import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

export async function SectionVerifyUserToken() {
	const requestHeaders = await headers();
	const userTokenData = await whopSdk.verifyUserToken(requestHeaders);

	if (!userTokenData) {
		return <div className="text-danger-12">Invalid or missing user token</div>;
	}

	return (
		<div>
			Validated user id is: <code>{userTokenData?.userId}</code>
		</div>
	);
}
