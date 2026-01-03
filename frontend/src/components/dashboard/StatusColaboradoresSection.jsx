export default function StatusColaboradoresSection({
  title = "Status dos Colaboradores",
  items = [], // [{ label, value }] OU [{ status, quantidade }]
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-[#1A1A1C] rounded-2xl p-6">
      {title && (
        <h2 className="text-sm font-semibold text-[#BFBFC3] mb-4 uppercase">
          {title}
        </h2>
      )}

      <div className="space-y-3">
        {items.map((item, i) => {
          const label =
            item.label ??
            item.status ??
            "-";

          const value =
            item.value ??
            item.quantidade ??
            0;

          return (
            <div
              key={`${label}-${i}`}
              className="flex justify-between items-center"
            >
              <span className="text-[#BFBFC3] text-sm">
                {label}
              </span>

              <span className="text-2xl font-semibold text-white">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
