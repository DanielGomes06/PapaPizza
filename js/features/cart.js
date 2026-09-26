/**
 * features/cart.js
 * Estado e UI do carrinho lateral (drawer), incluindo o seletor de
 * modo (entrega/retirada), que afeta diretamente o cálculo do total.
 *
 * Não importa checkout.js diretamente — ao clicar em "Ir para o
 * checkout", apenas emite o evento 'checkout:open'. Isso evita uma
 * dependência circular (checkout.js precisa ler o carrinho e chamar
 * renderCart() depois de confirmar o pedido).
 */
import { $, $$ } from "../utils/dom.js";
import { money } from "../utils/format.js";
import { state, cartTotals } from "../state/store.js";
import { toast } from "../utils/toast.js";
import { emit } from "../utils/events.js";

export function addToCart({ pizza, size, crust, qty, notes }) {
  const unitPrice = pizza[size.key] + crust.price;

  state.cart.push({
    cartId: "cart-" + Math.random().toString(36).slice(2, 9),
    pizzaId: pizza.id,
    nome: pizza.nome,
    imagem: pizza.imagem,
    sizeLabel: size.label,
    crustName: crust.name,
    notes: notes.trim(),
    qty,
    unitPrice,
  });

  renderCart();
  bumpCartIcon();
  toast(`${pizza.nome} adicionada ao pedido!`);
}

function removeFromCart(cartId) {
  state.cart = state.cart.filter((i) => i.cartId !== cartId);
  renderCart();
}

function bumpCartIcon() {
  const btn = $("#cartBtn");
  btn.classList.remove("bump");
  void btn.offsetWidth; // força reflow para reiniciar a animação
  btn.classList.add("bump");
}

export function renderCart() {
  const count = state.cart.reduce((s, i) => s + i.qty, 0);
  $("#cartBadge").textContent = count;

  const itemsWrap = $("#cartItems");
  const empty = $("#cartEmpty");
  const summary = $("#cartSummary");

  if (state.cart.length === 0) {
    itemsWrap.innerHTML = "";
    empty.style.display = "flex";
    summary.style.display = "none";
    return;
  }
  empty.style.display = "none";
  summary.style.display = "block";

  itemsWrap.innerHTML = state.cart
    .map((i) => {
      const details = [i.sizeLabel, i.crustName !== "Sem borda" ? "Borda " + i.crustName : null, i.notes || null]
        .filter(Boolean)
        .join(" · ");
      return `
      <div class="cart-item">
        <img src="${i.imagem}" alt="${i.nome}">
        <div class="cart-item-info">
          <h4>${i.qty}x ${i.nome}</h4>
          <p class="cart-item-meta">${details}</p>
          <div class="cart-item-row">
            <span class="cart-item-price">${money(i.unitPrice * i.qty)}</span>
            <button class="cart-item-remove" data-remove="${i.cartId}">Remover</button>
          </div>
        </div>
      </div>`;
    })
    .join("");

  const { subtotal, fee, total } = cartTotals();
  $("#cartSubtotal").textContent = money(subtotal);
  $("#deliveryFeeLabel").textContent = state.mode === "delivery" ? "Taxa de entrega (Jacutinga)" : "Retirada no balcão";
  $("#cartDeliveryFee").textContent = money(fee);
  $("#cartTotal").textContent = money(total);
}

function openCart() {
  $("#cartOverlay").classList.add("is-open");
}
function closeCart() {
  $("#cartOverlay").classList.remove("is-open");
}

function setMode(mode) {
  state.mode = mode;
  $$(".mode-btn").forEach((b) => {
    const active = b.dataset.mode === mode;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", active);
  });
  renderCart();
}

export function initCart() {
  renderCart();

  $("#cartBtn").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#cartOverlay").addEventListener("click", (e) => {
    if (e.target.id === "cartOverlay") closeCart();
  });
  $("#cartItems").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    removeFromCart(btn.dataset.remove);
  });

  $("#checkoutBtn").addEventListener("click", () => {
    if (state.cart.length === 0) return;
    closeCart();
    emit("checkout:open");
  });

  $("#modeSwitch").addEventListener("click", (e) => {
    const btn = e.target.closest(".mode-btn");
    if (!btn) return;
    setMode(btn.dataset.mode);
  });
}
