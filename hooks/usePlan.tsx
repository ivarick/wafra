import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as storage from "@/utils/storage";

export type PlanTier = "free" | "pro";
export type PlanFeature =
  | "voice"
  | "pdfReports"
  | "journalSync"
  | "weatherAlerts"
  | "fullOfflineSync"
  | "xaiOverlay"
  | "advancedAnalytics";

type PlanContextValue = {
  plan: PlanTier;
  isPro: boolean;
  setPlan: (next: PlanTier) => void;
  hasFeature: (feature: PlanFeature) => boolean;
};

const STORAGE_KEY = "wafra_plan_tier";
const FREE_BLOCKED_FEATURES: PlanFeature[] = [
  "voice",
  "pdfReports",
  "journalSync",
  "weatherAlerts",
  "fullOfflineSync",
  "xaiOverlay",
  "advancedAnalytics",
];

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlanState] = useState<PlanTier>("free");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await storage.getItemAsync(STORAGE_KEY);
      if (!mounted) return;
      if (saved === "free" || saved === "pro") {
        setPlanState(saved);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<PlanContextValue>(
    () => ({
      plan,
      isPro: plan === "pro",
      setPlan: (next) => {
        setPlanState(next);
        void storage.setItemAsync(STORAGE_KEY, next);
      },
      hasFeature: (feature) => {
        if (plan === "pro") return true;
        return !FREE_BLOCKED_FEATURES.includes(feature);
      },
    }),
    [plan]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlan must be used within PlanProvider");
  }
  return context;
}
