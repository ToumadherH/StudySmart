import Button from "./Button";

export const AlertMessage = ({ variant = "info", children }) => {
  const variantMap = {
    info: "border-ss-border bg-ss-surface/45 text-ss-text",
    success: "border-ss-success/70 bg-ss-success/10 text-ss-highlight",
    error: "border-ss-danger/80 bg-ss-danger/10 text-ss-highlight",
  };

  return (
    <div
      className={[
        "rounded-xl border px-4 py-3 text-sm leading-relaxed shadow-soft",
        variantMap[variant] || variantMap.info,
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      {children}
    </div>
  );
};

export const LoadingState = ({ title = "Loading", description = "Please wait while we prepare your data." }) => {
  return (
    <div className="flex min-h-[45vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-ss-border bg-ss-surface/45 p-8 text-center shadow-soft">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-ss-border border-t-ss-accent" />
        <h2 className="mb-2 text-lg font-semibold text-ss-highlight">{title}</h2>
        <p className="text-sm text-ss-muted">{description}</p>
      </div>
    </div>
  );
};

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="rounded-2xl border border-dashed border-ss-border bg-ss-surface/25 p-10 text-center shadow-soft">
      <h3 className="mb-2 text-xl font-semibold text-ss-highlight">{title}</h3>
      <p className="mx-auto mb-6 max-w-xl text-sm text-ss-muted">{description}</p>
      {actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};
