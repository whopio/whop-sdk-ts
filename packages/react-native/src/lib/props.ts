interface BaseViewProps {
	currentUserId: string | undefined | null;
	restPath: string | undefined | null;
}

export interface ExperienceViewProps extends BaseViewProps {
	experienceId: string;
	companyId: string;
}

export interface DiscoverViewProps extends BaseViewProps {}
