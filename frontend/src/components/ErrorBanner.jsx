import React from "react";
import "./ErrorBanner.css";

const DEFAULT_SUMMARY = {
  network: "Connection problem",
  validation: "Validation",
  auth: "Authentication",
  permission: "Access denied",
  not_found: "Not found",
  server: "Server error",
  unknown: "Something went wrong",
};

/**
 * @param {{ kind?: string, summary?: string, message: string, className?: string }} props
 */
export default function ErrorBanner({ kind = "unknown", summary, message, className = "" }) {
  const title = summary || DEFAULT_SUMMARY[kind] || DEFAULT_SUMMARY.unknown;

  return (
    <div
      className={`error-banner error-banner--${kind} ${className}`.trim()}
      role="alert"
    >
      <div className="error-banner__type">{title}</div>
      <div className="error-banner__message">{message}</div>
    </div>
  );
}
