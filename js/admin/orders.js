/**
 * admin/orders.js
 * Lista de pedidos recebidos e atualização do status de cada um.
 * Se atualiza sozinho a cada novo pedido, via evento 'order:created'.
 */
import { $ } from "../utils/dom.js";
import { money } from "../utils/format.js";
import { ORDER_STATUSES } from "../config.js";
import { state } from "../state/store.js";
import { db } from "../services/database.js";
import { toast } from "../utils/toast.js";
import { on } from "../utils/events.js";

function statusClass(status) {
  return { Pendente: "pendente", "Em Preparo": "preparo", "Saiu para Entrega": "entrega", Concluído: "concluido" }[status] || "pendente";
}

export function renderAdminOrders() {
  const body = $("#ordersTableBody");
  $("#emptyOrders").style.display = state.orders.length ? "none" : "block";

  body.innerHTML = state.orders
    .map((o) => {
      const itemsSummary = o.itens.map((i) => `${i.qty}x ${i.nome}`).join(", ");
      return `
      <tr>
        <td>#${o.id}</td>
        <td>${o.cliente.nome}</td>
        <td>${itemsSummary}</td>
        <td>${money(o.total)}</td>
        <td><span class="badge ${statusClass(o.status)}">${o.status}</span></td>
        <td>
          <select class="status-select" data-order="${o.id}">
            ${ORDER_STATUSES.map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
      </tr>`;
    })
    .join("");
}

function updateOrderStatus(orderId, status) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;
  order.status = status;
  // 🔌 CONEXÃO COM BANCO DE DADOS AQUI — persistir mudança de status do pedido
  db.saveOrders(state.orders);
  renderAdminOrders();
  toast(`Pedido #${orderId} atualizado para "${status}".`);
}

export function initAdminOrders() {
  on("order:created", renderAdminOrders);

  $("#ordersTableBody").addEventListener("change", (e) => {
    const select = e.target.closest("[data-order]");
    if (!select) return;
    updateOrderStatus(select.dataset.order, select.value);
  });
}
