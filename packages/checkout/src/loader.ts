// get the script url from the script tag
const currentScript = document.currentScript as HTMLScriptElement;
const loaderScriptSrc = currentScript?.src;

if (typeof window !== "undefined" && loaderScriptSrc) {
	window.wco ??= (() => {
		const script = document.createElement("script");

		script.src = loaderScriptSrc.replace(/loader\.js$/, "index.js");
		script.async = true;
		script.defer = true;

		document.head.appendChild(script);

		return {
			injected: true,
			listening: false,
			frames: new Map(),
		};
	})();
}
