import { themePropDefs } from "frosted-ui";

export const accentColorValues = themePropDefs.accentColor.values;

export type AccentColor = (typeof accentColorValues)[number];

export function isAccentColor(color?: string): color is AccentColor {
	if (!color) return false;
	return themePropDefs.accentColor.values.includes(color as AccentColor);
}
