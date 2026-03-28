import React from "react";
import "./ToastContainer.css";

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <div className="toast-content">
            <span className="toast-icon">
              {toast.type === "success" && "✓"}
              {toast.type === "error" && "✗"}
              {toast.type === "info" && "ℹ"}
              {toast.type === "warning" && "⚠"}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
          <button
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
