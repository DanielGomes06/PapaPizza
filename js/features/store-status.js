/**
 * features/store-status.js
 * Calcula e exibe se a loja está aberta agora, com base em STORE.horario.
 */
import { STORE } from "../config.js";
import { $ } from "../utils/dom.js";

function updateStoreStatus() {
  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const isOpenDay = STORE.diasFuncionamento.includes(day);
  const isOpenHour = minutes >= STORE.horario.abre && minutes <= STORE.horario.fecha;
  const isOpen = isOpenDay && isOpenHour;

  const pill = $("#statusPill");
  const label = $("#statusLabel");
  pill.classList.toggle("is-open", isOpen);
  pill.classList.toggle("is-closed", !isOpen);
  label.textContent = isOpen ? "Aberto agora" : "Fechado no momento";
}

export function initStoreStatus() {
  updateStoreStatus();
  setInterval(updateStoreStatus, 60000);
}
