export function reportePorArrendatario(pagos) {
    const reporte = {};

    for (const pago of pagos) {
        if (!reporte[pago.arrendatario]) {
            reporte[pago.arrendatario] = {
                total_pagado: 0,
                pagos_realizados: 0,
                pagos_pendientes: 0
            };
        }

        if (pago.estado === "Pagado") {
            reporte[pago.arrendatario].total_pagado += pago.monto;
            reporte[pago.arrendatario].pagos_realizados++;
        } else {
            reporte[pago.arrendatario].pagos_pendientes++;
        }
    }

    return reporte;
}

export default reportePorArrendatario;
