import React from "react";

import { script } from "./script";

/**
 * This component is used to inject the Whop theme script into the page. Include this in your root layout before your
 * body tag to ensure no flash of unstyled content.
 * @returns The Whop theme script.
 */
export function WhopThemeScript() {
	const scriptString = `(${script.toString()})()`;
	return (
		<>
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: scriptString is from a trusted source */}
			<script dangerouslySetInnerHTML={{ __html: scriptString }} />
		</>
	);
}
