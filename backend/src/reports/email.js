const nodemailer = require("nodemailer")

async function sendReportEmail({
  to,
  image,
  assunto,
  periodo,
  turno,
  user,
}) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  const destinatarios = Array.isArray(to) ? to : [to];

  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2 style="color:#FA4C00;">Relatório Operacional</h2>

      <p><strong>Período:</strong> ${periodo}</p>
      <p><strong>Turno:</strong> ${turno}</p>

      <hr style="margin:16px 0;border:1px solid #eee;" />

      <img
        src="cid:reportImage"
        style="max-width:100%;border-radius:8px;"
      />
    </div>
  `

  await transporter.sendMail({
    from: `"Relatórios Operacionais" <${process.env.GMAIL_USER}>`,
    to: destinatarios,
    subject: `${assunto} • ${periodo} • Turno ${turno}`,
    html,
    attachments: [
      {
        filename: "relatorio-operacional.png",
        content: image.replace(/^data:image\/png;base64,/, ""),
        encoding: "base64",
        cid: "reportImage",
      },
    ],
  })
}

/* =====================================================
   ENVIO DE EVIDÊNCIA — MEDIDA DISCIPLINAR
===================================================== */

async function sendMedidaDisciplinarEmail({
  emailRh,
  nomeColaborador,
  matricula,
  tipoMedida,
  violacao,
  dataAplicacao,
  idMedida,
  pdfBuffer,
}) {
  // Validar credenciais do Gmail
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Credenciais do Gmail não configuradas (GMAIL_USER ou GMAIL_APP_PASSWORD)");
  }

  // Validar destinatários
  if (!emailRh || (Array.isArray(emailRh) && emailRh.length === 0)) {
    throw new Error("Nenhum destinatário de e-mail fornecido");
  }

  // Validar PDF
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error("PDF vazio ou inválido");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  // Verificar conexão com o servidor SMTP
  try {
    await transporter.verify();
    console.log("✅ Conexão SMTP verificada com sucesso");
  } catch (verifyError) {
    console.error("❌ Erro ao verificar conexão SMTP:", verifyError);
    throw new Error(`Falha na autenticação do Gmail: ${verifyError.message}`);
  }

  const dataFormatada = new Date(dataAplicacao).toLocaleDateString("pt-BR")

  const tipoLabel = {
    ADVERTENCIA: "Advertência",
    SUSPENSAO: "Suspensão",
    DEMISSAO: "Demissão por Justa Causa",
  }[tipoMedida] || tipoMedida

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2 style="color:#FA4C00;">Evidência de Medida Disciplinar</h2>
      <p>Segue em anexo a evidência da medida disciplinar aplicada e assinada.</p>
      <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
        <tr style="background:#f5f5f5;">
          <td style="padding:8px 12px; font-weight:bold; width:40%;">Colaborador</td>
          <td style="padding:8px 12px;">${nomeColaborador}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px; font-weight:bold;">Matrícula</td>
          <td style="padding:8px 12px;">${matricula || "—"}</td>
        </tr>
        <tr style="background:#f5f5f5;">
          <td style="padding:8px 12px; font-weight:bold;">Tipo de Medida</td>
          <td style="padding:8px 12px;">${tipoLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px; font-weight:bold;">Violação</td>
          <td style="padding:8px 12px;">${violacao}</td>
        </tr>
        <tr style="background:#f5f5f5;">
          <td style="padding:8px 12px; font-weight:bold;">Data de Aplicação</td>
          <td style="padding:8px 12px;">${dataFormatada}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px; font-weight:bold;">Nº da Medida</td>
          <td style="padding:8px 12px;">#${idMedida}</td>
        </tr>
      </table>
      <p style="color:#888; font-size:12px;">
        Este e-mail foi gerado automaticamente pelo sistema de Gestão de Colaboradores.
      </p>
    </div>
  `

  try {
    const info = await transporter.sendMail({
      from: `"Gestão de Colaboradores" <${process.env.GMAIL_USER}>`,
      to: emailRh,
      subject: `[MD #${idMedida}] Evidência — ${tipoLabel} — ${nomeColaborador}`,
      html,
      attachments: [
        {
          filename: `medida-disciplinar-${idMedida}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    })
    console.log(`✅ Email enviado - MessageID: ${info.messageId}`);
    return info;
  } catch (sendError) {
    console.error("❌ Erro ao enviar email via Nodemailer:", sendError);
    throw new Error(`Falha no envio do e-mail: ${sendError.message}`);
  }
}

/* =====================================================
   ENVIO DE E-MAIL — SOLICITAÇÃO DE TREINAMENTO
===================================================== */

async function sendSolicitacaoTreinamentoEmail({ to, solicitacao }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Credenciais do Gmail não configuradas (GMAIL_USER ou GMAIL_APP_PASSWORD)");
  }

  const destinatarios = Array.isArray(to) ? to : [to];
  if (destinatarios.length === 0) {
    throw new Error("Nenhum destinatário de e-mail fornecido");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  try {
    await transporter.verify();
  } catch (verifyError) {
    console.error("❌ Erro ao verificar conexão SMTP:", verifyError);
    throw new Error(`Falha na autenticação do Gmail: ${verifyError.message}`);
  }

  const dataFormatada = new Date(solicitacao.dataTreinamento).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${frontendUrl}/treinamentos/solicitacoes/${solicitacao.idSolicitacao}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2 style="color:#FA4C00;">Nova Solicitação de Treinamento</h2>
      <p>Uma nova solicitação de treinamento aguarda sua aprovação.</p>
      <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
        <tr style="background:#f5f5f5;">
          <td style="padding:8px 12px; font-weight:bold; width:40%;">Tema</td>
          <td style="padding:8px 12px;">${solicitacao.tema}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px; font-weight:bold;">Processo</td>
          <td style="padding:8px 12px;">${solicitacao.processo}</td>
        </tr>
        <tr style="background:#f5f5f5;">
          <td style="padding:8px 12px; font-weight:bold;">Data</td>
          <td style="padding:8px 12px;">${dataFormatada}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px; font-weight:bold;">Horário</td>
          <td style="padding:8px 12px;">${solicitacao.horarioInicio} - ${solicitacao.horarioFim}</td>
        </tr>
        <tr style="background:#f5f5f5;">
          <td style="padding:8px 12px; font-weight:bold;">Solicitante</td>
          <td style="padding:8px 12px;">${solicitacao.solicitanteNome || "—"}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px; font-weight:bold;">Setor</td>
          <td style="padding:8px 12px;">${solicitacao.setorNome || "—"}</td>
        </tr>
        <tr style="background:#f5f5f5;">
          <td style="padding:8px 12px; font-weight:bold;">Participantes</td>
          <td style="padding:8px 12px;">${solicitacao.qtdParticipantes ?? 0}</td>
        </tr>
      </table>
      <a href="${link}" style="display:inline-block; background:#FA4C00; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">
        Visualizar Solicitação
      </a>
      <p style="color:#888; font-size:12px; margin-top:16px;">
        Este e-mail foi gerado automaticamente pelo sistema de Gestão de Colaboradores.
      </p>
    </div>
  `

  try {
    const info = await transporter.sendMail({
      from: `"Gestão de Colaboradores" <${process.env.GMAIL_USER}>`,
      to: destinatarios,
      subject: `[Solicitação de Treinamento] ${solicitacao.tema} — ${dataFormatada}`,
      html,
    })
    console.log(`✅ Email enviado - MessageID: ${info.messageId}`);
    return info;
  } catch (sendError) {
    console.error("❌ Erro ao enviar email via Nodemailer:", sendError);
    throw new Error(`Falha no envio do e-mail: ${sendError.message}`);
  }
}

module.exports = {
  sendReportEmail,
  sendMedidaDisciplinarEmail,
  sendSolicitacaoTreinamentoEmail,
}
