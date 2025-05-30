import ExperienceLayoutClient from "./layout.client";

export default function ExperienceLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ experienceId: string }>;
}) {
	return (
		<div className="max-w-7xl mx-auto p-6 space-y-8">
			<ExperienceLayoutClient params={params}>
				{children}
			</ExperienceLayoutClient>
		</div>
	);
}
