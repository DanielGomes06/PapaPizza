/**
 * features/menu.js
 * Renderiza a vitrine de pizzas no site do cliente e controla os
 * filtros por categoria. Se inscreve no evento 'menu:updated' para
 * se atualizar automaticamente sempre que o admin cadastrar, editar
 * ou remover algum item — sem precisar que o admin importe este
 * módulo diretamente.
 */
import { $, $$ } from "../utils/dom.js";
import { money } from "../utils/format.js";
import { state } from "../state/store.js";
import { on } from "../utils/events.js";
import { openCustomize } from "./customize-modal.js";

export function renderMenu() {
  const grid = $("#menuGrid");
  const items = state.menu.filter((p) => {
    if (p.status !== "ativo") return false;
    if (state.filter === "todas") return true;
    return p.categoria === state.filter;
  });

  if (items.length === 0) {
    grid.innerHTML = '<p class="menu-empty">Nenhum item nessa categoria por enquanto.</p>';
    return;
  }

  grid.innerHTML = items
    .map((p) => {
      const isDrink = p.categoria === "bebidas";
      const priceLabel = isDrink ? money(p.precoGrande) : money(p.precoBrotinho);
      return `
      <article class="pizza-card" data-id="${p.id}">
        <div class="pizza-media">
          <img src="${p.imagem}" alt="${p.nome}" loading="lazy">
          ${p.tag ? `<span class="pizza-tag">${p.tag}</span>` : ""}
        </div>
        <div class="pizza-body">
          <h3>${p.nome}</h3>
          <p class="pizza-ingredients">${p.ingredientes}</p>
          <div class="pizza-footer">
            <div class="pizza-price">
              <span class="from">${isDrink ? "unidade" : "a partir de"}</span>
              <span class="value">${priceLabel}</span>
            </div>
            <button class="add-btn" data-add="${p.id}" aria-label="Adicionar ${p.nome}">+</button>
          </div>
        </div>
      </article>`;
    })
    .join("");
}

export function initMenu() {
  renderMenu();
  on("menu:updated", renderMenu);

  $("#filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    $$(".filter-chip").forEach((c) => c.classList.remove("is-active"));
    btn.classList.add("is-active");
    state.filter = btn.dataset.filter;
    renderMenu();
  });

  $("#menuGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    openCustomize(btn.dataset.add);
  });
}
