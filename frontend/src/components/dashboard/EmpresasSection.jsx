export default function EmpresasSection({ empresas }) {
  if (!empresas.length) {
    return (
      <div className="text-[#BFBFC3] text-sm">
        Nenhuma empresa encontrada
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-[#BFBFC3] uppercase">
        Quantidade por Empresa
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {empresas.map((e) => (
          <div
            key={e.empresa}
            className="rounded-xl bg-[#1A1A1C] p-5 flex justify-between items-center"
          >
            <span className="text-sm text-[#E5E5E5]">
              {e.empresa}
            </span>
            <span className="text-lg font-semibold text-white">
              {e.quantidade}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
