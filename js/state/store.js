/**
 * state/store.js
 * Estado central da aplicação (in-memory). Todo módulo que precisa
 * ler ou alterar dados (cardápio, carrinho, pedidos...) importa este
 * `state` em vez de manter sua própria cópia — isso evita telas
 * dessincronizadas entre si.
 *
 * O estado nasce a partir do que já está salvo (ver services/database.js)
 * e é mantido em memória durante a sessão; cada mudança relevante é
 * persistida de volta pelo módulo que a realizou.
 */

import { STORE } from "../config.js";
import { db } from "../services/database.js";

export const state = {
  menu: db.loadMenu(),
  orders: db.loadOrders(),
  cart: [],
  filter: "todas",
  mode: "delivery", // 'delivery' | 'pickup'
  customize: {
    pizza: null,
    size: null,
    crust: { name: "Sem borda", price: 0 },
    qty: 1,
    notes: "",
  },
  checkoutStep: 1,
  payment: null,
};

/** Calcula subtotal, taxa de entrega e total do carrinho atual. */
export function cartTotals() {
  const subtotal = state.cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const fee = state.mode === "delivery" && state.cart.length ? STORE.taxaEntrega : 0;
  return { subtotal, fee, total: subtotal + fee };
}
