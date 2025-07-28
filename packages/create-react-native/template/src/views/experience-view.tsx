import type { ExperienceViewProps } from "@whop/react-native";
import { ScrollView, Text } from "react-native";

export function ExperienceView(props: ExperienceViewProps) {
	return (
		<ScrollView>
			<Text>Hello World! (ExperienceView)</Text>
			<Text>companyId: {props.companyId}</Text>
			<Text>experienceId: {props.experienceId}</Text>
			<Text>currentUserId: {props.currentUserId}</Text>
			<Text>path: /{props.path.join("/")}</Text>
		</ScrollView>
	);
}
