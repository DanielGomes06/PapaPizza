/**
 * utils/events.js
 * Um barramento de eventos minúsculo (pub/sub) usando o EventTarget
 * nativo do navegador. Existe para que módulos distantes na
 * arquitetura (ex: checkout do cliente e dashboard do admin) não
 * precisem se importar diretamente um ao outro — eles só concordam
 * em um nome de evento.
 *
 * Eventos usados no projeto:
 *   'menu:updated'  → cardápio mudou (admin cadastrou/editou/removeu pizza)
 *   'order:created' → um novo pedido foi confirmado pelo cliente
 */
const bus = new EventTarget();

export function on(eventName, handler) {
  bus.addEventListener(eventName, handler);
}

export function emit(eventName, detail) {
  bus.dispatchEvent(new CustomEvent(eventName, { detail }));
}
