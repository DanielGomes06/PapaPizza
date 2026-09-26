/**
 * admin/menu-crud.js
 * Cadastro de novas pizzas e gerenciamento das já existentes.
 * Ao salvar, emite 'menu:updated' — é assim que o cardápio do
 * cliente (features/menu.js) descobre que precisa se redesenhar,
 * sem que este módulo precise importá-lo diretamente.
 */
import { $ } from "../utils/dom.js";
import { money, uid } from "../utils/format.js";
import { CATEGORY_LABEL } from "../config.js";
import { state } from "../state/store.js";
import { db } from "../services/database.js";
import { toast } from "../utils/toast.js";
import { emit } from "../utils/events.js";

export function renderAdminMenuTable() {
  const body = $("#menuTableBody");
  body.innerHTML = state.menu
    .map(
      (p) => `
    <tr data-row="${p.id}">
      <td>${p.nome}</td>
      <td>${CATEGORY_LABEL[p.categoria] || p.categoria}</td>
      <td>${money(p.precoBrotinho)}</td>
      <td>${money(p.precoGrande)}</td>
      <td><span class="badge ${p.status}">${p.status === "ativo" ? "Ativo" : "Inativo"}</span></td>
      <td>
        <button class="icon-link-btn" data-toggle="${p.id}">${p.status === "ativo" ? "Desativar" : "Ativar"}</button>
        &nbsp;·&nbsp;
        <button class="icon-link-btn" data-delete="${p.id}">Excluir</button>
      </td>
    </tr>`
    )
    .join("");
}

function handlePizzaFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);

  const novaPizza = {
    id: uid("pz"),
    nome: data.get("nome").trim(),
    categoria: data.get("categoria"),
    ingredientes: data.get("ingredientes").trim(),
    precoBrotinho: parseFloat(data.get("precoBrotinho")),
    precoGrande: parseFloat(data.get("precoGrande")),
    imagem: data.get("imagem").trim(),
    tag: data.get("tag").trim(),
    status: data.get("status"),
    vendas: 0,
  };

  // 🔌 CONEXÃO COM BANCO DE DADOS AQUI
  // Persistir a nova pizza no backend, ex:
  //   await fetch('/api/pizzas', { method: 'POST', body: JSON.stringify(novaPizza) });
  // (Supabase: supabase.from('pizzas').insert(novaPizza))
  state.menu.unshift(novaPizza);
  db.saveMenu(state.menu);

  renderAdminMenuTable();
  emit("menu:updated"); // atualiza o cardápio da loja automaticamente

  form.reset();
  toast(`"${novaPizza.nome}" publicada no cardápio!`);
}

function toggleMenuItemStatus(id) {
  const p = state.menu.find((m) => m.id === id);
  if (!p) return;
  p.status = p.status === "ativo" ? "inativo" : "ativo";
  db.saveMenu(state.menu);
  renderAdminMenuTable();
  emit("menu:updated");
}

function deleteMenuItem(id) {
  state.menu = state.menu.filter((m) => m.id !== id);
  db.saveMenu(state.menu);
  renderAdminMenuTable();
  emit("menu:updated");
  toast("Item removido do cardápio.");
}

export function initAdminMenuCrud() {
  $("#pizzaForm").addEventListener("submit", handlePizzaFormSubmit);
  $("#menuTableBody").addEventListener("click", (e) => {
    const toggleBtn = e.target.closest("[data-toggle]");
    const deleteBtn = e.target.closest("[data-delete]");
    if (toggleBtn) toggleMenuItemStatus(toggleBtn.dataset.toggle);
    if (deleteBtn) deleteMenuItem(deleteBtn.dataset.delete);
  });
}
