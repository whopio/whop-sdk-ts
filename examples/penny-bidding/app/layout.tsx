import {
	WhopIframeSdkProvider,
	type WhopIframeSdkProviderOptions,
	WhopThemeScript,
} from "@whop/react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Whop App",
	description: "My Whop App",
};

const iframeSdkOptions: WhopIframeSdkProviderOptions = {
	appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "app_xxx",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<WhopThemeScript />
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<WhopIframeSdkProvider options={iframeSdkOptions}>
					{children}
				</WhopIframeSdkProvider>
			</body>
		</html>
	);
}
