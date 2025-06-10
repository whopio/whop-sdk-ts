import { Badge } from "@whop/react/components";
import { type PropsWithChildren, Suspense } from "react";
import { ErrorBoundary } from "./error-boundary";

export function SectionWrapper({
	children,
	title,
	description,
	index,
}: PropsWithChildren<{ title: string; description: string; index: number }>) {
	return (
		<div className="flex flex-col gap-2 border border-gray-a5 p-4 rounded-lg bg-panel-elevation-a1">
			<div className="flex gap-2 items-center">
				<Badge>{index}</Badge>
				<h2 className="text-2xl font-bold">{title}</h2>
			</div>
			<p className="text-sm text-gray-500">{description}</p>
			<ErrorBoundary>
				<Suspense fallback={<LoadingFallback />}>{children}</Suspense>
			</ErrorBoundary>
		</div>
	);
}

function LoadingFallback() {
	return <div>Loading...</div>;
}
