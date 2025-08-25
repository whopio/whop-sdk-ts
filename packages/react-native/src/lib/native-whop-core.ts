import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";
import stub from "./native-whop-core-stub";

export type FunctionCallResult = {
	isOk: boolean;
	data: string | null;
	errorMessage: string | null;
};

export interface Spec extends TurboModule {
	execSync(name: string, paramsJson: string): FunctionCallResult;
	execAsync(name: string, paramsJson: string): Promise<FunctionCallResult>;
}

function resolveNative(): Spec | null {
	try {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const registry: any = TurboModuleRegistry as any;
		const get = registry?.getEnforcing ?? registry?.get;
		if (typeof get === "function") {
			return get.call(registry, "NativeWhopCore") as Spec;
		}
		return null;
	} catch {
		return null;
	}
}

const native = resolveNative();

export default native ?? (stub as Spec);
