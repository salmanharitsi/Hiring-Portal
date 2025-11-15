"use client";

import { createContext, useContext } from "react";

type RoleContextType = {
  role: "admin" | "applicant";
  userId: string;
};

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: RoleContextType;
}) {
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
}