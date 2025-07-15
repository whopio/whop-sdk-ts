import { type TurboModule, TurboModuleRegistry } from "react-native";

interface NativeWhopCoreSpec extends TurboModule {
	getConstants(): {
		apiHost: string;
	};
}

export const NativeWhopCore =
	TurboModuleRegistry.getEnforcing<NativeWhopCoreSpec>("NativeWhopCore");
