"use client";

import { useIframeSdk } from "@whop/react";
import { useCallback } from "react";

export function OpenWhopUserProfile({ username }: { username: string }) {
	const sdk = useIframeSdk();

	const openCallback = useCallback(() => {
		sdk.openExternalUrl({ url: `https://whop.com/@${username}` });
	}, [sdk, username]);

	return (
		<button
			type="button"
			className="text-gray-800 bg-blue-300 px-2 py-0 rounded-md hover:bg-blue-400"
			onClick={openCallback}
		>
			Open Whop User Profile Modal
		</button>
	);
}
