import React, {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useContext,
} from "react";
import { TEST } from "./test";

type WhopContextState = {};

const WhopContext = createContext<WhopContextState | null>(null);

WhopContext.displayName = "WhopContext";

export const useWhop = () => {
  const ctx = useContext(WhopContext);
  if (!ctx) throw new Error("No WhopContextProvider found");
  console.log(TEST);
  return ctx;
};

export const WhopContextProvider: FunctionComponent<PropsWithChildren<{}>> = ({
  children,
}) => {
  return <WhopContext.Provider value={{}}>{children}</WhopContext.Provider>;
};
