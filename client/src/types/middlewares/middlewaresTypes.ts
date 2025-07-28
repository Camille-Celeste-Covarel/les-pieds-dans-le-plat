import type { ReactNode } from "react";

export interface OverlayRoute {
  component: ReactNode;
  protection: "public" | "protected" | "admin";
}
