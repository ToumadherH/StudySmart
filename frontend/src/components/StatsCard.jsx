import Card from "./ui/Card";

const StatsCard = ({ title, value, icon, color = "#00a385" }) => {
  return (
    <Card elevated className="flex items-center gap-4 !p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.06)] text-2xl shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
        style={{ color }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-ss-muted">{title}</h3>
        <p className="text-3xl font-bold leading-none text-ss-highlight" style={{ color }}>
          {value}
        </p>
      </div>
    </Card>
  );
};

export default StatsCard;
