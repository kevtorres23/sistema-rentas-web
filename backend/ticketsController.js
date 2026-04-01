let tickets = [];
let contadorId = 1;

exports.crearTicket = (req, res) => {
    const { apartamento, arrendatario, descripcion, prioridad } = req.body;

    const nuevoTicket = {
        id: contadorId++,
        apartamento,
        arrendatario,
        descripcion,
        prioridad: prioridad || "media",
        estado: "abierto",
        fecha: new Date().toISOString(),
        comentarios: []
    };

    tickets.push(nuevoTicket);
    res.status(201).json(nuevoTicket);
};

exports.obtenerTickets = (req, res) => {
    res.json(tickets);
};

exports.actualizarEstado = (req, res) => {
    const { id } = req.params;
    const { estado, comentario } = req.body;

    const ticket = tickets.find(t => t.id == id);

    if (!ticket) {
        return res.status(404).json({ mensaje: "Ticket no encontrado" });
    }

    if (estado) ticket.estado = estado;
    if (comentario) {
        ticket.comentarios.push({
            texto: comentario,
            fecha: new Date().toISOString()
        });
    }

    res.json(ticket);
};
