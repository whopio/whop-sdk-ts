"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
	children,
}: {
	children: React.ReactNode;
}) {
	const { pending } = useFormStatus();
	return (
		<button
			className="shrink-0 bg-blue-500 text-white rounded-md p-2"
			type="submit"
			disabled={pending}
		>
			{pending ? (
				<div className="flex items-center w-full justify-center gap-3">
					<div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
					<span>Processing...</span>
				</div>
			) : (
				children
			)}
		</button>
	);
}
