import {
  FileText,
  Calendar,
  Clock,
  Download,
  CheckCircle,
  XCircle,
  FileWarning
} from "lucide-react";

import { Badge, Button } from "./UIComponents";
import { formatDateBR } from "../utils/date";

export default function AtestadoCard({
  atestado,
  onFinalizar,
  onCancelar,
  onDownload,
}) {
  const isAtivo = atestado.status === "ATIVO";
  const isFinalizado = atestado.status === "FINALIZADO";
  const isCancelado = atestado.status === "CANCELADO";

  const diasLabel =
    atestado.diasAfastamento === 1
      ? "1 DIA"
      : `${atestado.diasAfastamento} DIAS`;

  const statusColor = isAtivo
    ? "border-l-yellow-500"
    : isFinalizado
    ? "border-l-green-500"
    : "border-l-red-500";

  return (
    <div
      className={`bg-[#161618] border border-[#2C2C2F] rounded-2xl p-6 space-y-5 border-l-4 ${statusColor} hover:border-[#3D3D40] transition-all`}
    >
      {/* ================= HEADER ================= */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#2A2A2C] flex items-center justify-center">
            <FileText size={20} className="text-orange-400" />
          </div>

          <div>
            <p className="text-white font-semibold text-base tracking-wide">
              {atestado.colaborador?.nomeCompleto || atestado.opsId}
            </p>

            <p className="text-xs text-[#9CA3AF] mt-1">
              OPS ID: {atestado.opsId}
            </p>
          </div>
        </div>

        <Badge.Status
          variant={
            isAtivo
              ? "warning"
              : isFinalizado
              ? "success"
              : "danger"
          }
        >
          {atestado.status}
        </Badge.Status>
      </div>

      {/* ================= PERÍODO ================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0E0E0F] border border-[#2C2C2F] rounded-xl p-4">
        <div className="flex items-center gap-3 text-sm text-white">
          <Calendar size={16} className="text-[#9CA3AF]" />
          <span>
            {formatDateBR(atestado.dataInicio)} →{" "}
            {formatDateBR(atestado.dataFim)}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-[#1F1F22] px-3 py-1 rounded-lg text-xs font-semibold tracking-wide text-white">
          <Clock size={14} className="text-[#9CA3AF]" />
          {diasLabel}
        </div>
      </div>

      {/* ================= CID ================= */}
      {atestado.cid && (
        <div className="flex items-center gap-2 text-sm text-[#E5E7EB]">
          <FileWarning size={16} className="text-[#9CA3AF]" />
          <span>
            <span className="text-white/80 font-medium">CID:</span>{" "}
            {atestado.cid}
          </span>
        </div>
      )}

      {/* ================= OBSERVAÇÕES ================= */}
      {atestado.observacao && (
        <div className="bg-[#0F0F10] border border-[#2C2C2F] rounded-xl p-4">
          <p className="text-xs uppercase text-[#9CA3AF] tracking-wider mb-2">
            Observações
          </p>
          <p className="text-sm text-white/90 leading-relaxed">
            {atestado.observacao}
          </p>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <div className="flex items-center justify-between pt-4 border-t border-[#2C2C2F]">
        <div className="text-xs text-[#9CA3AF]">
          {isFinalizado && "Atestado Finalizado"}
          {isCancelado && "Atestado cancelado"}
          {isAtivo && "Atestado Ativo"}
        </div>

        <div className="flex items-center gap-3">
          {onDownload && (
            <Button.IconButton
              onClick={() => onDownload(atestado.idAtestado)}
              title="Download do PDF"
            >
              <Download size={16} />
            </Button.IconButton>
          )}

          {isAtivo && (
            <>
              <Button.IconButton
                variant="success"
                onClick={() => onFinalizar(atestado.idAtestado)}
                title="Finalizar atestado"
              >
                <CheckCircle size={16} />
              </Button.IconButton>

              <Button.IconButton
                variant="danger"
                onClick={() => onCancelar(atestado.idAtestado)}
                title="Cancelar atestado"
              >
                <XCircle size={16} />
              </Button.IconButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}