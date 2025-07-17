interface BaseViewProps {
	currentUserId: string | undefined | null;
	path: string[];
	params: Record<string, string>;
}

export interface ExperienceViewProps extends BaseViewProps {
	experienceId: string;
	companyId: string;
}

export interface DiscoverViewProps extends BaseViewProps {}
