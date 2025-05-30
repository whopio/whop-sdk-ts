"use client";

import { requestPayment } from "@/lib/actions/request-payment";
import { iframeSdk } from "@/lib/iframe-sdk";
import { use, useState } from "react";
import { SubmitButton } from "./submit-button";

export function SectionRequestAPayment({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = use(params);
	const [receiptId, setReceiptId] = useState<string>();
	const [error, setError] = useState<string>();

	return (
		<div>
			<form
				action={async (data) => {
					const payment = await requestPayment(data);

					if (payment) {
						const res = await iframeSdk.inAppPurchase(payment);

						if (res.status === "ok") {
							setReceiptId(res.data.receipt_id);
							setError(undefined);
						} else {
							setReceiptId(undefined);
							setError(res.error);
						}
					}
				}}
				className="flex flex-col gap-4"
			>
				<input type="hidden" name="experienceId" value={experienceId} />
				<div className="flex gap-2 items-center">
					<input
						className="w-full border border-gray-300 rounded-md p-2"
						type="number"
						required
						name="amount"
						placeholder="Amount (in USD) to charge"
					/>
				</div>
				<div className="flex gap-2 items-center">
					<input
						className="w-full border border-gray-300 rounded-md p-2"
						type="text"
						required
						name="description"
						placeholder="Payment Description"
					/>
				</div>
				<SubmitButton>Request Payment</SubmitButton>

				{receiptId && (
					<div>
						<p>Receipt ID: {receiptId}</p>
					</div>
				)}

				{error && (
					<div>
						<p>Error: {error}</p>
					</div>
				)}
			</form>
		</div>
	);
}
