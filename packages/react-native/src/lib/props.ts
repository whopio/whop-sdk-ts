export interface PathParams {
	path: string[];
	params: Record<string, string>;
}

interface BaseViewProps extends PathParams {
	currentUserId: string | undefined | null;
}

export interface ExperienceViewProps extends BaseViewProps {
	experienceId: string;
	companyId: string;
}

export interface DiscoverViewProps extends BaseViewProps {}
