import type { AppValidScopes } from "@/codegen/graphql/server";

/**
 * The authorization tokens returned from the Whop OAuth2 API.
 */
export interface WhopOAuthTokens {
	/**
	 * The primary access token for the user.
	 */
	access_token: string;
	/**
	 * The number of seconds until the access token expires.
	 */
	expires_in: number;
	/**
	 * The timestamp of when the access token was created (in s).
	 */
	created_at: number;
}

/**
 * The OAuth2 class is used to interact with the Whop OAuth2 API.
 *
 * @see https://dev.whop.com/features/oauth-guide
 */
export class WhopOAuth {
	public static readonly OAUTH_URL = "https://whop.com/oauth/";

	constructor(
		/**
		 * Your Whop app id. This can be found in your developer dashboard
		 *
		 * @see https://whop.com/dashboard/developer/
		 */
		private readonly appId: string,
		/**
		 * Your Whop app api key. This can be found in your developer dashboard
		 *
		 * @see https://whop.com/dashboard/developer/
		 */
		private readonly appApiKey: string,
		/**
		 * **optional** - The origin of the Whop API. This is used to make API requests to the Whop API.
		 *
		 * @default https://api.whop.com
		 */
		private readonly apiOrigin = "https://api.whop.com",
	) {}

	/**
	 * Get an authorization url to start the OAuth2 flow.
	 *
	 * ```ts
	 * const { url, state } = whopOAuth.getAuthorizationUrl({
	 * 	redirectUri: "http://localhost:3000/api/oauth/callback",
	 * 	scope: ["read_user"],
	 * })
	 * ```
	 */
	public getAuthorizationUrl({
		state = crypto.randomUUID(),
		redirectUri,
		scope = ["read_user"],
	}: {
		/**
		 * The state to be used in the OAuth2 flow. This is used to prevent CSRF attacks.
		 *
		 * **optional** - defaults to a random uuid
		 */
		state?: string;
		/**
		 * The redirect uri to be used in the OAuth2 flow. This is used to redirect the user back to your app after authorization.
		 *
		 * **NOTE** - the redirect uri you are using here must be defined in your app's settings in the developer dashboard.
		 *
		 * @see https://whop.com/dashboard/developer/
		 */
		redirectUri: string | URL;
		/**
		 * The scopes to be used in the OAuth2 flow. This is used to request permissions from the user.
		 *
		 * @see https://dev.whop.com/api-reference/graphql/scopes
		 */
		scope?: AppValidScopes[];
	}): {
		/**
		 * The url to redirect the user to for authorization
		 */
		url: string;
		/**
		 * The state to be used in the OAuth2 flow. This is used to prevent CSRF attacks.
		 */
		state: string;
	} {
		const oAuthUrl = new URL(WhopOAuth.OAUTH_URL);

		oAuthUrl.searchParams.set("client_id", this.appId);
		oAuthUrl.searchParams.set("response_type", "code");
		oAuthUrl.searchParams.set("scope", scope.join(" "));
		oAuthUrl.searchParams.set("state", state);

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

	/**
	 * Exchange a code for a token.
	 *
	 * ```ts
	 * const authResponse = await whopOAuth.exchangeCode({
	 * 	code: "1234",
	 * 	redirectUri: "http://localhost:3000/api/oauth/callback",
	 * })
	 *
	 * if (!authResponse.ok) {
	 * 	throw new Error(`Failed to exchange code for token. Status: ${authResponse.code}`);
	 * }
	 *
	 * const { access_token } = authResponse.tokens;
	 * ```
	 */
	public async exchangeCode({
		code,
		redirectUri,
	}: {
		/**
		 * The code you received when the user was redirected back to your app.
		 */
		code: string;
		/**
		 * The redirect uri you used when getting the authorization url.
		 *
		 * **NOTE** - this must be the same as the redirect uri you used when getting the authorization url.
		 */
		redirectUri: string | URL;
	}): Promise<
		| {
				ok: true;
				/**
				 * The authorization token you received from the user to make request to the Whop API
				 */
				tokens: WhopOAuthTokens;
		  }
		| {
				ok: false;
				/**
				 * The status code of the response
				 */
				code: number;
				/**
				 * The raw response from the Whop API
				 */
				raw: Response;
		  }
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
