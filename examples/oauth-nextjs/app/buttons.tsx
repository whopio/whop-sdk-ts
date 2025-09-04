"use client";

import { signIn, signOut } from "next-auth/react";

export function SignInButton() {
	return (
		<button
			type="button"
			onClick={() => signIn("whop")}
			className="px-4 py-2 font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
		>
			Sign in
		</button>
	);
}

export function SignOutButton() {
	return (
		<button
			type="button"
			onClick={() => signOut()}
			className="px-4 py-2 font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
		>
			Sign out
		</button>
	);
}
