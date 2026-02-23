export default function AusentesHojeTable({
  data = [],
  columns = [],
  title,
  emptyMessage = "Nenhum registro encontrado",
  getRowKey,
}) {
  const colSpan = columns.length;

  return (
    <div className="bg-[#1A1A1C] rounded-2xl overflow-hidden w-full">
      {title && (
        <div className="px-4 sm:px-6 py-4 border-b border-[#2A2A2C]">
          <h2 className="text-xs sm:text-sm font-semibold text-[#BFBFC3] uppercase tracking-wide">
            {title}
          </h2>
        </div>
      )}

      {/* 🔥 SCROLL RESPONSIVO */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-[#2A2A2C] text-[#BFBFC3]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 sm:px-6 py-3 sm:py-4 text-left font-medium whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {!data.length ? (
              <tr className="border-t border-[#3D3D40]">
                <td
                  colSpan={colSpan}
                  className="px-4 sm:px-6 py-6 text-center text-[#BFBFC3]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={
                    getRowKey
                      ? getRowKey(row)
                      : row.id || row.opsId || rowIndex
                  }
                  className="border-t border-[#3D3D40] hover:bg-[#222]"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 sm:px-6 py-3 sm:py-4 text-[#E5E5E5] whitespace-nowrap truncate"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}