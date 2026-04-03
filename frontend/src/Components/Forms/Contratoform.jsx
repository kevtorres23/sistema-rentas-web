export default function ContratoForm({ data, update }) {
    return (
        <>
            <h6 className="fw-bold mb-3">Datos del Contrato de Venta</h6>

            <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label">Fecha de inicio</label>
                    <input
                        className="form-control"
                        type="date" value={data.startdate}
                        onChange={(e) => update("startdate", e.target.value)} />
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Fecha de fin</label>
                    <input
                        className="form-control"
                        type="date" value={data.enddate}
                        onChange={(e) => update("enddate", e.target.value)} />
                </div>
            </div>

            <div className="mb-3">
                <label className="form-label">Deposito mensual</label>
                <input
                    type="number"
                    className="form-control"
                    value={data.price}
                    onChange={(e) => update("price", e.target.value)} />
            </div>

            <div className="mb-3">
                <label className="form-label">Documento del contrato (PDF opcional)</label>
                <input
                    type="file"
                    accept="application/pdf"
                    className="form-control"
                    onChange={(e) => update("file", e.target.files[0])} />
                {data.file && (
                    <small className="text-success mt-1 d-block">
                        Archivo seleccionado: {data.file.name}
                    </small>
                )}
            </div>
        </>
    );
}
