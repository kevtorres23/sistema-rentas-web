const plantillas = {
    aviso: ({nombre, monto, fecha, dias }) =>
        `Buenos dias sr/sra ${nombre},
    se le recuerda que su pago de $${monto}MX vence el ${fecha}.
    Faltan ${dias} día(s) para la fecha lmite. `,
    hoy: ({nombre, monto}) =>
    `Buenos dias Sr/Sra ${nombre}, 
    su pago de $${monto} MX vence hoy.
    Favor de realizar el pago para evitar cargos extra.`,
    vencido: ({nombre, monto, fecha}) =>
        `Buen dia Sr/Sra ${nombre},
    Se le avisa que su pago de $${monto} MX ha vencido el dia ${fecha}.
    Se le pide regularizar su situacion lo antes posible`,
    ticketAsignado: ({nombre, ticketId, responsable}) =>
        `Hola ${nombre},
    su reporte con folio ${ticketId} fue asignado a ${responsable}.
    Le mantendremos informado sobre el avance.`,
    ticketEnProceso: ({nombre, ticketId}) =>
        `Hola ${nombre},
    su reporte con folio ${ticketId} se encuentra en proceso de atencion.`,
    ticketEnEspera: ({nombre, ticketId, motivo}) =>
        `Hola ${nombre},
    su reporte con folio ${ticketId} esta en espera.${motivo ? ` Motivo: ${motivo}` : ""}`,
    ticketResuelto: ({nombre, ticketId}) =>
        `Hola ${nombre},
    su reporte con folio ${ticketId} fue resuelto. Gracias por su paciencia.`
};

export default plantillas; 
