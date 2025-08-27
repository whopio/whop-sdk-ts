# @whop/react

Whop Apps react SDK helps you get started with Whop Apps and react. It offers easy entry points into many features.

## Setup

> Mount the `WhopApp` provider at the highest possible level. The `WhopApp` provider handles mounting the `WhopThemeScript`, `WhopIframeSdkProvider` and `Theme` components.

```tsx app/layout.ts
import { WhopApp } from "@whop/react";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<WhopApp>{children}</WhopApp>
			</body>
		</html>
	);
}
```

## Hooks

### useIframeSdk

Hook to get access to the current `WhopIframeSdk` instance

> This requires a `WhopIframeSdkProvider` to be mounted

```tsx
import { useIframeSdk } from "@whop/react";

function ExampleComponent() {
	const iframeSdk = useIframeSdk();

	return <button onClick={function handleClick() {
		iframeSdk.openExternalUrl({ url: "https://example.com" })
	}}>Open External URL</button>
}
```

## Components

### WhopApp

One-time setup for all providers and components to build whop apps. This component handles mounting the `WhopThemeScript`, `WhopIframeSdkProvider` and `Theme` components.

```tsx app/layout.ts
import { type WhopIframeSdkProviderOptions } from "@whop/react";
import { WhopApp } from "@whop/react/components";

const options: WhopIframeSdkProviderOptions = {
	// your Whop App ID, defaults to process.env.NEXT_PUBLIC_WHOP_APP_ID
	appId: process.env.WHOP_APP_ID,
};

export default function RootLayout() {
	return (
		<html>
			<WhopApp sdkOptions={options}>{children}</WhopApp>
		</html>
	);
}
```

### WhopThemeScript

The `WhopThemeScript` component provides a simple script that ensures your page is loading in the same theme as the main whop.com host is loaded in. It will update the documentElement to add a `dark` class name for dark mode and will skip adding anything for light mode.

To ensure no flash of unstyled content happens you need to mount this script as far up the html tree as possible and execute it before any elements are rendered into the DOM.

```tsx app/layout.ts
import { WhopThemeScript } from "@whop/react";

export default function RootLayout() {
	return (
		<html>
			<head>
				<WhopThemeScript />
			</head>
			{...}
		</html>
	);
}
```

### WhopIframeSdkProvider

The `WhopIframeSdkProvider` is a context provider that initializes and provides and iframe SDK to all child components via the `useIframeSdk` hook.

```tsx app/layout.ts
import { WhopIframeSdkProvider, type WhopIframeSdkProviderOptions } from "@whop/react";

const options: WhopIframeSdkProviderOptions = {
	// your Whop App ID, defaults to process.env.NEXT_PUBLIC_WHOP_APP_ID
	appId: process.env.WHOP_APP_ID,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html>
			<body>
				<WhopIframeSdkProvider options={options}>{children}</WhopIframeSdkProvider>
			</body>
		</html>
	);
}
```

> Note that if you are storing your app ID in `NEXT_PUBLIC_WHOP_APP_ID` you do not need to provide any options to the `WhopIframeSdkProvider`

### WhopCheckoutEmbed

Breaking: The react implementation of the checkout embed is now exported from `@whop/checkout/react` for better react version compatibility.

## React frameworks

### Next.js

#### `withWhopAppConfig`

This package exports a config wrapper for your `next.config.{js,mjs,ts}` file that handles setting up server action allowed origins as well as import optimizations for `@whop/react/components`

```ts
import type { NextConfig } from "next";
import { withWhopAppConfig } from "@whop/react/next.config";

const nextConfig: NextConfig = {
	/* your config options here */
	images: {
		remotePatterns: [{ hostname: "**" }],
	},
};

export default withWhopAppConfig(nextConfig);
```
