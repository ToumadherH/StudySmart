const Card = ({ className = "", elevated = false, children, ...rest }) => {
  const base = "glass-surface p-5 text-ss-text";
  const elevation = elevated ? "glass-surface--interactive" : "";

  const classes = [base, elevation, className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
};

export default Card;
