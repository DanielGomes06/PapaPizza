/**
 * utils/format.js
 * Funções puras de formatação — sem estado, sem efeitos colaterais.
 */
export const money = (v) => "R$ " + v.toFixed(2).replace(".", ",");
export const uid = (prefix = "id") => prefix + "-" + Math.random().toString(36).slice(2, 9);
