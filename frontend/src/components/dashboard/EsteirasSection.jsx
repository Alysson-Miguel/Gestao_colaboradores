import { useEffect, useState } from "react";
import api from "../../services/api";

const BELT_STYLE = {
  esteira_a: { bg: "bg-red-500/10",    border: "border-red-500/30",    dot: "bg-red-500" },
  esteira_b: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", dot: "bg-yellow-400" },
  esteira_c: { bg: "bg-blue-500/10",   border: "border-blue-500/30",   dot: "bg-blue-500" },
  linear:    { bg: "bg-purple-500/10", border: "border-purple-500/30", dot: "bg-purple-500" },
  termo:     { bg: "bg-green-500/10",  border: "border-green-500/30",  dot: "bg-green-500" },
};

export default function EsteirasSection({ date }) {
  const [belts, setBelts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!date) return;

    setLoading(true);
    setErro(null);

    api
      .get("/esteiras/planejado", { params: { date } })
      .then((res) => setBelts(res.data.data?.belts || []))
      .catch(() => setErro("Não foi possível carregar os dados das esteiras."))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="bg-surface border border-default rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-muted uppercase mb-5">
        Configuração das Esteiras – Planejado
      </h2>

      {loading ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : erro ? (
        <p className="text-sm text-red-400">{erro}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {belts.map((belt) => {
            const style = BELT_STYLE[belt.key] || {};
            return (
              <div
                key={belt.key}
                className={`flex flex-col gap-2 px-5 py-4 rounded-xl border ${style.bg} ${style.border}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot}`} />
                  <span className="text-sm font-medium text-page">{belt.label === "Termo" ? "Esteira Termoplástica" : belt.label}</span>
                </div>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-page">{belt.plannedOperators}</span>
                  <p className="text-xs text-muted mt-0.5">operadores planejados</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
