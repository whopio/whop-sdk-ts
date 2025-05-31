"use client";

import { useState } from "react";

export function ExperienceOverlay() {
	const [showOverlay, setShowOverlay] = useState(true);
	const [isAnimating, setIsAnimating] = useState(false);

	const handleDismiss = () => {
		setIsAnimating(true);
		setTimeout(() => setShowOverlay(false), 500); // Wait for animation to complete
	};

	if (!showOverlay) return null;

	return (
		<div
			className={`fixed inset-0 z-50 flex items-center justify-center transition-transform duration-500 ease-in-out w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 ${
				isAnimating ? "-translate-y-full" : "translate-y-0"
			}`}
		>
			<div className="text-center max-w-2xl px-4">
				<h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text animate-gradient">
					Penny Bidding
				</h1>
				<p className="text-xl text-gray-300 mb-8">
					The most exciting way to bid on amazing items, one penny at a time! 🎉
				</p>
				<div className="bg-gray-800/50 dark:bg-gray-900/50 p-6 rounded-lg backdrop-blur-sm border border-gray-700/50 mb-8">
					<p className="text-gray-400 text-sm leading-relaxed">
						Here's how it works: Each bid costs 1 credit and increases the price
						by just one cent! The last person to bid before the timer runs out
						wins the item and can purchase it for its current price. You can get
						20 credits by clicking the topup button.
					</p>
				</div>
				<div className="relative group">
					<div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient" />
					<button
						type="button"
						onClick={handleDismiss}
						className="relative w-full px-8 py-4 bg-gray-900 dark:bg-gray-950 rounded-lg leading-none flex items-center justify-center"
					>
						<span className="text-gray-200 font-medium">
							Click to Enter the Bidding Arena!
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}
