import type { ThemeProps } from "frosted-ui/theme";
import React from "react";
import { Theme } from "../components";
import {
	WhopIframeSdkProvider,
	type WhopIframeSdkProviderOptions,
} from "../iframe";
import { WhopThemeScript } from "../theme";

export function WhopApp({
	children,
	sdkOptions,
	...themeProps
}: ThemeProps & {
	sdkOptions?: WhopIframeSdkProviderOptions;
}) {
	return (
		<>
			<WhopThemeScript />
			<WhopIframeSdkProvider options={sdkOptions}>
				<Theme {...themeProps}>{children}</Theme>
			</WhopIframeSdkProvider>
		</>
	);
}
