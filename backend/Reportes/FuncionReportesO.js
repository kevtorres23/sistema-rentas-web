export function generarReporteOcupacion(unidades) {
    const total = unidades.length;

    const ocupadas = unidades.filter(u => u.estado === "ocupado");
    const disponibles = unidades.filter(u => u.estado === "disponible");

    const porcentajeOcupacion = total > 0
        ? ((ocupadas.length / total) * 100).toFixed(2)
        : 0;

    return {
        total_unidades: total,
        ocupadas: ocupadas.length,
        disponibles: disponibles.length,
        porcentaje_ocupacion: `${porcentajeOcupacion}%`,
        detalle_ocupadas: ocupadas,
        detalle_disponibles: disponibles
    };
}

export default generarReporteOcupacion;
