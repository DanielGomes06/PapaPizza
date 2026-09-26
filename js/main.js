/**
 * main.js
 * Ponto de entrada da aplicação. É o único arquivo que conhece e
 * inicializa todos os módulos — cada módulo, por sua vez, não sabe
 * nada sobre quem o chamou. Se um dia esse app crescer para várias
 * páginas, é aqui (e só aqui) que a montagem muda.
 */
import { $ } from "./utils/dom.js";
import { buildContactLink } from "./services/whatsapp.js";

import { initStoreStatus } from "./features/store-status.js";
import { initMenu } from "./features/menu.js";
import { initCustomizeModal } from "./features/customize-modal.js";
import { initCart } from "./features/cart.js";
import { initCheckout } from "./features/checkout.js";

import { initAdminNavigation } from "./admin/navigation.js";
import { initAdminDashboard } from "./admin/dashboard.js";
import { initAdminMenuCrud } from "./admin/menu-crud.js";
import { initAdminOrders } from "./admin/orders.js";

function init() {
  $("#footerYear").textContent = new Date().getFullYear();
  $("#whatsappContactBtn").href = buildContactLink("Olá, Papa Pizza! Gostaria de fazer um pedido.");

  // Loja (cliente)
  initStoreStatus();
  initMenu();
  initCustomizeModal();
  initCart();
  initCheckout();

  // Painel administrativo
  initAdminNavigation();
  initAdminDashboard();
  initAdminMenuCrud();
  initAdminOrders();
}

document.addEventListener("DOMContentLoaded", init);
