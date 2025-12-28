export default function StatusColaboradoresSection({ status }) {
  if (!status || status.length === 0) return null;

  return (
    <div className="bg-[#1A1A1C] rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-[#BFBFC3] mb-4 uppercase">
        Status dos Colaboradores
      </h2>

      <div className="space-y-3">
        {status.map((s) => (
          <div
            key={s.status}
            className="flex justify-between items-center"
          >
            <span className="text-[#BFBFC3] text-sm">
              {s.status}
            </span>

            <span className="text-2xl font-semibold text-white">
              {s.quantidade}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
