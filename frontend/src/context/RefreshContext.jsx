import { createContext, useState, useCallback, useContext } from "react";

export const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
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
