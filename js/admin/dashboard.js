/**
 * admin/dashboard.js
 * Resumo do dia (vendas, pedidos, ticket médio) e ranking das pizzas
 * mais vendidas. Se atualiza sozinho a cada novo pedido, via evento
 * 'order:created' — não precisa que o checkout do cliente o conheça.
 */
import { $ } from "../utils/dom.js";
import { money } from "../utils/format.js";
import { state } from "../state/store.js";
import { on } from "../utils/events.js";

export function renderAdminDashboard() {
  const today = new Date().toDateString();
  const todayOrders = state.orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const sales = todayOrders.reduce((s, o) => s + o.total, 0);
  const avg = todayOrders.length ? sales / todayOrders.length : 0;

  $("#statSales").textContent = money(sales);
  $("#statOrders").textContent = todayOrders.length;
  $("#statAvg").textContent = money(avg);

  const ranked = [...state.menu].filter((p) => p.vendas > 0).sort((a, b) => b.vendas - a.vendas).slice(0, 5);
  $("#rankList").innerHTML = ranked.length
    ? ranked.map((p) => `<li>${p.nome} <span class="rank-count">— ${p.vendas} vendida${p.vendas > 1 ? "s" : ""}</span></li>`).join("")
    : '<li class="muted">Ainda sem vendas registradas.</li>';
}

export function initAdminDashboard() {
  on("order:created", renderAdminDashboard);
}
