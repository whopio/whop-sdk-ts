"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function ErrorBoundary({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	return (
		<div className="max-w-md mx-auto p-6">
			<Card className="border-destructive/50">
				<CardHeader className="space-y-1">
					<div className="flex items-center gap-2 text-destructive">
						<AlertCircle className="h-5 w-5" />
						<CardTitle className="text-lg">
							Oops! Something went wrong
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						Looks like our auctioneer tripped over their own feet!
						{error.message.includes("not found")
							? " They couldn't find what you were looking for."
							: " They dropped the gavel in the wrong place."}
					</p>
				</CardContent>
				<CardFooter>
					<Button variant="outline" onClick={reset} className="w-full">
						Try Again
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
