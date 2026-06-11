import React, { createContext, useContext, useMemo, useState } from "react";

const CountsContext = createContext(null);

export function CountsProvider({ children }) {
  const [counts, setCounts] = useState({
    pendingVerifier: 0,
    pendingDco: 0,
    pendingCeo: 0,
    // ถ้าอยากมีของ Credit Officer ด้วย (เช่น returnedToFix)
    returnedToFix: 0,
  });

  const value = useMemo(() => ({ counts, setCounts }), [counts]);
  return <CountsContext.Provider value={value}>{children}</CountsContext.Provider>;
}

export function useCounts() {
  const ctx = useContext(CountsContext);
  if (!ctx) throw new Error("useCounts must be used inside CountsProvider");
  return ctx;
}
