import toast from "react-hot-toast";
import { confirmDialog } from "../../ConfirmDialog";
import { SinergiaInternaAPI } from "../../../services/sinergiaInterna";
import { imprimirEtiquetasSinergia } from "../../../utils/imprimirEtiquetaSinergia";

/* =====================================================
   Ações da Sinergia Interna que combinam chamada à API + feedback + impressão.
   Cada função devolve true quando concluiu, pra tela decidir se recarrega.
===================================================== */

const mensagemDe = (e, padrao) => e?.response?.data?.message || padrao;

export async function imprimirQr(sinergia, tipo) {
  try {
    const etiqueta = await SinergiaInternaAPI.etiqueta(sinergia.idSinergia, tipo);
    await imprimirEtiquetasSinergia(etiqueta);
    return true;
  } catch (e) {
    toast.error(mensagemDe(e, "Não foi possível imprimir a etiqueta."));
    return false;
  }
}

/** Imprime UMA etiqueta para todo o lote (um bip confirma todos). */
export async function imprimirQrGrupo(idLote, tipo) {
  try {
    const etiqueta = await SinergiaInternaAPI.etiquetaGrupo(idLote, tipo);
    await imprimirEtiquetasSinergia(etiqueta);
    return true;
  } catch (e) {
    toast.error(mensagemDe(e, "Não foi possível imprimir a etiqueta do grupo."));
    return false;
  }
}

/** Confirma o envio (gera o QR de ida) e já abre a impressão da etiqueta. */
export async function enviarEImprimir(sinergia) {
  try {
    await SinergiaInternaAPI.enviar(sinergia.idSinergia);
  } catch (e) {
    toast.error(mensagemDe(e, "Não foi possível confirmar o envio."));
    return false;
  }
  toast.success(`Envio de ${sinergia.colaborador.nomeCompleto} confirmado`);
  // Quem faz parte de um grupo usa a etiqueta única do grupo (impressa uma vez, depois que todos forem enviados).
  if (sinergia.idLote) {
    toast("Faz parte de um grupo: use “QR do grupo” depois de enviar todos.", { icon: "ℹ️" });
    return true;
  }
  if (!(await imprimirQr(sinergia, "ida"))) toast("Use “Imprimir QR” para tentar de novo.", { icon: "ℹ️" });
  return true;
}

/** O líder do destino encerra o trabalho lá: gera o QR de retorno (a localização só volta com a leitura na origem). */
export async function finalizarEImprimir(sinergia) {
  const ok = await confirmDialog(
    `Finalizar a sinergia de ${sinergia.colaborador.nomeCompleto}?\n\nO colaborador continua em ${sinergia.destino.nome} até o retorno ser confirmado em ${sinergia.origem.nome} com o QR de retorno.`,
    { confirmText: "Finalizar" }
  );
  if (!ok) return false;
  try {
    await SinergiaInternaAPI.finalizar(sinergia.idSinergia);
  } catch (e) {
    toast.error(mensagemDe(e, "Não foi possível finalizar a sinergia."));
    return false;
  }
  toast.success("Sinergia finalizada. Aguardando o retorno físico.");
  if (sinergia.idLote) {
    toast("Faz parte de um grupo: use “QR do grupo” depois de finalizar todos.", { icon: "ℹ️" });
    return true;
  }
  if (!(await imprimirQr(sinergia, "retorno"))) toast("Use “Imprimir QR de retorno” para tentar de novo.", { icon: "ℹ️" });
  return true;
}

export async function reemitirEImprimir(sinergia, tipo) {
  const ok = await confirmDialog(
    "Gerar um novo QR Code?\n\nO QR anterior será invalidado e a etiqueta já impressa deixa de funcionar.",
    { danger: true, confirmText: "Gerar novo QR" }
  );
  if (!ok) return false;
  try {
    await SinergiaInternaAPI.reemitirQr(sinergia.idSinergia, tipo);
  } catch (e) {
    toast.error(mensagemDe(e, "Não foi possível reemitir o QR Code."));
    return false;
  }
  toast.success("Novo QR Code gerado");
  await imprimirQr(sinergia, tipo);
  return true;
}

