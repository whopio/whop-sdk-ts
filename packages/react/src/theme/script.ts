export function script() {
	const cookie = document.cookie.match(
		/whop-frosted-theme=appearance:(?<appearance>light|dark)/,
	)?.groups;
	const el = document.documentElement;
	const classes = ["light", "dark"];
	const theme = cookie ? cookie.appearance : getSystemTheme();

	function updateDOM(theme: string) {
		el.classList.remove(...classes);
		el.classList.add(theme);
		el.style.colorScheme = theme;
	}

	function getSystemTheme() {
		return window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	}

	updateDOM(theme);
}
