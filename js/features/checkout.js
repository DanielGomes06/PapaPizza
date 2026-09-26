/**
 * features/checkout.js
 * Wizard de checkout (Dados → Entrega → Pagamento → Confirmação),
 * geração do pedido final e disparo do evento 'order:created', que o
 * admin escuta para atualizar dashboard e lista de pedidos — sem que
 * este módulo precise conhecer o admin.
 */
import { $, $$ } from "../utils/dom.js";
import { money } from "../utils/format.js";
import { state, cartTotals } from "../state/store.js";
import { db } from "../services/database.js";
import { buildWhatsappLink } from "../services/whatsapp.js";
import { toast } from "../utils/toast.js";
import { on, emit } from "../utils/events.js";
import { renderCart } from "./cart.js";

function openCheckout() {
  state.checkoutStep = 1;
  state.payment = null;
  goToStep(1);

  $("#pickupNotice").hidden = state.mode !== "pickup";
  $("#deliveryFields").hidden = state.mode === "pickup";

  $("#checkoutOverlay").classList.add("is-open");
}

function closeCheckoutModal() {
  $("#checkoutOverlay").classList.remove("is-open");
}

function goToStep(n) {
  state.checkoutStep = n;
  $$(".checkout-step").forEach((p) => p.classList.toggle("is-active", Number(p.dataset.stepPanel) === n));
  $$(".step").forEach((s) => {
    const num = Number(s.dataset.step);
    s.classList.toggle("is-active", num === n);
    s.classList.toggle("is-done", num < n);
  });
  if (n === 4) renderOrderReview();
}

function validateStep1() {
  const name = $("#custName").value.trim();
  const phone = $("#custPhone").value.trim();
  if (!name || !phone) {
    toast("Preencha nome e telefone para continuar.", "error");
    return false;
  }
  return true;
}

function validateStep2() {
  if (state.mode === "pickup") return true;
  const street = $("#custStreet").value.trim();
  const number = $("#custNumber").value.trim();
  const neighborhood = $("#custNeighborhood").value.trim();
  if (!street || !number || !neighborhood) {
    toast("Preencha o endereço completo para continuar.", "error");
    return false;
  }
  return true;
}

function selectPayment(method) {
  state.payment = method;
  $$(".payment-chip").forEach((c) => c.classList.toggle("is-active", c.dataset.payment === method));
  $("#changeForField").hidden = method !== "dinheiro";
  $("#pixNotice").hidden = method !== "pix";
}

function renderOrderReview() {
  const { subtotal, fee, total } = cartTotals();
  const lines = state.cart
    .map((i) => `<div class="review-line"><span>${i.qty}x ${i.nome} (${i.sizeLabel})</span><span>${money(i.unitPrice * i.qty)}</span></div>`)
    .join("");
  const paymentLabel = { pix: "PIX", cartao: "Cartão na entrega", dinheiro: "Dinheiro" }[state.payment] || "—";

  $("#orderReview").innerHTML = `
    ${lines}
    <div class="review-line"><span>Taxa de entrega</span><span>${money(fee)}</span></div>
    <div class="review-line review-total"><span>Total</span><span>${money(total)}</span></div>
    <div class="review-line"><span>Pagamento</span><span>${paymentLabel}</span></div>
    <div class="review-line"><span>Recebimento</span><span>${state.mode === "delivery" ? "Entrega em Jacutinga" : "Retirada no balcão"}</span></div>
  `;

  $("#pixBox").hidden = state.payment !== "pix";
  if (state.payment === "pix") {
    // 💳 API DE PAGAMENTO AQUI
    // Gerar cobrança PIX real (Mercado Pago / Asaas) e exibir o QR Code retornado:
    //   const cobranca = await fetch('/api/pagamentos/pix', { method: 'POST', body: JSON.stringify({ valor: total, pedidoId }) });
    //   const { qrCodeBase64, copiaECola } = await cobranca.json();
    // Configure também o webhook de confirmação de pagamento no backend.
  }
}

function confirmOrder() {
  const { subtotal, fee, total } = cartTotals();
  const order = {
    id: "PP" + Date.now().toString().slice(-6),
    createdAt: new Date().toISOString(),
    cliente: { nome: $("#custName").value.trim(), telefone: $("#custPhone").value.trim() },
    modo: state.mode,
    endereco:
      state.mode === "delivery"
        ? {
            rua: $("#custStreet").value.trim(),
            numero: $("#custNumber").value.trim(),
            bairro: $("#custNeighborhood").value.trim(),
            referencia: $("#custRef").value.trim(),
          }
        : null,
    pagamento: state.payment,
    trocoPara: state.payment === "dinheiro" ? $("#changeFor").value : null,
    itens: state.cart.map((i) => ({ ...i })),
    subtotal,
    taxaEntrega: fee,
    total,
    status: "Pendente",
  };

  // 🔌 CONEXÃO COM BANCO DE DADOS AQUI
  // Persistir o pedido de verdade, ex:
  //   await fetch('/api/pedidos', { method: 'POST', body: JSON.stringify(order) });
  // (Supabase: supabase.from('pedidos').insert(order))
  state.orders.unshift(order);
  db.saveOrders(state.orders);

  // Atualiza contagem de vendas por pizza (para o ranking do dashboard)
  order.itens.forEach((i) => {
    const p = state.menu.find((m) => m.id === i.pizzaId);
    if (p) p.vendas = (p.vendas || 0) + i.qty;
  });
  db.saveMenu(state.menu);

  closeCheckoutModal();
  showSuccess(order);

  state.cart = [];
  renderCart();

  // Avisa o admin (dashboard + lista de pedidos) sem depender dele diretamente.
  emit("order:created", order);
}

function showSuccess(order) {
  $("#successOrderId").textContent = "#" + order.id;
  $("#successWhatsappBtn").href = buildWhatsappLink(order);
  $("#successOverlay").classList.add("is-open");
}

function closeSuccess() {
  $("#successOverlay").classList.remove("is-open");
}

export function initCheckout() {
  on("checkout:open", openCheckout);

  $("#toStep2").addEventListener("click", () => validateStep1() && goToStep(2));
  $("#toStep3").addEventListener("click", () => validateStep2() && goToStep(3));
  $("#toStep4").addEventListener("click", () => {
    if (!state.payment) {
      toast("Escolha uma forma de pagamento.", "error");
      return;
    }
    goToStep(4);
  });
  $$("[data-back]").forEach((b) => b.addEventListener("click", () => goToStep(Number(b.dataset.back))));

  $("#closeCheckout").addEventListener("click", closeCheckoutModal);
  $("#checkoutOverlay").addEventListener("click", (e) => {
    if (e.target.id === "checkoutOverlay") closeCheckoutModal();
  });

  $("#paymentOptions").addEventListener("click", (e) => {
    const chip = e.target.closest(".payment-chip");
    if (!chip) return;
    selectPayment(chip.dataset.payment);
  });

  $("#confirmOrderBtn").addEventListener("click", confirmOrder);

  $("#closeSuccessBtn").addEventListener("click", closeSuccess);
  $("#successOverlay").addEventListener("click", (e) => {
    if (e.target.id === "successOverlay") closeSuccess();
  });
}
