const InputField = ({
  label,
  hint,
  error,
  id,
  className = "",
  ...inputProps
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          className="text-sm font-semibold tracking-wide text-ss-highlight"
          htmlFor={id}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={error ? "true" : "false"}
        className={[
          "glass-control px-4 py-4 text-sm text-ss-neutral-100 placeholder:text-ss-neutral-400",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...inputProps}
      />
      {hint && !error && (
        <p className="text-xs text-ss-neutral-400">{hint}</p>
      )}
      {error && <p className="text-xs text-ss-danger" role="alert">{error}</p>}
    </div>
  );
};

export default InputField;
