/**
 * admin/navigation.js
 * Alterna entre a visão do cliente e a área administrativa, e entre
 * os painéis internos do admin (Dashboard / Cardápio / Pedidos).
 * É o único módulo que conhece os três painéis do admin ao mesmo
 * tempo, porque orquestrar essa entrada é sua única responsabilidade.
 */
import { $, $$ } from "../utils/dom.js";
import { renderAdminDashboard } from "./dashboard.js";
import { renderAdminMenuTable } from "./menu-crud.js";
import { renderAdminOrders } from "./orders.js";

function enterAdmin() {
  $("#clientView").hidden = true;
  $("#adminView").hidden = false;
  renderAdminDashboard();
  renderAdminMenuTable();
  renderAdminOrders();
  window.scrollTo(0, 0);
}

function exitAdmin() {
  $("#adminView").hidden = true;
  $("#clientView").hidden = false;
  window.scrollTo(0, 0);
}

function switchAdminPanel(panelId) {
  $$(".admin-nav-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.panel === panelId));
  $$(".admin-panel").forEach((p) => p.classList.toggle("is-active", p.id === "panel-" + panelId));
}

export function initAdminNavigation() {
  $("#adminEntryBtn").addEventListener("click", enterAdmin);
  $("#adminExitBtn").addEventListener("click", exitAdmin);
  $("#adminNav").addEventListener("click", (e) => {
    const btn = e.target.closest(".admin-nav-btn");
    if (!btn) return;
    switchAdminPanel(btn.dataset.panel);
  });
}
