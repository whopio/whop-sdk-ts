# @whop/iframe

Official SDK to power communications of a Whop embedded app and the host frame. Use this for native js implementations for Whop Apps. If you are using react we recommend the usage of `@whop/react` instead.

## Setup

```ts lib/iframe-sdk.ts
// lib/iframe-sdk.ts
import { createSdk } from "@whop/iframe";

export const iframeSdk = createSdk({
	appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
});
```

## Usage

Now you can import your iframeSdk instance and use it to react to user events

```ts index.ts
// index.ts
import { iframeSdk } from "@/lib/iframe-sdk";

const navigationButtonElement = document.querySelector("button");

if (navigationButtonElement && navigationButtonElement.dataset.listenerAttached !== "true") {
	navigationButtonElement.addEventListener("click", () => {
		iframeSdk.openExternalUrl({ url: "https://example.com" });
	});
	
	navigationButtonElement.dataset.listenerAttached = "true";
}
```
