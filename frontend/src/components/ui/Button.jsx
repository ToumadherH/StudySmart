const baseClasses =
  "inline-flex min-h-11 items-center justify-center rounded-xl border font-semibold tracking-wide transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ss-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ss-bg";

const variantClasses = {
  primary:
    "border-ss-accent bg-ss-accent text-ss-bg shadow-soft hover:border-ss-accent-bright hover:bg-ss-accent-bright hover:shadow-lg hover:shadow-ss-accent/25 active:translate-y-px disabled:border-ss-border disabled:bg-ss-border disabled:text-ss-muted",
  secondary:
    "border-ss-border bg-ss-surface/25 text-ss-neutral-200 hover:bg-ss-surface-soft/45 hover:text-ss-neutral-100 active:translate-y-px disabled:bg-ss-surface/20 disabled:text-ss-muted",
  ghost:
    "border-transparent bg-transparent text-ss-neutral-300 hover:border-ss-border/70 hover:bg-ss-surface-soft/30 hover:text-ss-neutral-100 active:translate-y-px disabled:text-ss-muted/70",
  danger:
    "border-ss-danger bg-ss-danger text-ss-highlight hover:brightness-110 hover:shadow-lg hover:shadow-ss-danger/20 active:translate-y-px disabled:border-ss-border disabled:bg-ss-border disabled:text-ss-muted",
};

const sizeClasses = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

const Button = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}) => {
  const v = variantClasses[variant] ?? variantClasses.primary;
  const s = sizeClasses[size] ?? sizeClasses.md;

  return (
    <button
      className={[baseClasses, v, s, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
