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

This component can be used to embed whop checkout in your react app:

```tsx
import { WhopCheckoutEmbed, useCheckoutEmbedControls } from "@whop/react/checkout";

export default function Home() {
	const ref = useCheckoutEmbedControls(); // this is optional and only needed if you need to programmatically control the embed
	return (
		<WhopCheckoutEmbed
			/**
			 * **Required** - The plan id you want to checkout.
			 */
			planId="plan_XXXXXXXXX"
         /**
          * **Optional** - A ref to the embed controls.
          *
          * This can be used to submit the checkout form.
          */
         ref={ref}
			/**
			 * **Optional** - The theme you want to use for the checkout.
			 *
			 * Possible values are `light`, `dark` or `system`.
			 */
			theme="light"
			/**
			 * **Optional** - The session id to use for the checkout.
			 *
			 * This can be used to attach metadata to a checkout by first creating a session through the API and then passing the session id to the checkout element.
			 */
			sessionId="ch_XXXXXXXXX"
			/**
			 * **Optional** - Turn on to hide the price in the embedded checkout form.
			 *
			 * @default false
			 */
			hidePrice={false}
			/**
			 * **Optional** - Set to `true` to hide the terms and conditions in the embedded checkout form.
			 *
			 * @default false
			 */
			hideTermsAndConditions={false}
			/**
			 * **Optional** - Set to `true` to skip the final redirect and keep the top frame loaded.
			 *
			 * @default false
			*/
			skipRedirect={false}
			/**
			 * **Optional** - A callback function that will be called when the checkout is complete.
			 */
			onComplete={(
				/** The plan id of the plan that was purchased. */
				plan_id: string,
				/** The receipt id of the purchase. */
				receipt_id?: string,
			) => {}}
			/**
			 * **Optional** - A callback function that will be called when the checkout state changes.
			 */
			onStateChange={(state) => {}}
			/**
			 * **Optional** - The fallback content to show while the checkout is loading.
			 */
			fallback={<>loading...</>}
			/**
			 * **Optional** - The UTM parameters to add to the checkout URL.
			 *
			 * **Note** - The keys must start with `utm_`
			 */
			utm={{ utm_campaign: "ad_XXXXXXX" }}
			/**
			 * **Optional** - The styles to apply to the checkout embed.
			 */
			styles={{ container: { paddingTop: 50 }}}
			/**
			 * **Optional** - The prefill options to apply to the checkout embed.
			 * 
			 * Used to prefill the email in the embedded checkout form. 
			 * This setting can be helpful when integrating the embed into a funnel that collects the email prior to payment already.
			 */
			prefill={{ email: "example@domain.com" }}
			/**
			 * **Optional** - The theme options to apply to the checkout embed.
			 */
			themeOptions={{ accentColor: "green" }}
			/**
			 * **Optional** - Set to `true` to hide the email input in the embedded checkout form.
			 *
			 * @default false
			 */
			hideEmail={false}
			/**
			 * **Optional** - Set to `true` to disable the email input in the embedded checkout form.
			 *
			 * @default false
			 */
			disableEmail={false}
		/>
	);
}
```

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
