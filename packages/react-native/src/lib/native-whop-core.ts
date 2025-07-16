import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export type FunctionCallResult = {
	isOk: boolean;
	data: string | null;
	errorMessage: string | null;
};

export interface Spec extends TurboModule {
	execSync(name: string, paramsJson: string): FunctionCallResult;
	execAsync(name: string, paramsJson: string): Promise<FunctionCallResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>("NativeWhopCore");
