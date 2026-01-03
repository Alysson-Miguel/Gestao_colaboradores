import KpiCard from "./KpiCard";

export default function KpiCardsRow({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="bg-[#1A1A1C] rounded-2xl p-6 overflow-x-auto">
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          xl:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]
          gap-6
        "
      >
        {items.map((item, i) => (
          <KpiCard
            key={i}
            icon={item.icon}
            label={item.label}
            value={item.value}
            color={item.color}
            suffix={item.suffix}
            tooltip={item.tooltip}
          />
        ))}
      </div>
    </div>
  );
}
