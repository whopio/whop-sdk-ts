import { whopSdk } from "@/whop";
import NextAuth from "next-auth";
import { getToken as rawGetToken } from "next-auth/jwt";
import { headers } from "next/headers";

export const { handlers, signIn, signOut, auth } = NextAuth({
	providers: [
		whopSdk.oauth.authJsProvider({
			scope: ["read_user"],
		}),
	],
	callbacks: {
		async jwt({ token, account }) {
			// Store the OAuth access token when user first signs in
			if (account) {
				token.accessToken = account.access_token as string;
				token.refreshToken = account.refresh_token as string;
			}
			return token;
		},
	},
});

export async function getToken() {
	const token = await rawGetToken({
		req: { headers: await headers() },
		secret: process.env.AUTH_SECRET,
	});

	return token;
}
