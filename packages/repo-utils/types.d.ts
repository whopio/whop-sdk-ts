import { type Options } from "@swc/core";

export declare type SwcOptions = Omit<Options, "module">;

export declare type BuildOptions = {
  src?: string;
  dist?: string;
  swc: SwcOptions;
};
