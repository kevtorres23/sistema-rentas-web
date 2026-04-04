const express = require("express");
const router = express.Router();

const Notificaciones = require("../Notificaciones");
const Plantillas = require("../Plantillas");
const plantillas = require("../Plantillas");

router.get("/alertas", (req, res) => {
    const pagos = [
        {
            Apartamento: "1",
            monto: 1500,
            vencimiento: "01-20-2026",
        },
        {
            Apartamento: "2",
            monto: 2000,
            vencimiento: "01-23-2026",
        }
    ];
    const alertas = Notificaciones(pagos);

    const notificaciones = alertas.map(pago => {
        let mensaje ="";

        if (pago.estado === "Aviso") {
            mensaje = plantillas.aviso({
                nombre: pago.nombre,
                monto: pago.monto,
                fecha: pago.vencimiento,
                dias: pago.dias_restantes
            });
        }
        if (pago.estado === "Hoy"){
            mensaje = plantillas.hoy({
                nombre: pago.nombre,
                monto: pago.monto
            });
        }
        if (pago.estado === "Vencido"){
            mensaje = plantillas.vencido({
                nombre: pago.nombre,
                monto: pago.monto,
                fecha: pago.vencimiento
            });
        }
        return {
            ...pago,
            mensaje
        };
    });
    const {guardarNot, guardarNotificacion}= require("../HistorialNotif");

    guardarNotificacion({
        nombre: pago.nombre,
        Apartamento: pago.Apartamento,
        tipo: pago.estado,
        mensaje
    });

    res.json(Notificaciones);
});
module.exports = Router;