export default function PresencaHeader({ dias }) {
  return (
    <thead>
      <tr>
        <th className="sticky left-0 bg-[#1A1A1C] z-10 px-4 py-3 border-r border-[#2A2A2C] text-left">
          Colaborador
        </th>

        {dias.map((dia) => (
          <th
            key={dia} // ✅ KEY ÚNICA
            className="px-2 py-3 text-center border-r border-[#2A2A2C] text-xs text-[#BFBFC3]"
          >
            {dia}
          </th>
        ))}
      </tr>
    </thead>
  );
}
