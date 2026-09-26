/**
 * config.js
 * Configuração institucional da loja. Qualquer dado fixo do negócio
 * (contato, horário, taxa de entrega) vive aqui — nunca espalhado
 * pelo resto do código.
 */

export const STORE = {
  nome: "Papa Pizza Delivery",
  cidade: "Jacutinga, MG",
  cep: "37590-000",
  // 📲 Número real do WhatsApp Business da loja (formato internacional, só dígitos)
  whatsapp: "5535999990000",
  horario: { abre: 18 * 60, fecha: 23 * 60 + 30 }, // em minutos desde 00:00
  diasFuncionamento: [0, 2, 3, 4, 5, 6], // 0=domingo ... 6=sábado (1=segunda fechado)
  taxaEntrega: 6.0,
};

export const CATEGORY_LABEL = {
  salgadas: "Salgada",
  doces: "Doce",
  bebidas: "Bebida",
  promocionais: "Promocional",
};

export const SIZES = {
  padrao: [
    { id: "brotinho", label: "Brotinho · 4 fatias", key: "precoBrotinho" },
    { id: "grande", label: "Grande · 8 fatias", key: "precoGrande" },
  ],
};

export const ORDER_STATUSES = ["Pendente", "Em Preparo", "Saiu para Entrega", "Concluído"];
