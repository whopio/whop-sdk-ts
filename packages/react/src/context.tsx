import React, {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useContext,
} from "react";
import { WhopSDK } from "@whop-sdk/core";

type WhopContextState = {
  sdk: WhopSDK;
};

const WhopContext = createContext<WhopContextState | null>(null);

WhopContext.displayName = "WhopContext";

export const useWhop = () => {
  const ctx = useContext(WhopContext);
  if (!ctx) throw new Error("No WhopContextProvider found");
  return ctx;
};

export const WhopContextProvider: FunctionComponent<PropsWithChildren<{}>> = ({
  children,
}) => {
  return (
    <WhopContext.Provider
      value={{
        sdk: new WhopSDK(),
      }}
    >
      {children}
    </WhopContext.Provider>
  );
};
