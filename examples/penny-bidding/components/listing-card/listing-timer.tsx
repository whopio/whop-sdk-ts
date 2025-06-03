"use client";

import { useEffect, useState } from "react";

function formatTimeLeft(endDate: Date): string {
	const now = new Date();
	const diff = endDate.getTime() - now.getTime();

	if (diff <= 0) {
		return "00:00:00";
	}

	const hours = Math.floor(diff / (1000 * 60 * 60));
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((diff % (1000 * 60)) / 1000);

	return `${hours.toString().padStart(2, "0")}:${minutes
		.toString()
		.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function ListingTimer({ endsAt }: { endsAt: Date }) {
	const [timeLeft, setTimeLeft] = useState<string>("");

	useEffect(() => {
		const updateTimer = () => {
			const end = new Date(endsAt);
			const now = new Date();

			if (now >= end) {
				setTimeLeft("Expired");
				return;
			}

			setTimeLeft(formatTimeLeft(end));
		};

		// Update immediately
		updateTimer();

		// Then update every second
		const interval = setInterval(updateTimer, 1000);

		// Cleanup on unmount
		return () => clearInterval(interval);
	}, [endsAt]);

	return (
		<span className="text-sm font-medium tabular-nums font-mono">
			{timeLeft}
		</span>
	);
}
