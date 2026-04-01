export function reportePorPropiedad(pagos) {
    const reporte = {};

    for (const pago of pagos) {
        if (!reporte[pago.propiedad]) {
            reporte[pago.propiedad] = {
                total_ingresos: 0,
                total_pagos: 0
            };
        }

        if (pago.estado === "Pagado") {
            reporte[pago.propiedad].total_ingresos += pago.monto;
            reporte[pago.propiedad].total_pagos++;
        }
    }

    return reporte;
}

export default reportePorPropiedad;
