export default function ArrendatarioForm({ data, update }) {
    return (
        <>
            <h6 className="fw-bold mb-3">Datos del Aval</h6>

            <div className="mb-3">
                <label className="form-label">Nombre completo</label>
                <input
                    className="form-control"
                    value={data.name}
                    onChange={(e) => update("name", e.target.value)}
                />
            </div>

            <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label">Número de teléfono</label>
                    <input
                        className="form-control"
                        value={data.phone}
                        onChange={(e) => update("phone", e.target.value)}
                    />
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Correo electrónico</label>
                    <input
                        className="form-control"
                        value={data.email}
                        onChange={(e) => update("email", e.target.value)} />
                </div>
            </div>

            <div className="mb-3">
                <label className="form-label">Domicilio</label>
                <input
                    className="form-control"
                    value={data.address}
                    onChange={(e) => update("address", e.target.value)} />
            </div>
        </>
    );
}