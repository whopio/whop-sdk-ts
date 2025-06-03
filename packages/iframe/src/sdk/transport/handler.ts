import type { z } from "zod";
import {
	type ServerImplementation,
	type ValidZodEventSchema,
	createSDK,
} from "./sdk";

export function createHandler<
	Schema extends ValidZodEventSchema,
	ForceCompleteness extends boolean = false,
>({
	schema,
	forceCompleteness,
	handlers,
}: {
	schema: Schema;
	forceCompleteness?: ForceCompleteness;
	handlers: Schema extends ValidZodEventSchema
		? ServerImplementation<Schema, ForceCompleteness>
		: undefined;
}) {
	let eventHandler: (
		event: string,
		data: unknown,
	) => Promise<
		| (Schema extends ValidZodEventSchema
				? z.TypeOf<Schema>["response"]
				: undefined)
		| undefined
	>;

	createSDK<undefined, Schema, ForceCompleteness, false>({
		clientSchema: undefined,
		serverSchema: schema,
		localAppId: "client",
		remoteAppId: "server",
		forceCompleteness,
		serverImplementation: handlers,
		transport: {
			send() {
				// empty, only handling incoming events
			},
			recv(handler) {
				eventHandler = handler;
			},
		},
	});

	return (event: string, data: unknown) => {
		return eventHandler(`server:${event}`, data);
	};
}
