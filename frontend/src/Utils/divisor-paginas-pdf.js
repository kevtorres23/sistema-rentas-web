/**
 * Calcula el número de páginas que el documento PDF de los pagarés debe contener, en base al número total de pagarés que deben incluirse.
 * @param {number} totalPagares 
 * @returns El número de páginas que debe contener el PDF de los pagarés para mostrar el total de estos.
 */

export const divisorPaginasPagares = (totalPagares) => Math.ceil(totalPagares / 3);