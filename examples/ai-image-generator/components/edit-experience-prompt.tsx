"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EditExperiencePage({
	experienceId,
}: {
	experienceId: string;
}) {
	const router = useRouter();
	const [prompt, setPrompt] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const response = await fetch(`/api/experiences/${experienceId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ prompt }),
			});

			if (!response.ok) {
				throw new Error("Failed to update experience");
			}

			router.push(`/experiences/${experienceId}`);
			router.refresh();
		} catch (error) {
			console.error("Error updating experience:", error);
			// You might want to show an error message to the user here
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto p-6">
			<h1 className="text-2xl font-bold mb-6">Edit Prompt</h1>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="prompt"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						Prompt
					</label>
					<textarea
						id="prompt"
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Enter a new prompt here..."
						required
					/>
				</div>

				<div className="flex gap-4">
					<Button
						type="submit"
						disabled={isLoading}
						className="bg-blue-500 hover:bg-blue-600 text-white"
					>
						{isLoading ? "Saving..." : "Save Changes"}
					</Button>

					<Button
						type="button"
						variant="outline"
						onClick={() => router.back()}
						disabled={isLoading}
					>
						Cancel
					</Button>
				</div>
			</form>
		</div>
	);
}
