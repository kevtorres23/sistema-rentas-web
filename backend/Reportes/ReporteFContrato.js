export function reportePorContrato(pagos) {
    const reporte = {};

    for (const pago of pagos) {
        if (!reporte[pago.contrato]) {
            reporte[pago.contrato] = {
                total_contrato: 0,
                pagos: []
            };
        }

        reporte[pago.contrato].pagos.push(pago);

        if (pago.estado === "Pagado") {
            reporte[pago.contrato].total_contrato += pago.monto;
        }
    }

    return reporte;
}

export default reportePorContrato;
