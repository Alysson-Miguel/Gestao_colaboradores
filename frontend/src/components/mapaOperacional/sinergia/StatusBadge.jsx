import { STATUS } from "./status";

export function StatusBadge({ status, className = "" }) {
  const info = STATUS[status] || { rotulo: status, cor: "#8B8B93", Icone: null };
  const { Icone } = info;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold whitespace-nowrap ${className}`}
      style={{ color: info.cor, background: `${info.cor}1F` }}
    >
      {Icone && <Icone size={13} aria-hidden="true" />}
      {info.rotulo}
    </span>
  );
}
