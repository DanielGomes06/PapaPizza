/**
 * utils/toast.js
 * Exibe notificações flutuantes de curta duração.
 */
import { $ } from "./dom.js";

export function toast(message, type = "success") {
  const container = $("#toastContainer");
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 220);
  }, 2600);
}
