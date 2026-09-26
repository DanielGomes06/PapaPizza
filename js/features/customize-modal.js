/**
 * features/customize-modal.js
 * Modal aberto ao clicar em "+" num card do cardápio: escolha de
 * tamanho, borda recheada, observações e quantidade antes de
 * adicionar o item ao carrinho.
 */
import { SIZES } from "../config.js";
import { $, $$ } from "../utils/dom.js";
import { money } from "../utils/format.js";
import { state } from "../state/store.js";
import { addToCart } from "./cart.js";

export function openCustomize(pizzaId) {
  const pizza = state.menu.find((p) => p.id === pizzaId);
  if (!pizza) return;

  state.customize = {
    pizza,
    size: pizza.categoria === "bebidas" ? { id: "unico", label: "Unidade", key: "precoGrande" } : SIZES.padrao[1],
    crust: { name: "Sem borda", price: 0 },
    qty: 1,
    notes: "",
  };

  $("#customizeImg").src = pizza.imagem;
  $("#customizeImg").alt = pizza.nome;
  $("#customizeTitle").textContent = pizza.nome;
  $("#customizeIngredients").textContent = pizza.ingredientes;
  $("#qtyValue").textContent = "1";
  $("#customizeNotes").value = "";

  const isDrink = pizza.categoria === "bebidas";
  $("#sizeGroup").hidden = isDrink;
  $("#crustGroup").hidden = isDrink;

  if (!isDrink) {
    $("#sizeChips").innerHTML = SIZES.padrao
      .map(
        (s) => `<button class="chip ${s.id === state.customize.size.id ? "is-active" : ""}" data-size="${s.id}">
          ${s.label} <small>${money(pizza[s.key])}</small>
        </button>`
      )
      .join("");
  }

  $$("#crustChips .chip").forEach((c) => c.classList.remove("is-active"));
  $$("#crustChips .chip")[0].classList.add("is-active");

  updateCustomizePrice();
  $("#customizeOverlay").classList.add("is-open");
}

function updateCustomizePrice() {
  const { pizza, size, crust, qty } = state.customize;
  if (!pizza) return;
  const base = pizza[size.key];
  const unit = base + crust.price;
  $("#customizePrice").textContent = money(unit * qty);
}

function closeCustomize() {
  $("#customizeOverlay").classList.remove("is-open");
}

export function initCustomizeModal() {
  $("#closeCustomize").addEventListener("click", closeCustomize);
  $("#customizeOverlay").addEventListener("click", (e) => {
    if (e.target.id === "customizeOverlay") closeCustomize();
  });

  $("#sizeChips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    $$("#sizeChips .chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    state.customize.size = SIZES.padrao.find((s) => s.id === chip.dataset.size);
    updateCustomizePrice();
  });

  $("#crustChips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    $$("#crustChips .chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    state.customize.crust = { name: chip.dataset.crust, price: parseFloat(chip.dataset.price) };
    updateCustomizePrice();
  });

  $("#customizeNotes").addEventListener("input", (e) => {
    state.customize.notes = e.target.value;
  });

  $("#qtyMinus").addEventListener("click", () => {
    state.customize.qty = Math.max(1, state.customize.qty - 1);
    $("#qtyValue").textContent = state.customize.qty;
    updateCustomizePrice();
  });
  $("#qtyPlus").addEventListener("click", () => {
    state.customize.qty = Math.min(20, state.customize.qty + 1);
    $("#qtyValue").textContent = state.customize.qty;
    updateCustomizePrice();
  });

  $("#confirmAddBtn").addEventListener("click", () => {
    addToCart(state.customize);
    closeCustomize();
  });
}
