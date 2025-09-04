import { auth, getToken } from "@/auth";
import { SignInButton, SignOutButton } from "./buttons";

export default async function Home() {
	const session = await auth();
	const token = await getToken();

	console.log("Session:", session);
	console.log("JWT Token:", token);

	return (
		<div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
			{session ? <SignOutButton /> : <SignInButton />}
		</div>
	);
}
