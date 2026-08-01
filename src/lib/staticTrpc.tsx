/* eslint-disable react-refresh/only-export-components -- build-only shim mirrors the live provider module */
import type { ReactNode } from "react";

const unavailable = new Proxy<Record<string, never>>(
  {},
  {
    get() {
      throw new Error("tRPC is unavailable in the read-only static demo");
    },
  },
);

/**
 * Build-only replacement for the live provider. Static pages never invoke these
 * hooks; the proxy makes an accidental regression fail locally without networking.
 */
export const trpc = unavailable;

export function TRPCProvider({ children }: { children: ReactNode }) {
  return children;
}
