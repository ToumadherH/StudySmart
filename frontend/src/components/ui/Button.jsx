const baseClasses =
  "inline-flex min-h-11 items-center justify-center rounded-xl border font-semibold tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ss-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ss-bg backdrop-blur-md";

const variantClasses = {
  primary:
    "border-ss-accent/60 bg-[rgba(0,163,133,0.18)] text-ss-highlight shadow-glass hover:border-ss-accent-bright hover:bg-[rgba(0,163,133,0.28)] hover:shadow-glass-strong active:translate-y-px disabled:border-ss-border disabled:bg-[rgba(255,255,255,0.05)] disabled:text-ss-muted",
  secondary:
    "border-white/10 bg-[rgba(255,255,255,0.05)] text-ss-neutral-200 hover:border-white/15 hover:bg-[rgba(255,255,255,0.08)] hover:text-ss-neutral-100 active:translate-y-px disabled:bg-[rgba(255,255,255,0.03)] disabled:text-ss-muted",
  ghost:
    "border-transparent bg-transparent text-ss-neutral-300 hover:border-white/10 hover:bg-[rgba(255,255,255,0.05)] hover:text-ss-neutral-100 active:translate-y-px disabled:text-ss-muted/70",
  danger:
    "border-ss-danger/60 bg-[rgba(209,102,102,0.18)] text-ss-highlight hover:border-ss-danger hover:bg-[rgba(209,102,102,0.26)] hover:shadow-glass-strong active:translate-y-px disabled:border-ss-border disabled:bg-[rgba(255,255,255,0.05)] disabled:text-ss-muted",
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