// Separa o que vai numa etiqueta de grupo (2+ do mesmo lote) do que segue individual.
function separarPorLote(sinergias) {
  const porLote = new Map();
  const avulsas = [];
  sinergias.forEach((s) => {
    if (!s.idLote) return avulsas.push(s);
    if (!porLote.has(s.idLote)) porLote.set(s.idLote, []);
    porLote.get(s.idLote).push(s);
  });
  const lotes = [];
  porLote.forEach((lista, idLote) => (lista.length > 1 ? lotes.push({ idLote, lista }) : avulsas.push(...lista)));
  return { lotes, avulsas };
}

/** Envia várias (lote) e imprime: uma etiqueta por grupo e uma por colaborador avulso. */
export async function enviarVariasEImprimir(sinergias) {
  const etiquetas = [];
  const falhas = [];
  const { lotes, avulsas } = separarPorLote(sinergias);

  for (const { idLote, lista } of lotes) {
    let enviadas = 0;
    for (const s of lista) {
      try {
        await SinergiaInternaAPI.enviar(s.idSinergia);
        enviadas += 1;
      } catch (e) {
        falhas.push(`${s.colaborador.nomeCompleto}: ${mensagemDe(e, "erro ao enviar")}`);
      }
    }
    if (enviadas) {
      try {
        etiquetas.push(await SinergiaInternaAPI.etiquetaGrupo(idLote, "ida"));
      } catch (e) {
        falhas.push(`Grupo: ${mensagemDe(e, "sem etiqueta disponível")}`);
      }
    }
  }
  for (const s of avulsas) {
    try {
      await SinergiaInternaAPI.enviar(s.idSinergia);
      etiquetas.push(await SinergiaInternaAPI.etiqueta(s.idSinergia, "ida"));
    } catch (e) {
      falhas.push(`${s.colaborador.nomeCompleto}: ${mensagemDe(e, "erro ao enviar")}`);
    }
  }
  if (etiquetas.length) {
    try {
      await imprimirEtiquetasSinergia(etiquetas);
    } catch {
      toast.error("Envios confirmados, mas não foi possível abrir a impressão.");
    }
  }
  if (falhas.length) toast.error(falhas.join("\n"), { duration: 8000 });
  else toast.success(etiquetas.length === 1 ? "Envio confirmado" : `${etiquetas.length} envios confirmados`);
  return etiquetas.length > 0;
}

/** Imprime as etiquetas (ida ou retorno) de várias sinergias de uma vez: uma por grupo, uma por avulso. */
export async function imprimirVarias(sinergias) {
  const etiquetas = [];
  const { lotes, avulsas } = separarPorLote(sinergias);
  for (const { idLote, lista } of lotes) {
    const tipo = lista[0].status === "AGUARDANDO_RETORNO" ? "retorno" : "ida";
    try {
      etiquetas.push(await SinergiaInternaAPI.etiquetaGrupo(idLote, tipo));
    } catch (e) {
      toast.error(`Grupo: ${mensagemDe(e, "sem etiqueta disponível")}`);
    }
  }
  for (const s of avulsas) {
    const tipo = s.status === "AGUARDANDO_RETORNO" ? "retorno" : "ida";
    try {
      etiquetas.push(await SinergiaInternaAPI.etiqueta(s.idSinergia, tipo));
    } catch (e) {
      toast.error(`${s.colaborador.nomeCompleto}: ${mensagemDe(e, "sem etiqueta disponível")}`);
    }
  }
  if (!etiquetas.length) return false;
  try {
    await imprimirEtiquetasSinergia(etiquetas);
    return true;
  } catch {
    toast.error("Não foi possível abrir a impressão.");
    return false;
  }
}
