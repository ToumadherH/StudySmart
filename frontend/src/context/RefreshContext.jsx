import { createContext, useState, useCallback, useContext } from "react";

export const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    console.log("🔄 Refresh triggered!");
    const newKey = Date.now();
    setRefreshKey(newKey);
    // Store in sessionStorage so Dashboard knows to refresh even if not mounted
    sessionStorage.setItem("needsDashboardRefresh", "true");
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error("useRefresh must be used within RefreshProvider");
  }
  return context;
};
