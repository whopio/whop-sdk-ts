import type { DashboardViewProps } from "@whop/react-native";
import { ScrollView, Text } from "react-native";

export function DashboardView(props: DashboardViewProps) {
	return (
		<ScrollView>
			<Text>Hello World! (DashboardView)</Text>
			<Text>companyId: {props.companyId}</Text>
			<Text>currentUserId: {props.currentUserId}</Text>
			<Text>path: /{props.path.join("/")}</Text>
		</ScrollView>
	);
}
