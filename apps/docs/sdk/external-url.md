---
title: Open External Links
description: Open external links from within the iFrame
---

If you want to open external links from within the iFrame, you can use the `openExternalLinks` function. This will close your app and move to a new website.

## Usage

<Warning>
  This function requires the iFrame SDK to be initialized. See [**iFrame
  Overview**](/sdk/iframe-setup) for more information.
</Warning>

<CodeGroup>
```javascript React
"use client";
import { useIframeSdk } from "@whop/react";

export default function Home() {
	const iframeSdk = useIframeSdk();
	
	function openLink() {
		iframeSdk.openExternalUrl({ url: "https://google.com" });
	}
	
	return <button onClick={openLink}>Click me to open Google</button>;
}
```

```javascript Vanilla JS
import { iframeSdk } from "@/lib/iframe-sdk";

const navigationButtonElement = document.querySelector("button");

if (navigationButtonElement) {
  navigationButtonElement.addEventListener("click", () => {
    iframeSdk.openExternalUrl({ url: "https://google.com" });
  });
}
```

</CodeGroup>

## User Profiles

If you want to display a whop user profile, you can use the `openExternalUrl` method
and pass their profile page link which looks like `https://whop.com/@username`.

The whop app will intercept this and instead display a modal containing their user profile.

<CodeGroup>
```javascript React
"use client";
import { useIframeSdk } from "@whop/react";

export default function Home() {
	const iframeSdk = useIframeSdk();
	
	function openLink() {
		iframeSdk.openExternalUrl({ url: "https://whop.com/@j" });
	}
	
	return <button onClick={openLink}>Click me to open Google</button>;
}
```

```javascript Vanilla JS
import { iframeSdk } from "@/lib/iframe-sdk";

const navigationButtonElement = document.querySelector("button");

if (navigationButtonElement) {
  navigationButtonElement.addEventListener("click", () => {
    iframeSdk.openExternalUrl({ url: "https://whop.com/@j" });
  });
}
```

</CodeGroup>

<Info>
  You can also use a user ID instead of username. The final link should look
  like this: `https://whop.com/@user_XXXXXXXX`
</Info>
