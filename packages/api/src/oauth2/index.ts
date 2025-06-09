import type { AppValidScopes } from "@/codegen/graphql";

export interface WhopOAuth2Tokens {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	created_at: number;
}

export class WhopOAuth2 {
	public static readonly OAUTH_URL = "https://whop.com/oauth/";

	constructor(
		private readonly appId: string,
		private readonly appApiKey: string,
		private readonly apiOrigin = "https://api.whop.com",
	) {}

	public getAuthorizationUrl({
		state = crypto.randomUUID(),
		redirectUri,
		scope = ["read_user"],
	}: {
		state?: string;
		redirectUri: string | URL;
		scope?: AppValidScopes[];
	}): { url: string; state: string } {
		const oAuthUrl = new URL(WhopOAuth2.OAUTH_URL);

		oAuthUrl.searchParams.set("client_id", this.appId);
		oAuthUrl.searchParams.set("response_type", "code");
		oAuthUrl.searchParams.set("scope", scope.join(" "));

		if (redirectUri instanceof URL) {
			oAuthUrl.searchParams.set("redirect_uri", redirectUri.toString());
		} else {
			oAuthUrl.searchParams.set("redirect_uri", redirectUri);
		}

		return {
			url: oAuthUrl.toString(),
			state,
		};
	}

	public async exchangeCode({
		code,
		redirectUri,
	}: {
		code: string;
		redirectUri: string | URL;
	}): Promise<
		| { ok: true; tokens: WhopOAuth2Tokens }
		| { ok: false; code: number; raw: Response }
	> {
		const resolvedRedirectUri =
			redirectUri instanceof URL ? redirectUri.toString() : redirectUri;

		const tokensEndpoint = new URL("/api/oauth/token", this.apiOrigin);
		const tokensResponse = await fetch(tokensEndpoint, {
			method: "POST",
			body: JSON.stringify({
				code,
				client_id: this.appId,
				client_secret: this.appApiKey,
				grant_type: "authorization_code",
				redirect_uri: resolvedRedirectUri,
			}),
			headers: {
				"content-type": "application/json",
				"cache-control": "no-cache",
				pragma: "no-cache",
			},
			cache: "no-store",
		});

		if (!tokensResponse.ok) {
			return {
				ok: false,
				code: tokensResponse.status,
				raw: tokensResponse,
			};
		}

		const tokens = await tokensResponse.json();

		return {
			ok: true,
			tokens,
		};
	}
}
