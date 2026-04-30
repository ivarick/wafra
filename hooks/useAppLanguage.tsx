import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Lang } from "@/constants/i18n";
import * as storage from "@/utils/storage";

type AppLanguageContextValue = {
  lang: Lang;
  setLang: (value: Lang) => void;
  isRtl: boolean;
};

const STORAGE_KEY = "wafra_app_language";
const AppLanguageContext = createContext<AppLanguageContextValue | null>(null);

export function AppLanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const saved = await storage.getItemAsync(STORAGE_KEY);
      if (!isMounted) return;
      if (saved === "en" || saved === "fr" || saved === "ar") {
        setLangState(saved);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AppLanguageContextValue>(
    () => ({
      lang,
      setLang: (next) => {
        setLangState(next);
        void storage.setItemAsync(STORAGE_KEY, next);
      },
      isRtl: lang === "ar",
    }),
    [lang]
  );

  return <AppLanguageContext.Provider value={value}>{children}</AppLanguageContext.Provider>;
}

export function useAppLanguage() {
  const context = useContext(AppLanguageContext);
  if (!context) {
    throw new Error("useAppLanguage must be used within AppLanguageProvider");
  }
  return context;
}
