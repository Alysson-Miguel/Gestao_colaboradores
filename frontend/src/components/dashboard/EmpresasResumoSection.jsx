export default function EmpresasResumoSection({ empresas = [] }) {
  if (!empresas.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-[#BFBFC3] uppercase">
        Análise por Empresa
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {empresas.map((e) => {
          const turnover = Number(e.turnover ?? 0);
          const absenteismo = Number(e.absenteismo ?? 0);

          return (
            <div
              key={e.empresa || "sem-empresa"}
              className="bg-[#1A1A1C] rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-sm font-semibold text-white">
                {e.empresa || "Sem empresa"}
              </h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#BFBFC3]">Colaboradores</span>
                  <p className="text-lg font-semibold">
                    {e.totalColaboradores ?? 0}
                  </p>
                </div>

                <div>
                  <span className="text-[#BFBFC3]">Presentes</span>
                  <p className="text-lg font-semibold text-[#34C759]">
                    {e.presentes ?? 0}
                  </p>
                </div>

                {/* ✅ ABSENTEÍSMO POR EMPRESA */}
                <div>
                  <span className="text-[#BFBFC3]">Absenteísmo</span>
                  <p
                    className="text-lg font-semibold"
                    style={{
                      color:
                        absenteismo > 10
                          ? "#FF453A"
                          : absenteismo > 5
                          ? "#FF9F0A"
                          : "#34C759",
                    }}
                  >
                    {absenteismo.toFixed(2)}%
                  </p>
                </div>

                <div>
                  <span className="text-[#BFBFC3]">Atestados</span>
                  <p className="text-lg font-semibold">
                    {e.atestados ?? 0}
                  </p>
                </div>

                <div>
                  <span className="text-[#BFBFC3]">
                    Medidas Disciplinares
                  </span>
                  <p className="text-lg font-semibold">
                    {e.medidasDisciplinares ?? 0}
                  </p>
                </div>

                <div>
                  <span className="text-[#BFBFC3]">Acidentes</span>
                  <p className="text-lg font-semibold text-[#FFD60A]">
                    {e.acidentes ?? 0}
                  </p>
                </div>

                {/* TURNOVER */}
                <div className="col-span-2">
                  <span className="text-[#BFBFC3]">Turnover</span>
                  <p
                    className="text-lg font-semibold"
                    style={{
                      color:
                        turnover > 5
                          ? "#FF453A"
                          : turnover > 3
                          ? "#FF9F0A"
                          : "#34C759",
                    }}
                  >
                    {turnover.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
