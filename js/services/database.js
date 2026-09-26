/**
 * services/database.js
 * Camada de persistência da aplicação. Hoje usa localStorage como
 * simulação; é o ÚNICO lugar que deve mudar quando um backend de
 * verdade entrar em cena — o resto do app não sabe (nem precisa saber)
 * como os dados são guardados.
 */

import { MENU_SEED } from "../data/menu-seed.js";

export const db = {
  /**
   * 🔌 CONEXÃO COM BANCO DE DADOS AQUI
   * Em produção, troque por uma chamada real, ex:
   *   const res = await fetch('/api/pizzas');
   *   return await res.json();
   * (Supabase: supabase.from('pizzas').select('*'))
   */
  loadMenu() {
    try {
      const raw = localStorage.getItem("papapizza_menu");
      return raw ? JSON.parse(raw) : structuredClone(MENU_SEED);
    } catch (e) {
      return structuredClone(MENU_SEED);
    }
  },

  /**
   * 🔌 CONEXÃO COM BANCO DE DADOS AQUI
   * Em produção: POST/PUT para a API ou upsert no Supabase/Firebase.
   */
  saveMenu(menu) {
    localStorage.setItem("papapizza_menu", JSON.stringify(menu));
  },

  /**
   * 🔌 CONEXÃO COM BANCO DE DADOS AQUI
   * Em produção: GET /api/pedidos (idealmente filtrado por loja/dia).
   */
  loadOrders() {
    try {
      const raw = localStorage.getItem("papapizza_orders");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * 🔌 CONEXÃO COM BANCO DE DADOS AQUI
   * Em produção: POST /api/pedidos (criação) ou PATCH (mudança de status).
   */
  saveOrders(orders) {
    localStorage.setItem("papapizza_orders", JSON.stringify(orders));
  },
};
