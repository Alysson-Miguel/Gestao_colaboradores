export default function SetorDistribuicaoSection({
  title = "Distribuição",
  items = [],              // [{ label, value }]
  barColor = "#FA4C00",
  emptyMessage = null,
}) {
  if (!items || items.length === 0) {
    return emptyMessage ? (
      <div className="text-sm text-[#BFBFC3]">
        {emptyMessage}
      </div>
    ) : null;
  }

  const max = Math.max(...items.map((i) => i.value));

  return (
    <section className="space-y-4">
      {title && (
        <h2 className="text-sm font-semibold text-[#BFBFC3] uppercase">
          {title}
        </h2>
      )}

      <div className="bg-[#1A1A1C] rounded-2xl p-6 space-y-4">
        {items.map((item, i) => (
          <div
            key={`${item.label}-${i}`}
            className="space-y-1"
          >
            <div className="flex justify-between text-sm">
              <span>{item.label}</span>
              <span className="text-[#BFBFC3]">
                {item.value}
              </span>
            </div>

            <div className="w-full h-2 bg-[#2A2A2C] rounded">
              <div
                className="h-2 rounded"
                style={{
                  backgroundColor: barColor,
                  width:
                    max > 0
                      ? `${(item.value / max) * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
