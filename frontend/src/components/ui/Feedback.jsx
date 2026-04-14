import Button from "./Button";
import Card from "./Card";

export const AlertMessage = ({ variant = "info", children }) => {
  const variantMap = {
    info: "border-white/10 bg-[rgba(255,255,255,0.05)] text-ss-text",
    success: "border-ss-success/30 bg-[rgba(73,180,143,0.12)] text-ss-highlight",
    error: "border-ss-danger/30 bg-[rgba(209,102,102,0.12)] text-ss-highlight",
  };

  return (
    <div
      className={[
        "glass-surface px-4 py-3 text-sm leading-relaxed",
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
      <Card elevated className="w-full max-w-lg p-8 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-ss-border border-t-ss-accent" />
        <h2 className="mb-2 text-lg font-semibold text-ss-highlight">{title}</h2>
        <p className="text-sm text-ss-muted">{description}</p>
      </Card>
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
    <div className="glass-surface border-dashed border-white/15 p-10 text-center">
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
