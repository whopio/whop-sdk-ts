import type { DiscoverViewProps } from "@whop/react-native";
import { ScrollView, Text } from "react-native";

export function DiscoverView(props: DiscoverViewProps) {
	return (
		<ScrollView>
			<Text>Hello World! (DiscoverView)</Text>
			<Text>currentUserId: {props.currentUserId}</Text>
			<Text>path: /{props.path.join("/")}</Text>
		</ScrollView>
	);
}
