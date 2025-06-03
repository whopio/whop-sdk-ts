"use client";

import { createSdk } from "@whop/iframe";
import React, { type PropsWithChildren } from "react";
import { useLazyRef } from "../util/use-lazy-ref";
import { WhopIframeSdkContext } from "./context";

export type WhopIframeSdkProviderOptions = Parameters<typeof createSdk>[0];

export function WhopIframeSdkProvider({
	children,
	options = {},
}: PropsWithChildren<{
	options?: WhopIframeSdkProviderOptions;
}>) {
	const sdk = useLazyRef(() => createSdk(options));

	return (
		<WhopIframeSdkContext value={sdk.current}>{children}</WhopIframeSdkContext>
	);
}
