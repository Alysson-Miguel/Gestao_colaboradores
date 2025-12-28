export default function SetorDistribuicaoSection({ setores }) {
  if (!setores.length) return null;

  const max = Math.max(...setores.map((s) => s.quantidade));

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-[#BFBFC3] uppercase">
        Presença por Setor
      </h2>

      <div className="bg-[#1A1A1C] rounded-2xl p-6 space-y-4">
        {setores.map((s) => (
          <div key={s.setor} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{s.setor}</span>
              <span className="text-[#BFBFC3]">
                {s.quantidade}
              </span>
            </div>

            <div className="w-full h-2 bg-[#2A2A2C] rounded">
              <div
                className="h-2 bg-[#FA4C00] rounded"
                style={{
                  width: `${(s.quantidade / max) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
