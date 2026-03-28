import React, { createContext, useContext } from "react";
import useToast from "../hooks/useToast";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within ToastProvider");
  }
  return context;
};
