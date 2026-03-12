import { renderToStaticMarkup } from "react-dom/server";
import CartaMedidaDisciplinarTemplate from "../components/medidas_disciplinares/CartamedidaDisciplinarTemplate";

/**
 * Abre uma janela de impressão com a Carta de Medida Disciplinar formatada
 * @param {Object} medida - Objeto da medida disciplinar
 * @param {Object} options - Opções adicionais (empresa, unidade)
 */
export function printCartaMedidaDisciplinar(medida, options = {}) {
  if (!medida) {
    console.error("Medida disciplinar não fornecida");
    return;
  }

  try {
    // Renderizar o componente React para HTML estático
    const htmlString = renderToStaticMarkup(
      <CartaMedidaDisciplinarTemplate
        medida={medida}
        empresa={options.empresa}
        unidade={options.unidade}
      />
    );

    // Criar janela de impressão
    const printWindow = window.open("", "_blank");
    
    if (!printWindow) {
      alert("Por favor, permita pop-ups para imprimir a carta");
      return;
    }

    // Escrever HTML na janela
    printWindow.document.write(htmlString);
    printWindow.document.close();

    // Aguardar carregamento e imprimir
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };

  } catch (error) {
    console.error("Erro ao gerar carta de medida disciplinar:", error);
    alert("Erro ao gerar carta. Verifique o console para mais detalhes.");
  }
}