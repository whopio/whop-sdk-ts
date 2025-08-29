import type React from "react";
import type { FC } from "react";
import type { TWhopCoreNavigation } from "./native-whop-core-stub";
import type {
	DashboardViewProps,
	DiscoverViewProps,
	ExperienceViewProps,
} from "./props";

type AppReactComponent = {
	ExperienceView: FC<ExperienceViewProps>;
	DiscoverView: FC<DiscoverViewProps>;
	DashboardView: FC<DashboardViewProps>;
};

function getNavigation(): TWhopCoreNavigation {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const anyWindow = window as any;
	if (typeof anyWindow !== "undefined" && anyWindow.whopCoreNavigation) {
		return anyWindow.whopCoreNavigation;
	}

	throw new Error(
		"window.whopCoreNavigation is not defined. this method is only available in a web build",
	);
}

function parseQueryParams() {
	const params = new URLSearchParams(window.location.search);
	const experienceId = params.get("experienceId");
	const companyId = params.get("companyId");
	const currentUserId = params.get("currentUserId");
	const restPath = params.get("restPath");
	const queryStr = params.get("query");

	let path: string[] = [];
	if (restPath) path = restPath.split("/").filter(Boolean);

	const appParams: Record<string, string> = {};
	if (queryStr) {
		const obj = new URLSearchParams(queryStr);
		for (const [key, value] of obj.entries()) {
			appParams[key] = value;
		}
	}

	return {
		experienceId,
		companyId,
		currentUserId,
		path,
		params: appParams,
	};
}

function usePath(
	R: typeof React,
	initialPath: string[],
	initialParams: Record<string, string>,
): { path: string[]; params: Record<string, string> } {
	const navigation = getNavigation();
	const path = R.useSyncExternalStore(
		navigation.subscribeToPath,
		navigation.getFullStack,
	);
	const route = path.at(path.length - 1);
	const actualPath = route ?? { path: initialPath, params: initialParams };
	return actualPath;
}

function useSheet(R: typeof React) {
	const navigation = getNavigation();
	const sheet = R.useSyncExternalStore(
		navigation.subscribeToSheet,
		navigation.getCurrentSheet,
	);
	return sheet;
}

export function WhopNavigationWrapper<T extends keyof AppReactComponent>(
	R: typeof React,
	name: T,
	Component: AppReactComponent[T],
) {
	const {
		experienceId,
		companyId,
		currentUserId,
		path: initialPath,
		params,
	} = parseQueryParams();

	const ModalComponent = makeModalComponent(R);

	let render: (route: {
		path: string[];
		params: Record<string, string>;
	}) => React.ReactNode;

	if (name === "ExperienceView") {
		if (!experienceId || !companyId) {
			throw new Error("Missing required query params");
		}

		const C = Component as FC<ExperienceViewProps>;

		render = (route: {
			path: string[];
			params: Record<string, string>;
		}) => {
			return R.createElement(C, {
				experienceId,
				companyId,
				currentUserId,
				path: route.path,
				params: route.params,
			});
		};
	}

	if (name === "DashboardView") {
		if (!companyId) {
			throw new Error("Missing required query params");
		}

		const C = Component as FC<DashboardViewProps>;

		render = (route: {
			path: string[];
			params: Record<string, string>;
		}) => {
			return R.createElement(C, {
				companyId,
				currentUserId,
				path: route.path,
				params: route.params,
			});
		};
	}

	if (name === "DiscoverView") {
		const C = Component as FC<DiscoverViewProps>;
		render = (route: {
			path: string[];
			params: Record<string, string>;
		}) => {
			return R.createElement(C, {
				currentUserId,
				path: route.path,
				params: route.params,
			});
		};
	}

	return function AppWrapper() {
		const path = usePath(R, initialPath, params);
		const sheet = useSheet(R);
		const sheetElement = R.createElement(ModalComponent, {
			route: sheet,
			render,
		});
		return R.createElement(R.Fragment, null, [render(path), sheetElement]);
	};
}

