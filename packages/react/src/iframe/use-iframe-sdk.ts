import type { WhopIframeSdk } from "@whop/iframe";
import { use } from "react";
import { WhopIframeSdkContext } from "./context";

export function useIframeSdk(): WhopIframeSdk {
	const sdk = use(WhopIframeSdkContext);

	if (!sdk) {
		throw new Error("useIframeSdk must be used within a WhopIframeSdkProvider");
	}

	return sdk;
}
