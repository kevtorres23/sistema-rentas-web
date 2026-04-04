/**
 * Transforma un número común en un número escrito.
 * 
 * Ej. 4000 - Cuatro mil
 * @param {number} numero 
 */

function numeroEscrito(numero) {
    const unidades = {
        1: "uno",
        2: "dos",
        3: "tres",
        4: "cuatro",
        5: "cinco",
        6: "seis",
        7: "siete",
        8: "ocho",
        9: "nueve",
        10: "diez"
    };

    const unicos = {
        11: "once",
        12: "doce",
        13: "trece",
        14: "catorce",
        15: "quince",
        20: "veinte",
    };

    const tercerDecenio = {
        21: "veintiuno",
        22: "veintidós",
        23: "veintitrés",
        24: "veinticuatro",
        25: "veinticinco",
        26: "veintiséis",
        27: "veintisiete",
        28: "veintiocho",
        29: "veintinueve"
    };

    const decenas = {
        1: "dieci",
        2: "veinti",
        3: "treinta",
        4: "cuarenta",
        5: "cincuenta",
        6: "sesenta",
        7: "setenta",
        8: "ochenta",
        9: "noventa",
    };

    const centenas = {
        1: "cien",
        2: "doscientos",
        3: "trescientos",
        4: "cuatroscientos",
        5: "quinientos",
        6: "seiscientos",
        7: "setescientos",
        8: "ochoscientos",
        9: "novescientos",
    };

    const millares = {
        1: "mil",
        2: "dos mil",
        3: "tres mil",
        4: "cuatro mil",
        5: "cinco mil",
        6: "seis mil",
        7: "siete mil",
        8: "ocho mil",
        9: "nueve mil"
    };

    const numeroStr = numero.toString();
    const listaUnicos = ["once", "doce", "trece", "catorce", "quince", "veinte"];

    const palabrasNumero = []; // Lista donde guardaremos las palabras separadas del número escrito.
    const ordenDigitos = [decenas, millares, centenas, decenas, unidades];
    let contadorOrden = 4; // El contador empieza en cuatro porque es el índice de las unidades.

    for (let i = numeroStr.length - 1; i >= 0; i--) {
        if (numeroStr[i] === "0" || (contadorOrden === 3 && listaUnicos.includes(palabrasNumero[0]))) {
            contadorOrden -= 1;
            continue;
        };

        if (contadorOrden === 4 && unicos.hasOwnProperty(numeroStr[i - 1] + numeroStr[i])) {
            palabrasNumero.splice(0, 0, unicos[numeroStr[i - 1] + numeroStr[i]]);
            contadorOrden -= 1;
            continue;
        };

        palabrasNumero.splice(0, 0, ordenDigitos[contadorOrden][numeroStr[i]]);

        if (contadorOrden === 4 && numeroStr[i + 1] != "0") {
            palabrasNumero.splice(0, 0, "y");
        };

        contadorOrden -= 1;
    };

    const numeroEscrito = palabrasNumero.join(" ");
    console.log(palabrasNumero);
    return numeroEscrito;
};

export { numeroEscrito };