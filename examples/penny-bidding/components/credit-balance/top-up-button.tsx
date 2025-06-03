"use client";

import { Button } from "@/components/ui/button";
import { requestTopup } from "@/lib/actions/request-topup";
import { useMutation } from "@tanstack/react-query";
import { useIframeSdk } from "@whop/react";

export function TopUpButton({ experienceId }: { experienceId: string }) {
	const whopIframe = useIframeSdk();
	const { mutate, isPending } = useMutation({
		mutationKey: ["top-up"],
		mutationFn: async () => {
			const checkoutSession = await requestTopup(experienceId);
			if (!checkoutSession) return;
			await whopIframe.inAppPurchase(checkoutSession);
		},
	});

	return (
		<Button
			variant="default"
			onClick={() => mutate()}
			disabled={isPending}
			className="h-8"
		>
			{isPending ? "Topping Up..." : "Top Up"}
		</Button>
	);
}
