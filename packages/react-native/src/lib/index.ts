import { WhopClientSdk } from "@whop/api";
import { NativeWhopCore } from "./native-whop-core";

interface BaseViewProps {
	currentUserId: string | undefined | null;
	restPath: string | undefined | null;
}

export interface ExperienceViewProps extends BaseViewProps {
	experienceId: string;
	companyId: string;
}

export interface DiscoverViewProps extends BaseViewProps {}

export const whopSdk: WhopClientSdk = WhopClientSdk({
	apiOrigin: `https://${NativeWhopCore.getConstants().apiHost}`,
	apiPath: "/_whop/public-graphql/",
});
