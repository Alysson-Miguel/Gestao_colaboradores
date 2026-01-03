export default function EmpresasSection({
  title = "Distribuição",
  items = [],               // [{ label, value }]
  emptyMessage = "Nenhum registro encontrado",
  columns = 3,
}) {
  if (!items || items.length === 0) {
    return (
      <div className="text-[#BFBFC3] text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {title && (
        <h2 className="text-sm font-semibold text-[#BFBFC3] uppercase">
          {title}
        </h2>
      )}

      <div
        className={`grid grid-cols-1 md:grid-cols-${columns} gap-6`}
      >
        {items.map((item, i) => (
          <div
            key={`${item.label}-${i}`}
            className="rounded-xl bg-[#1A1A1C] p-5 flex justify-between items-center"
          >
            <span className="text-sm text-[#E5E5E5]">
              {item.label}
            </span>
            <span className="text-lg font-semibold text-white">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