function makeModalComponent(R: typeof React) {
	const STYLE_ID = "whop-rn-modal-styles";
	const ANIMATION_MS = 220;

	function ensureStylesInjected() {
		if (typeof document === "undefined") return;
		if (document.getElementById(STYLE_ID)) return;
		const styleEl = document.createElement("style");
		styleEl.id = STYLE_ID;
		styleEl.textContent = `
			.whop-rn-modal-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);opacity:0;pointer-events:none;transition:opacity ${ANIMATION_MS}ms ease;z-index:2147483647}
			.whop-rn-modal-overlay.open{opacity:1;pointer-events:auto}
			.whop-rn-modal-panel{background:var(--modal-bg,#fff);color:var(--modal-fg,#111);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.2);max-width:min(calc(100vw - 32px),720px);width:100%;max-height:min(calc(100vh - 32px),85vh);overflow:auto;transform:translateY(8px) scale(0.98);opacity:0.98;transition:transform ${ANIMATION_MS + 20}ms ease,opacity ${ANIMATION_MS + 20}ms ease}
			.whop-rn-modal-overlay.open .whop-rn-modal-panel{transform:translateY(0) scale(1);opacity:1}
			.whop-rn-modal-header{display:flex;justify-content:flex-end}
			.whop-rn-modal-close{height:36px;width:36px;display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:8px;background:rgba(0,0,0,0.04);color:inherit;cursor:pointer;transition:background ${ANIMATION_MS}ms ease}
			.whop-rn-modal-close:hover{background:rgba(0,0,0,0.08)}
			.whop-rn-modal-close:focus{outline:2px solid rgba(59,130,246,0.6);outline-offset:2px}
			.whop-rn-modal-panel-inner{padding:0}
			@media (prefers-color-scheme: dark){.whop-rn-modal-panel{--modal-bg:#111416;--modal-fg:#e6e7e8;box-shadow:0 10px 30px rgba(0,0,0,0.7)}}
		`;
		document.head.appendChild(styleEl);
	}

	return function ModalComponent(props: {
		route:
			| {
					path: string[];
					params: Record<string, string>;
			  }
			| undefined
			| null;
		render: (route: {
			path: string[];
			params: Record<string, string>;
		}) => React.ReactNode;
	}) {
		// Manage mount/unmount to allow exit animations
		const isOpen = !!props.route;
		const [shouldRender, setShouldRender] = R.useState<boolean>(isOpen);
		const [isVisible, setIsVisible] = R.useState<boolean>(isOpen);
		const closeTimerRef = R.useRef<number | null>(null);
		const mostRecentRouteRef = R.useRef<{
			path: string[];
			params: Record<string, string>;
		} | null>(null);

		if (props.route) mostRecentRouteRef.current = props.route;

		R.useEffect(() => {
			ensureStylesInjected();
			return () => {
				if (closeTimerRef.current !== null) {
					window.clearTimeout(closeTimerRef.current);
				}
			};
		}, []);

		R.useEffect(() => {
			if (isOpen) {
				setShouldRender(true);
				// Ensure next frame so transitions apply
				window.requestAnimationFrame(() => setIsVisible(true));
				if (closeTimerRef.current !== null) {
					window.clearTimeout(closeTimerRef.current);
					closeTimerRef.current = null;
				}
			} else if (shouldRender) {
				setIsVisible(false);
				if (closeTimerRef.current !== null) {
					window.clearTimeout(closeTimerRef.current);
				}
				closeTimerRef.current = window.setTimeout(() => {
					setShouldRender(false);
					closeTimerRef.current = null;
				}, ANIMATION_MS);
			}
		}, [isOpen, shouldRender]);

		const overlayClass = isVisible
			? "whop-rn-modal-overlay open"
			: "whop-rn-modal-overlay";

		const dismiss = R.useCallback((): void => {
			try {
				getNavigation().dismissSheet();
			} catch {
				// no-op when navigation is not available
			}
		}, []);

		R.useEffect(() => {
			if (!isOpen) return;
			const onKeyDown = (e: KeyboardEvent) => {
				if (e.key === "Escape") dismiss();
			};
			document.addEventListener("keydown", onKeyDown);
			return () => document.removeEventListener("keydown", onKeyDown);
		}, [isOpen, dismiss]);

		if (!shouldRender) return null;

		const route = mostRecentRouteRef.current;

		const panelInner = R.createElement(
			"div",
			{ className: "whop-rn-modal-panel-inner" },
			[route ? props.render(route) : null],
		);

		const closeButton = R.createElement(
			"button",
			{
				type: "button",
				className: "whop-rn-modal-close",
				"aria-label": "Close modal",
				onClick: dismiss,
			},
			"×",
		);

		const header = R.createElement(
			"div",
			{ className: "whop-rn-modal-header" },
			[closeButton],
		);

		const panel = R.createElement(
			"div",
			{ className: "whop-rn-modal-panel", role: "document" },
			[header, panelInner],
		);

		const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
			if (e.target === e.currentTarget) dismiss();
		};

		return R.createElement(
			"div",
			{
				className: overlayClass,
				role: "dialog",
				"aria-modal": "true",
				onClick: onOverlayClick,
			},
			[panel],
		);
	};
}
