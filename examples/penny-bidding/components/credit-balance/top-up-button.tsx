"use client";

import { Button } from "@/components/ui/button";
import { createFreeCredits } from "@/lib/actions/get-free-credits";
import { requestTopup } from "@/lib/actions/request-topup";
import { whopIframe } from "@/lib/iframe";
import { useMutation } from "@tanstack/react-query";

async function getCredits(experienceId: string) {
	const checkoutSession = await requestTopup(experienceId);
	if (!checkoutSession) return;
	await whopIframe.inAppPurchase({ planId: checkoutSession.planId });
}

export function TopUpButton({
	mode,
	experienceId,
}: { mode: "real" | "fake"; experienceId: string }) {
	const { mutate, isPending } = useMutation({
		mutationKey: ["top-up"],
		mutationFn: () =>
			mode === "real" ? getCredits(experienceId) : createFreeCredits(),
	});

	return (
		<Button
			variant="default"
			onClick={() => mutate()}
			disabled={isPending}
			className="h-8"
		>
			{isPending
				? "Topping Up..."
				: mode === "real"
					? "Top Up"
					: "Get Free Credits"}
		</Button>
	);
}
