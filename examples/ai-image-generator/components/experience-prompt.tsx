import type { AccessLevel } from "@whop/api";
import Link from "next/link";
import ImageUploader from "./image-uploader";
import { Button } from "./ui/button";

export default function ExperiencePrompt({
	prompt,
	accessLevel,
	experienceId,
}: {
	prompt: string;
	accessLevel: AccessLevel;
	experienceId: string;
}) {
	return (
		<div>
			<div className="flex justify-center items-center">
				<div className="text-4xl font-bold text-center">
					{prompt ? `"${prompt}"` : "Creator has not set a prompt yet."}
				</div>
			</div>
			{accessLevel === "admin" && (
				<div className="flex justify-center items-center">
					<Link href={`/experiences/${experienceId}/edit`}>
						<Button variant={"link"}>Edit prompt</Button>
					</Link>
				</div>
			)}
			{prompt ? <ImageUploader experienceId={experienceId} /> : null}
		</div>
	);
}
