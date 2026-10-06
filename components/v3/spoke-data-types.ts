import type { ReactNode } from "react";

export type SpokeId =
  | "hub"
  | "aeo"
  | "ecommerce"
  | "specs"
  | "competitors"
  | "suggestions"
  | "roadmap";

export type SpokeDefinition = {
  badge: string;
  title: string;
  desc: string;
  tabs: string[];
  navLabel: string;
  next: SpokeId;
  render: (tabIdx: number) => ReactNode | string;
};
