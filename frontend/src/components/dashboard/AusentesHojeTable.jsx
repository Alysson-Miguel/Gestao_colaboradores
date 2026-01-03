export default function AusentesHojeTable({
  data = [],
  columns = [],
  title,
  emptyMessage = "Nenhum registro encontrado",
  getRowKey,
}) {
  const colSpan = columns.length;

  return (
    <div className="bg-[#1A1A1C] rounded-2xl overflow-hidden">
      {title && (
        <div className="px-6 py-4 border-b border-[#2A2A2C]">
          <h2 className="text-sm font-semibold text-[#BFBFC3] uppercase">
            {title}
          </h2>
        </div>
      )}

      <table className="w-full text-sm">
        <thead className="bg-[#2A2A2C] text-[#BFBFC3]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-4 text-left"
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
                className="px-6 py-6 text-center text-[#BFBFC3]"
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
                className="border-t border-[#3D3D40]"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-6 py-4 text-[#E5E5E5]"
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
  );
}
