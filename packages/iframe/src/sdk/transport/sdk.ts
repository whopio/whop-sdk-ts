import type {
	ZodDiscriminatedUnion,
	ZodLiteral,
	ZodObject,
	ZodRawShape,
	ZodTypeAny,
	z,
} from "zod";
import { TimeoutError, randomId } from "./utils";

export type ValidZodEventSchema = ZodDiscriminatedUnion<
	"event",
	ZodObject<
		{
			event: ZodLiteral<string>;
			request: ZodTypeAny;
			response: ZodTypeAny;
		} & ZodRawShape
	>[]
>;

type MaybePromise<T> = Promise<T> | T;

type T = z.infer<ValidZodEventSchema>;

type FullServerImplementation<Schema extends ValidZodEventSchema> = {
	[K in NonNullable<z.infer<Schema>["event"]>]: (
		request: Extract<z.infer<Schema>, { event: K }>["request"],
	) => MaybePromise<Extract<z.infer<Schema>, { event: K }>["response"]>;
};

export type ClientSDK<
	ClientSchema extends ValidZodEventSchema,
	Complete extends boolean,
> = {
	[K in NonNullable<z.infer<ClientSchema>["event"]>]: (
		req: Extract<z.infer<ClientSchema>, { event: K }>["request"],
	) => Promise<
		Complete extends true
			? Extract<z.infer<ClientSchema>, { event: K }>["response"]
			: Extract<z.infer<ClientSchema>, { event: K }>["response"] | undefined
	>;
};

export type ServerImplementation<
	Schema extends ValidZodEventSchema,
	ForceCompleteness extends boolean = false,
> = ForceCompleteness extends true
	? FullServerImplementation<Schema>
	: Partial<FullServerImplementation<Schema>>;

type FullServerMiddlewareImplementation<
	Schema extends ValidZodEventSchema,
	ForceCompleteness extends boolean = false,
> = {
	[K in NonNullable<z.infer<Schema>["event"]>]: (
		request: Extract<z.infer<Schema>, { event: K }>["request"],
		next: ForceCompleteness extends true
			? (
					request: Extract<z.infer<Schema>, { event: K }>["request"],
				) => MaybePromise<Extract<z.infer<Schema>, { event: K }>["response"]>
			:
					| ((
							request: Extract<z.infer<Schema>, { event: K }>["request"],
					  ) => MaybePromise<
							Extract<z.infer<Schema>, { event: K }>["response"]
					  >)
					| undefined,
	) => MaybePromise<
		ForceCompleteness extends true
			? Extract<z.infer<Schema>, { event: K }>["response"]
			: Extract<z.infer<Schema>, { event: K }>["response"] | undefined
	>;
};
export type ServerMiddleware<
	Schema extends ValidZodEventSchema,
	ForceCompleteness extends boolean = false,
> = Partial<FullServerMiddlewareImplementation<Schema, ForceCompleteness>>;

export type Transport<ServerSchema extends ValidZodEventSchema | undefined> = {
	send: (
		event: string,
		data: unknown,
		params: { localAppId: string; remoteAppId: string },
	) => unknown;
	recv: (
		handler: (
			event: string,
			data: unknown,
		) => Promise<
			| (ServerSchema extends ValidZodEventSchema
					? z.infer<ServerSchema>["response"]
					: undefined)
			| undefined
		>,
		params: { localAppId: string; remoteAppId: string },
		// biome-ignore lint/suspicious/noConfusingVoidType: idk
	) => void | (() => void);
	cleanup?: () => void;
};

export function createSDK<
	ClientSchema extends ValidZodEventSchema | undefined,
	ServerSchema extends ValidZodEventSchema | undefined,
	ForceCompleteness extends boolean = false,
	ServerComplete extends boolean = false,
