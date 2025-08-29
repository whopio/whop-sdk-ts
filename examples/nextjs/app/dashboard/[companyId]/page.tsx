import { whopSdk } from "@/lib/whop-sdk";
import { verifyUserToken } from "@whop/api";
import { headers } from "next/headers";

export default async function Page({
	params,
}: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;

	const headersList = await headers();
	const token = await verifyUserToken(headersList, { dontThrow: true });

	if (!token) {
		return <span>Unauthorized</span>;
	}

	const access = await whopSdk.access.checkIfUserHasAccessToCompany({
		companyId,
		userId: token.userId,
	});

	if (!access.hasAccess || access.accessLevel !== "admin") {
		return <span>Forbidden</span>;
	}

	return <div>Dashboard view for company {companyId}</div>;
}
