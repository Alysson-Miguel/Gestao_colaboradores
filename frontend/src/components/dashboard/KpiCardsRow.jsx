import { Users, Clock, TrendingUp, Building2 } from "lucide-react";
import KpiCard from "./KpiCard";

export default function KpiCardsRow({
  total,
  presentes,
  absenteismo,
  empresasCount,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#1A1A1C] rounded-2xl p-6">
      <KpiCard icon={Users} label="Colaboradores" value={total} />
      <KpiCard icon={Clock} label="Presentes Hoje" value={presentes} />
      <KpiCard
        icon={TrendingUp}
        label="Absenteísmo"
        value={`${absenteismo}%`}
        color={absenteismo > 10 ? "#FF453A" : "#34C759"}
      />
      <KpiCard
        icon={Building2}
        label="Empresas"
        value={empresasCount}
      />
    </div>
  );
}
