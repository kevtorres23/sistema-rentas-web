const express = require("express");
const Pagosrouter = express.Router();
const verPagos = require("../Notificaciones");

router.get("/alertas", (req, res) => {
    const pagos =[
        {Apartamento: "#1", monto: 1500, vencimiento: "01-20-2026"},
        {Apartamento: "#2", monto: 2000, vencimiento: "01-23-2026"},
        {Apartamento: "#3", monto: 1900, vencimiento: "01-30-2026"},
    ];
    const alertas = verPagos(pagos);
    res.json(alertas);
});
const {
    obtenerHistorial,
    obtenerPorArrendatario
} = require("../models/historialNotificaciones");

router.get("/", (req, res) => {
    res.json(obtenerHistorial());
});

router.get("/:nombre", (req, res) => {
    const { nombre } = req.params;
    res.json(obtenerPorArrendatario(nombre));
});

export default Pagosrouter;