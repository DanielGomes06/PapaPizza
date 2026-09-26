/**
 * services/whatsapp.js
 * 📲 INTEGRAÇÃO COM WHATSAPP
 * Isola tudo relacionado a formatar e enviar mensagens para o
 * WhatsApp Business da loja. Hoje usa o link direto `wa.me`
 * (funciona sem backend); para automações (confirmação automática,
 * atualização de status), troque pela WhatsApp Business Cloud API
 * chamada a partir de um webhook no backend.
 */

import { STORE } from "../config.js";
import { money } from "../utils/format.js";

/** Link genérico de contato, usado no botão "Chamar no WhatsApp" da seção Contato. */
export function buildContactLink(message) {
  return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Monta o resumo do pedido e retorna o link `wa.me` pronto para abrir. */
export function buildWhatsappLink(order) {
  const itemsText = order.itens
    .map((i) => `• ${i.qty}x ${i.nome} (${i.sizeLabel}${i.crustName !== "Sem borda" ? ", borda " + i.crustName : ""})`)
    .join("\n");

  const enderecoText =
    order.modo === "delivery" && order.endereco
      ? `Endereço: ${order.endereco.rua}, ${order.endereco.numero} - ${order.endereco.bairro}${
          order.endereco.referencia ? " (Ref: " + order.endereco.referencia + ")" : ""
        }, Jacutinga - MG`
      : "Retirada no balcão - Centro, Jacutinga - MG";

  const message = [
    `Olá, Papa Pizza! 🍕 Segue meu pedido *#${order.id}*:`,
    "",
    itemsText,
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Taxa de entrega: ${money(order.taxaEntrega)}`,
    `Total: ${money(order.total)}`,
    `Pagamento: ${order.pagamento}`,
    "",
    `Nome: ${order.cliente.nome}`,
    `Telefone: ${order.cliente.telefone}`,
    enderecoText,
  ].join("\n");

  return buildContactLink(message);
}
