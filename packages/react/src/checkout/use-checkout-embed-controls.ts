import { useRef } from "react";
import type { WhopCheckoutEmbedControls } from "./util";

export function useCheckoutEmbedControls() {
	return useRef<WhopCheckoutEmbedControls>(null);
}
