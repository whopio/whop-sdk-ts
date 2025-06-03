export const QUERY_KEY = {
	CREDITS: ["credits"] as const,
	LISTINGS: (experienceId: string) => ["listings", experienceId] as const,
	USER: (userId: string | null) => ["user", userId] as const,
};
