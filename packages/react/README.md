# @whop/react

Whop Apps react SDK helps you get started with Whop Apps and react. It offers easy entry points into many features.

## Setup

> Mount both the `WhopThemeScript` as well as the `WhopIframeSdkProvider` in your root layout

```tsx app/layout.ts
import { WhopThemeScript, WhopIframeSdkProvider } from "@whop/react";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<WhopThemeScript />
			</head>
			<body>
				<WhopIframeSdkProvider>{children}</WhopIframeSdkProvider>
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
