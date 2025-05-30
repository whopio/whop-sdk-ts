import { eq } from "drizzle-orm";
import { db } from "../db";
import { userCreditsTable } from "../db/schema";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function appendCredits(
	userId: string,
	creditsToAdd: number,
	tx: Transaction,
) {
	const credits = await db.transaction(async (tx) => {
		const [existingCredits] = await tx
			.select()
			.from(userCreditsTable)
			.where(eq(userCreditsTable.userId, userId));

		if (existingCredits) {
			const [updatedCredits] = await tx
				.update(userCreditsTable)
				.set({
					credits: existingCredits.credits + creditsToAdd,
				})
				.where(eq(userCreditsTable.userId, userId))
				.returning();

			if (!updatedCredits) throw new Error("Failed to update credits");
			return updatedCredits;
		}
		const [newCredits] = await tx
			.insert(userCreditsTable)
			.values({
				userId,
				credits: creditsToAdd,
			})
			.returning();
		if (!newCredits) throw new Error("Failed to create credits");
		return newCredits;
	});
	return credits;
}
