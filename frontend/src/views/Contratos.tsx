import React, { useState, useEffect } from "react";
import { type Contract } from "../types/ContractTypes";
import { Link, useLocation } from 'react-router-dom';
import "../view-styles/ContractsList.css";
//import ContratoForm from "../Forms/Contratoform";
import EditarContratoModal from "../components/forms/EditarContratoModal";
import { REACT_APP_API_URL } from '../config/api-url';

export const token = localStorage.getItem("token");

const Viviendas = () => {
    const [contratos, setContratos] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [filtroStatus, setFiltroStatus] = useState("todos");
    const [filtroBusqueda, setFiltroBusqueda] = useState("");
    const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);
    const [editingContractId, setEditingContractId] = useState("");

    useEffect(() => {
        setPaginaActual(1); // Reset to first page on filter change
    }, [filtroStatus, filtroBusqueda]);

    {/* in this part you can change the number of items that appears in one page */ }
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5; //only you need to change this number for change the items per page

    // ⬇ Fetch data from backend on page load
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${REACT_APP_API_URL}/rentalcontracts`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Error loading data");

            const data = await res.json();
            setContratos(data);
            console.log(data);

        } catch (err) {
            console.error(err);
            setError("Error loading contratos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleContractUpdated = (updatedContract: Contract) => {
        setEditingContractId("");
        fetchData();
    };



    const formatDate = (date: Date) => {
        if (!date) return ""; // ← If null, return nothing
        return new Date(date).toLocaleDateString("es-MX");
    };
    if (loading) return <div className="text-center py-5">Cargando datos...</div>;
    if (error) return <div className="text-center py-5 text-danger">{error}</div>;

    // ------------------------------
    //  NORMAL RENDER
    // ------------------------------

    return (
        <div className="bg-light min-vh-100">
            <div className="container-fluid px-3 px-md-5 py-4">

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 page-header mb-4">
                    <div>
                        <h2 className="fw-bold">Contratos</h2>
                        <p className="text-muted mb-0">Consulta los contratos que han sido generados en el sistema.</p>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="search-pill d-flex align-items-center">
                        <i className="bi bi-search search-icon"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar..."
                        //value={filtroBusqueda}
                        //onChange={(e) => setFiltroBusqueda(e.target.value)}
                        />
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table align-middle mb-0 table-light">
                        <thead className="text-muted small">
                            <tr>
                                <th>ID</th>
                                <th>Propiedad</th>
                                <th>Arrendatario</th>
                                <th>Fechas</th>
                                <th>Alquiler</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>

                            {contratos.map((prop) => (
                                <tr>
                                    <td>Contrato-{String(prop.id).padStart(4, '0')}</td>
                                    <td>
                                        <div className="fw-semibold">{prop.name}</div>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <span>{prop.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <p>
                                            {formatDate(prop.startdate)} <br />
                                            al <br />
                                            {formatDate(prop.enddate)}
                                        </p>
                                    </td>
                                    <td className="price-text">${prop.depositamount} MXN</td>
                                    <td className="text-center">
                                        <div className="d-flex flex-column flex-xl-row justify-content-center gap-2">
                                            <button
                                                className="btn btn-outline-secondary action-btn2 btn-sm text-nowrap"
                                                onClick={() => setEditingContractId(prop.id)}
                                            >
                                                <i className="bi bi-pencil"></i> Editar
                                            </button>
                                            <Link to={"/contratos/" + prop.id} className="btn btn-outline-secondary action-btn2 btn-sm text-nowrap">
                                                <i className="bi bi-eye"></i> Ver detalles
                                            </Link>
                                        </div>
                                    </td>
                                </tr>))}


                        </tbody>
                    </table>
                </div>

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 footer-pagination mt-4">
                    <span className="text-muted small">Mostrando {contratos.length} contratos</span>

                    <nav>
                        <ul className="pagination pagination-sm mb-0">
                            <li className="page-item disabled">
                                <a className="page-link" href="#">‹</a>
                            </li>
                            <li className="page-item active">
                                <a className="page-link" href="#">1</a>
                            </li>
                            <li className="page-item">
                                <a className="page-link" href="#">›</a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            {editingContractId && (
                <EditarContratoModal
                    contractId={editingContractId}
                    onClose={() => setEditingContractId("")}
                    onUpdated={handleContractUpdated}
                />
            )}
        </div>
    );
};

export default Viviendas;