>({
	clientSchema,
	serverSchema,
	serverComplete,
	transport,
	timeout = 1000,
	timeouts,
	localAppId,
	remoteAppId,
	serverImplementation = {},
	serverMiddleware,
}: {
	clientSchema: ClientSchema;
	serverSchema: ServerSchema;
	forceCompleteness?: ForceCompleteness;
	serverComplete?: ServerComplete;
	localAppId: string;
	remoteAppId: string;
	serverMiddleware?: ServerSchema extends ValidZodEventSchema
		? ServerMiddleware<ServerSchema, ForceCompleteness>[]
		: undefined;
	serverImplementation: ServerSchema extends ValidZodEventSchema
		? ServerImplementation<ServerSchema, ForceCompleteness>
		: undefined;
	transport: Transport<ServerSchema>;
	timeout?: number;
	timeouts?: ClientSchema extends ValidZodEventSchema
		? {
				[K in NonNullable<z.infer<ClientSchema>["event"]>]?: number;
			}
		: never;
}): (ClientSchema extends ValidZodEventSchema
	? ClientSDK<ClientSchema, ServerComplete>
	: object) & {
	_cleanupTransport: () => void;
} {
	const callbacks: {
		id: string;
		resolve: (data: unknown) => void;
	}[] = [];

	const keys =
		clientSchema?.options.map(
			(option) => option._def.shape().event._def.value,
		) ?? [];

	const client = Object.fromEntries(
		keys.map((key) => [
			key,
			async (req: unknown) => {
				// We make event id unique so that we can fire many requests at the same time.
				const eventId = `${localAppId}:${key}:${randomId(8)}`;

				console.debug("[typed-transport] app. Created eventId", eventId);

				const responseData = new Promise((resolve, reject) => {
					// Timeout the request after the specified timeout
					const customTimeout = timeouts?.[key];

					const timeoutId = setTimeout(() => {
						const index = callbacks.findIndex((cb) => cb.id === eventId);
						if (index !== -1) callbacks.splice(index, 1);
						if (serverComplete) {
							console.debug("[typed-transport] app. Timeout error");
							reject(new TimeoutError());
						} else resolve(undefined);
					}, customTimeout ?? timeout);

					if (customTimeout && customTimeout > timeout && !serverComplete) {
						const timeoutId = setTimeout(() => {
							const index = callbacks.findIndex((cb) => cb.id === eventId);
							if (index !== -1) callbacks.splice(index, 1);
							resolve(undefined);
						}, timeout);
						callbacks.push({
							id: `${eventId}:processing`,
							resolve: () => clearTimeout(timeoutId),
						});
					}

					callbacks.push({
						id: eventId,
						resolve: (data) => {
							clearTimeout(timeoutId);
							resolve(data);
						},
					});
				});

				console.debug("[typed-transport] app sending event", {
					eventId,
					localAppId,
					remoteAppId,
				});
				await transport.send?.(eventId, req, { localAppId, remoteAppId });

				const data = await responseData;

				console.debug("[typed-transport] received response", data);

				return data;
			},
		]),
	) as (ClientSchema extends ValidZodEventSchema
		? ClientSDK<ClientSchema, ServerComplete>
		: object) & {
		_cleanupTransport: () => void;
	};

	const cleanupRecv = transport.recv(
		async (event, dataAny) => {
			const [app, key, _randomId, type] = event.split(":");
			if (app === localAppId) {
				// Here we are receiving a response from a request we made.
				const idx = callbacks.findIndex((cb) => cb.id === event);
				if (idx === -1) return;
				const dataSchema = clientSchema?.optionsMap.get(key);
				if (!dataSchema) return;
				const cb = callbacks[idx];
				if (type === "processing") {
					cb.resolve(undefined);
				} else {
					const data = dataSchema.shape.response.parse(dataAny);
					callbacks.splice(idx, 1);
					cb.resolve(data);
				}
			} else if (app === remoteAppId) {
				if (serverImplementation === undefined) return;
				// Here we are responding to a request from a client.

				// final handler
				let handler = (
					serverImplementation as unknown as Record<
						string,
						(data: unknown) => Promise<unknown>
					>
				)[key];

				// Build a linked list of middleware invocations that will call the final handler.
				if (serverMiddleware) {
					for (let i = serverMiddleware.length - 1; i >= 0; i--) {
						const middlewareDef = serverMiddleware[i];
						const middleware = middlewareDef[key] as (
							data: unknown,
							next: unknown,
						) => Promise<unknown>;
						if (!middleware) continue;
						const ref = handler;
						handler = (data: unknown) => middleware(data, ref);
					}
				}

				if (!handler) return;
				const dataSchema = serverSchema?.optionsMap.get(key);
				if (!dataSchema) return;
				const data = dataSchema.shape.request.parse(dataAny);

				// If our handler doesn't complete in 80% of the default message timeout, we send a message to the caller, saying that we are expecting an answer.
				const timeoutId = setTimeout(async () => {
					await transport.send(
						`${event}:processing`,
						{},
						{ localAppId, remoteAppId },
					);
				}, 50);

				const response = await handler(data);

				clearTimeout(timeoutId);

				await transport.send(event, response, { localAppId, remoteAppId });
				// biome-ignore lint/suspicious/noExplicitAny: will fix at some point
				return response as any;
			}
		},
		{
			localAppId,
			remoteAppId,
		},
	);

	const cleanupFunctions: (() => void)[] = [];
	if (transport.cleanup) cleanupFunctions.push(transport.cleanup);
	if (cleanupRecv) cleanupFunctions.push(cleanupRecv);

	client._cleanupTransport = () => {
		for (const fn of cleanupFunctions) fn();
	};

	return client;
}
