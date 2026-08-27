import ConsultaFolgasCard from "../components/consultaFolgas/ConsultaFolgasCard";

export default function ConsultaFolgas() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-page px-4 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #FA4C00 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-md bg-surface border border-default rounded-2xl p-8 sm:p-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FA4C00]" />
            <h1 className="text-2xl font-bold text-page tracking-wide">
              COPEOPLE
            </h1>
          </div>
          <p className="text-sm text-muted">
            Consulte suas folgas do mês
          </p>
        </div>

        <ConsultaFolgasCard />
      </div>
    </div>
  );
}
