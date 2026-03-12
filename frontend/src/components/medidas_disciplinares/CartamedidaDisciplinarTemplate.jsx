/* =====================================================
   CARTA MEDIDA DISCIPLINAR — TEMPLATE (HTML PRINT A4)
===================================================== */

function fmtDateBR(dateLike) {
  if (!dateLike) return "-";
  const d = new Date(dateLike);
  return d.toLocaleDateString("pt-BR");
}

function fmtTimeBR(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeCpf(cpf) {
  const v = String(cpf || "").replace(/\D/g, "");
  if (v.length !== 11) return cpf || "-";
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export default function CartaMedidaDisciplinarTemplate({
  medida,
  empresa = "SPX Express",
  unidade = "Operações",
}) {

  if (!medida) return null;

  const dataAplicacao = fmtDateBR(medida.dataAplicacao);
  const dataOcorrencia = fmtDateBR(medida.dataOcorrencia);
  const horaGeracao = fmtTimeBR(new Date());

  const colaborador = medida.colaborador || {};

  const nomeColaborador = colaborador.nomeCompleto || "-";
  const cpfColaborador = normalizeCpf(colaborador.cpf);
  const matricula = colaborador.matricula || "-";
  const cargo = colaborador.cargo || "-";

  return (

    <div className="page">

      <style>{`

/* ================= A4 ================= */

.page {
  width: 210mm;
  min-height: 297mm;
  margin: auto;
  padding: 24px;
  font-family: Arial, Helvetica, sans-serif;
  color: #111;
  background: #fff;
}

/* ================= HEADER ================= */

.header {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  border-bottom:2px solid #FA4C00;
  padding-bottom:10px;
  margin-bottom:16px;
}

.company {
  font-size:18px;
  font-weight:700;
}

.sub {
  font-size:13px;
  color:#444;
}

.title {
  font-size:20px;
  font-weight:800;
  color:#FA4C00;
}

.meta {
  font-size:12px;
  color:#444;
}

/* ================= SECTIONS ================= */

.section {
  margin-top:18px;
}

.section h2 {
  font-size:13px;
  text-transform:uppercase;
  border-bottom:1px solid #e5e7eb;
  padding-bottom:4px;
  margin-bottom:8px;
}

/* ================= GRID ================= */

.grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
}

.field {
  border:1px solid #e5e7eb;
  border-radius:8px;
  padding:10px;
  background:#fafafa;
}

.label {
  font-size:11px;
  color:#666;
  margin-bottom:3px;
}

.value {
  font-size:13px;
  font-weight:700;
}

/* ================= BOX ================= */

.content-box {
  border:1px solid #e5e7eb;
  border-radius:10px;
  padding:12px;
  font-size:13px;
  line-height:1.6;
  background:#fafafa;
  min-height:80px;
  white-space:pre-wrap;
}

/* ================= ALERT ================= */

.alert {
  border:2px solid #FA4C00;
  border-radius:10px;
  padding:12px;
  background:#FFF5F0;
  margin-top:16px;
}

.alert-title {
  font-weight:700;
  color:#FA4C00;
  margin-bottom:6px;
}

/* ================= ASSINATURAS ================= */

.sign-grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
  margin-top:10px;
}

.sign {
  border:1px solid #e5e7eb;
  border-radius:10px;
  padding:12px;
}

.line {
  border-bottom:1px solid #111;
  height:20px;
  margin-top:10px;
}

.role {
  font-size:11px;
  color:#666;
}

/* ================= OBS ================= */

.notes {
  border:1px solid #e5e7eb;
  border-radius:10px;
  padding:12px;
  min-height:80px;
  background:#fafafa;
}

/* ================= PRINT ================= */

@media print {

  body {
    background:#fff;
  }

  .page {
    margin:0;
    padding:0;
    box-shadow:none;
  }

}

      `}</style>

      {/* HEADER */}

      <div className="header">

        <div>
          <div className="company">{empresa}</div>
          <div className="sub">Unidade: {unidade}</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div className="title">CARTA DE MEDIDA DISCIPLINAR</div>

          <div className="meta">
            Nº <b>{medida.idMedida}</b>
            <br />
            Gerado em: {fmtDateBR(new Date())} às {horaGeracao}
          </div>
        </div>

      </div>

      {/* COLABORADOR */}

      <div className="section">

        <h2>Dados do Colaborador</h2>

        <div className="grid">

          <div className="field">
            <div className="label">Nome Completo</div>
            <div className="value">{nomeColaborador}</div>
          </div>

          <div className="field">
            <div className="label">CPF</div>
            <div className="value">{cpfColaborador}</div>
          </div>

          <div className="field">
            <div className="label">Matrícula</div>
            <div className="value">{matricula}</div>
          </div>

          <div className="field">
            <div className="label">Cargo</div>
            <div className="value">{cargo}</div>
          </div>

          <div className="field">
            <div className="label">OPS ID</div>
            <div className="value">{medida.opsId || "-"}</div>
          </div>

        </div>

      </div>

      {/* MEDIDA */}

      <div className="section">

        <h2>Detalhes da Medida</h2>

        <div className="grid">

          <div className="field">
            <div className="label">Tipo</div>
            <div className="value">{medida.tipoMedida || "-"}</div>
          </div>

          <div className="field">
            <div className="label">Nível Violação</div>
            <div className="value">{medida.nivelViolacao || "-"}</div>
          </div>

          <div className="field">
            <div className="label">Violação</div>
            <div className="value">{medida.violacao || "-"}</div>
          </div>

          <div className="field">
            <div className="label">Data Ocorrência</div>
            <div className="value">{dataOcorrencia}</div>
          </div>

          <div className="field">
            <div className="label">Data Aplicação</div>
            <div className="value">{dataAplicacao}</div>
          </div>

          {medida.diasSuspensao && (
            <div className="field">
              <div className="label">Dias Suspensão</div>
              <div className="value">{medida.diasSuspensao}</div>
            </div>
          )}

        </div>

      </div>

      {/* MOTIVO */}

      <div className="section">

        <h2>Motivo</h2>

        <div className="content-box">
          {medida.motivo || "Nenhum motivo informado"}
        </div>

      </div>

      {/* ALERT */}

      <div className="alert">

        <div className="alert-title">IMPORTANTE</div>

        <div className="alert-text">
          <b>
          Lembramos que na reincidência deste comportamento,
          serão tomadas medidas punitivas mais severas,
          conforme o Artigo 482 da Consolidação das Leis do Trabalho (CLT).
          </b>
        </div>

      </div>

      {/* CIÊNCIA */}

      <div className="section">

        <h2>Ciência do Colaborador</h2>

        <div className="sign">
          <div>{nomeColaborador}</div>
          <div className="role">Colaborador</div>
          <div className="line"></div>
          <div className="label">Assinatura e Data</div>
        </div>

      </div>

      {/* TESTEMUNHAS */}

      <div className="section">

        <h2>Testemunhas (caso o colaborador se recuse a assinar)</h2>

        <div style={{fontSize:"12px",marginBottom:"10px"}}>
          Caso o colaborador se recuse a assinar este documento,
          a recusa será registrada na presença das testemunhas abaixo.
        </div>

        <div className="sign-grid">

          <div className="sign">
            <div>Testemunha 1</div>
            <div className="line"></div>
            <div className="role">Nome e assinatura</div>
          </div>

          <div className="sign">
            <div>Testemunha 2</div>
            <div className="line"></div>
            <div className="role">Nome e assinatura</div>
          </div>

        </div>

      </div>

      {/* ASSINATURAS */}

      <div className="section">

        <h2>Validações</h2>

        <div className="sign-grid">

          <div className="sign">
            <div>Gestor Imediato</div>
            <div className="role">Supervisor</div>
            <div className="line"></div>
          </div>

          <div className="sign">
            <div>RH</div>
            <div className="role">Gestão de Pessoas</div>
            <div className="line"></div>
          </div>

        </div>

      </div>

      {/* OBS */}

      <div className="section">

        <h2>Observações</h2>

        <div className="notes"></div>

      </div>

      {/* FOOTER */}

      <div style={{ marginTop: 14, fontSize: 10, color: "#444" }}>
        Documento interno • Controle de Medidas Disciplinares • {empresa}
      </div>

    </div>

  );

}