export const accentColorValues = [
	"tomato",
	"red",
	"ruby",
	"crimson",
	"pink",
	"plum",
	"purple",
	"violet",
	"iris",
	"cyan",
	"teal",
	"jade",
	"green",
	"grass",
	"brown",
	"blue",
	"orange",
	"indigo",
	"sky",
	"mint",
	"yellow",
	"amber",
	"lime",
	"lemon",
	"magenta",
	"gold",
	"bronze",
	"gray",
] as const;

export type AccentColor = (typeof accentColorValues)[number];

export function isAccentColor(color?: string): color is AccentColor {
	if (!color) return false;
	return accentColorValues.includes(color as AccentColor);
}
