/**
 * utils/dom.js
 * Pequenos atalhos para querySelector, usados em todo o app.
 */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
