"use client";

import { Button } from "@whop/react/components";
import { useFormStatus } from "react-dom";

export function SubmitButton({
	children,
}: {
	children: React.ReactNode;
}) {
	const { pending } = useFormStatus();
	return (
		<Button
			className="shrink-0"
			color="blue"
			variant="solid"
			type="submit"
			loading={pending}
		>
			{pending ? (
				<div className="flex items-center w-full justify-center gap-3">
					<div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
					<span>Processing...</span>
				</div>
			) : (
				children
			)}
		</Button>
	);
}
