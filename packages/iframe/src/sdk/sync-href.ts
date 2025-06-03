declare global {
	interface Window {
		_whop_sync_href_interval?: ReturnType<typeof setInterval>;
	}
}

export function syncHref({
	onChange,
}: { onChange: (req: { href: string }) => Promise<"ok"> }) {
	if (typeof window === "undefined") return;

	const initialHref = window.location.href;
	onChange({ href: initialHref }).catch(() => null);
	let lastKnown = initialHref;

	window.addEventListener("popstate", () => {
		const { href } = window.location;
		onChange({ href }).catch(() => null);
		lastKnown = href;
	});

	if (window._whop_sync_href_interval) {
		clearInterval(window._whop_sync_href_interval);
	}
	window._whop_sync_href_interval = setInterval(() => {
		const { href } = window.location;
		if (href === lastKnown) return;
		onChange({ href }).catch(() => null);
		lastKnown = href;
	}, 250);
}
