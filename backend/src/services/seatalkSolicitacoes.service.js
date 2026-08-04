const axios = require("axios")
const { createSeatalkError, getSolution } = require("../utils/seatalkErrors")

// Cache do token de acesso deste bot (App separado do bot de relatórios)
let cachedToken = null
let tokenExpiry = null

async function getAccessToken() {
  if (cachedToken && tokenExpiry && tokenExpiry > Date.now()) {
    return cachedToken
  }

  const appId = process.env.SEATALK_SOLICITACOES_APP_ID
  const appSecret = process.env.SEATALK_SOLICITACOES_APP_SECRET

  if (!appId || !appSecret) {
    throw new Error(
      "SEATALK_SOLICITACOES_APP_ID e SEATALK_SOLICITACOES_APP_SECRET devem estar configurados no .env"
    )
  }

  const response = await axios.post(
    "https://openapi.seatalk.io/auth/app_access_token",
    { app_id: appId, app_secret: appSecret },
    { headers: { "Content-Type": "application/json" }, timeout: 10000 }
  )

  if (response.data.code !== 0) {
    const error = createSeatalkError(response.data)
    console.error("❌ [SEATALK-SOLICITACOES] Erro ao obter token:", error.message, "-", getSolution(response.data.code))
    throw error
  }

  if (!response.data.app_access_token) {
    throw new Error("Resposta da API não contém app_access_token")
  }

  cachedToken = response.data.app_access_token
  const expiresIn = response.data.expire
    ? response.data.expire - Math.floor(Date.now() / 1000)
    : 7200

  tokenExpiry = Date.now() + (expiresIn - 60) * 1000

  return cachedToken
}

/**
 * Envia uma mensagem de texto para o grupo de notificações de Solicitações.
 * Best-effort: nunca deve derrubar o fluxo principal (criação/aprovação/reprovação)
 * que a chamou — quem chama deve envolver isso em try/catch e apenas logar o erro.
 * @param {string} text - Conteúdo da mensagem
 * @param {object} [options]
 * @param {string[]} [options.mentionEmails] - E-mails a mencionar (@) na mensagem
 */
async function sendSolicitacaoNotification(text, options = {}) {
  const { mentionEmails = [] } = options;
  const groupId = process.env.SEATALK_SOLICITACOES_GROUP_ID

  if (!groupId) {
    throw new Error("SEATALK_SOLICITACOES_GROUP_ID não está configurado no .env")
  }

  const accessToken = await getAccessToken()

  const emailsValidos = mentionEmails.filter(Boolean)

  const response = await axios.post(
    "https://openapi.seatalk.io/messaging/v2/group_chat",
    {
      group_id: groupId,
      message: {
        tag: "text",
        text: {
          format: 1, // 1 = markdown (título, lista, divisor, citação, link), 2 = texto puro
          content: text,
          ...(emailsValidos.length > 0 ? { mentioned_email_list: emailsValidos } : {}),
        },
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 15000,
    }
  )

  if (response.data.code !== 0) {
    const error = createSeatalkError(response.data)
    console.error("❌ [SEATALK-SOLICITACOES] Erro ao enviar mensagem:", error.message, "-", getSolution(response.data.code))
    throw error
  }

  return { success: true, data: response.data }
}

module.exports = {
  sendSolicitacaoNotification,
}
