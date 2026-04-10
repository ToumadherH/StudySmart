const Card = ({ className = "", elevated = false, children, ...rest }) => {
  const base =
    "rounded-2xl border border-ss-border bg-ss-surface/35 p-5 text-ss-text";
  const elevation = elevated
    ? "shadow-soft transition-shadow duration-200 hover:shadow-xl hover:shadow-black/30"
    : "shadow-sm shadow-black/15";

  const classes = [base, elevation, className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
};

export default Card;
