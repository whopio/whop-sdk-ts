"use client";

import type { WhopIframeSdk } from "@whop/iframe";
import { type Context, createContext } from "react";

export type { WhopIframeSdk };

export const WhopIframeSdkContext: Context<WhopIframeSdk | null> =
	createContext<WhopIframeSdk | null>(null);
