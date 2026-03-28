import { useState, useCallback } from "react";

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now();
    const toast = { id, message, type };

    setToasts((prevToasts) => [...prevToasts, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback(
    (message, duration = 3000) => addToast(message, "success", duration),
    [addToast],
  );

  const error = useCallback(
    (message, duration = 4000) => addToast(message, "error", duration),
    [addToast],
  );

  const info = useCallback(
    (message, duration = 3000) => addToast(message, "info", duration),
    [addToast],
  );

  const warning = useCallback(
    (message, duration = 3000) => addToast(message, "warning", duration),
    [addToast],
  );

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
};

export default useToast;
