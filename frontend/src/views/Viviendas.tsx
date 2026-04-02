import React, { useState, useEffect } from "react";
import { type Housing, type HousingStatus } from "../types/HousingTypes";
import { Link } from "react-router-dom";
import { TbContract } from "react-icons/tb";
import { LuHouse } from "react-icons/lu";
import "../view-styles/AparmentList.css";
import ViviendaForm from "../components/forms/Viviendaform";
import EditApartmentModal from "../components/forms/EditarForm";
import ContractWizardModal from "../components/forms/ContratoWizardform";
import { REACT_APP_API_URL } from '../config/api-url';
import { Modal } from 'react-bootstrap';

const token = localStorage.getItem("token");

const Viviendas = () => {
    const [propiedades, setPropiedades] = useState<Housing[]>([]);
    const [showPropiertiesModal, setShowPropiertiesModal] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    const [filtroStatus, setFiltroStatus] = useState("todos");
    const [filtroBusqueda, setFiltroBusqueda] = useState("");
    const [selectedApartment, setSelectedApartment] = useState<Housing>();
    const [contractApartmentId, setContractApartmentId] = useState("");

    const handleSelect = (apartment: Housing) => {
        setSelectedApartment(apartment);
    };

    useEffect(() => {
        if (!selectedApartment) return;

        const modalEl = document.getElementById('editModal');
        if (!modalEl) return;

        const modal = new Modal(modalEl);
        modal.show();
    }, [selectedApartment]);

    useEffect(() => {
        setPaginaActual(1); // Reset to first page on filter change
    }, [filtroStatus, filtroBusqueda]);

    {/* in this part you can change the number of items that appears in one page */ }
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5; //only you need to change this number for change the items per page

    // ⬇ Fetch data from backend on page load
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${REACT_APP_API_URL}/apartments`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) throw new Error("Error loading data");

                const data = await res.json();
                console.log(data)
                setPropiedades(data);
            } catch (err) {
                console.error(err);
                setError("Error loading viviendas");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);



    const formatDate = (date: Date) => {
        if (!date) return ""; // ← If null, return nothing
        return new Date(date).toLocaleDateString("es-MX");
    };
    // ------------------------------
    //  Helpers to modify UI locally
    // ------------------------------

    const cambiarEstado = (id: string) => {
        setPropiedades((prev) => prev.map((p) => p.id === id ? {
            ...p, status: p.status === "OCCUPIED" ? "AVAILABLE" : "OCCUPIED"
        } : p));
    };

    const archivarVivienda = (id: string) => {
        setPropiedades((prev) => prev.map((p) => p.id === id ? {
            ...p, status: p.status === "ARCHIVED" ? "AVAILABLE" : "OCCUPIED"
        } : p));
    };

    const getStatusDot = (status: HousingStatus) => {
        switch (status) {
            case "AVAILABLE":
                return "status-dot status-disponible";
            case "OCCUPIED":
                return "status-dot status-ocupado";
            case "ARCHIVED":
                return "status-dot status-archivado";
            default:
                return "";
        }
    };

    const addHousing = (newHousing: Housing) => {
        setPropiedades(prev => [...prev, newHousing]);
    };

    const handleApartmentCreated = (newHousing: Housing) => {
        addHousing(newHousing);
        setShowPropiertiesModal(false);
    };

    const updateHousing = (updatedHousing: Housing) => {
        setPropiedades(prev =>
            prev.map((p) =>
                p.id === updatedHousing.id ? updatedHousing : p
            )
        );
    };

    //  Filtering logic

    const propiedadesFiltradas = propiedades
        .filter((p) => filtroStatus === "todos" || p.status === filtroStatus)
        .filter((p) => {
            const texto = filtroBusqueda.toLowerCase();
            const addressString = `${p.street || ''} ${p.ext_num || ''} ${p.division || ''} ${p.postal_code || ''}`.toLowerCase();
            return (
                addressString.includes(texto) ||
                p.id.toString().includes(texto)
            );
        });


    const indexInicio = (paginaActual - 1) * itemsPorPagina;
    const indexFin = indexInicio + itemsPorPagina;
    const propiedadesPaginadas = propiedadesFiltradas.slice(indexInicio, indexFin);
    const totalPaginas = Math.ceil(propiedadesFiltradas.length / itemsPorPagina);
    // ------------------------------
    //  UI States: Loading and Error
    // ------------------------------

    if (loading) return <div className="text-center py-5">Cargando datos...</div>;
    if (error) return <div className="text-center py-5 text-danger">{error}</div>;

    // ------------------------------
    //  NORMAL RENDER
    // ------------------------------

    return (
        <div className="bg-light min-vh-100">
            <div className="container py-4">

                {/* Search + Add */}
                <div className="apartments-toolbar d-flex justify-content-between align-items-center mb-3">
                    <div className="search-pill d-flex align-items-center">
                        <i className="bi bi-search search-icon"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar..."
                            value={filtroBusqueda}
                            onChange={(e) => setFiltroBusqueda(e.target.value)}
                        />
                    </div>

                    <button
                        className="btn btn-dark new-home-btn"
                        onClick={() => setShowPropiertiesModal(true)}
                    >
                        + Nueva vivienda
                    </button>

                    <ViviendaForm
                        show={showPropiertiesModal}
                        onClose={() => setShowPropiertiesModal(false)}
                        onCreated={handleApartmentCreated}
                    />
                    {selectedApartment && (
                        <EditApartmentModal
                            apartment={selectedApartment}
                            onClose={() => setSelectedApartment(undefined)}
                            onUpdated={(updated: Housing) => {
                                setPropiedades(prev =>
                                    prev.map(a => a.id === updated.id ? updated : a)
                                );
                                setSelectedApartment(undefined);
                            }}
                        />
                    )}
                    <ContractWizardModal
                        show={showContractModal}
                        onClose={() => setShowContractModal(false)}
                        selectedApartmentId={contractApartmentId}

                    />
                </div>

                {/* STATUS INDICATORS */}
                <div className="mb-3">
                    <span className="status-dot status-disponible"></span>Disponible
                    <span className="status-dot status-archivado ms-3"></span>Archivado
                    <span className="status-dot status-ocupado ms-3"></span>Ocupado
                </div>



                {/* Filter buttons */}
                <div className="filter-btns mb-4">
                    <button
                        className={'btn btn-outline-dark ${filtroStatus === "todos" ? " active" : ""}'}
                        onClick={() => setFiltroStatus("todos")}>
                        Total de Viviendas
                    </button>

                    <button
                        className={'btn btn-outline-dark ${filtroStatus === "OCCUPIED" ? " active" : ""}'}
                        onClick={() => setFiltroStatus("OCCUPIED")}>
                        Viviendas Ocupadas
                    </button>

                    <button className={'btn btn-outline-dark ${filtroStatus === "AVAILABLE" ? " active" : ""}'}
                        onClick={() => setFiltroStatus("AVAILABLE")}>
                        Disponibles
                    </button>

                    <button className={'btn btn-outline-dark ${filtroStatus === "ARCHIVED" ? " active" : ""}'}
                        onClick={() => setFiltroStatus("ARCHIVED")}>
                        Archivadas
                    </button>
                </div>

                {/* Table header */}
                <div className="row table-header mb-2 d-none d-lg-flex fw-bold text-muted px-3">
                    <div className="col-lg-3">Ubicación</div>
                    <div className="col-lg-2 text-center">Arrendatario</div>
                    <div className="col-lg-2">Fecha de Pago</div>
                    <div className="col-lg-5 text-end">Acciones</div>
                </div>

                {/* Property list */}
                {propiedadesPaginadas.map((prop) => (
                    <div className="row property-card responsive-card mx-0 mb-3 mb-lg-0" key={prop.id}>
                        <div className="col-12 col-lg-3 d-flex align-items-center border-end-lg pb-3 pb-lg-0">
                            <span className={getStatusDot(prop.status)}></span>
                            <img
                                src="https://th.bing.com/th/id/OIP.6XIv3DVREt05mi0sSNtUDgHaE8?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3"
                                className="property-img me-2"
                                alt="Departamento"
                            />
                            <div>
                                <p className="mb-1 fw-semibold">{`${prop.street || ''} ${prop.int_num || ''}, ${prop.division || ''}`.trim()}</p>
                                <small>{prop.depositamount ? prop.depositamount.toLocaleString('en-US') : ''}$</small>
                            </div>
                        </div>

                        <div className="col-12 col-lg-2 d-flex align-items-center justify-content-lg-center flex-row flex-lg-column gap-2 gap-lg-0 border-end-lg py-2 py-lg-0">
                            <span className="d-lg-none fw-bold mobile-label">Arrendatario:</span>
                            <i className="bi bi-person-circle fs-3 text-secondary d-none d-lg-block"></i>
                            <span>{prop.tenant_name || 'Sin asignar'}</span>
                        </div>

                        <div className="col-12 col-lg-2 d-flex align-items-center border-end-lg py-2 py-lg-0 gap-2">
                            <span className="d-lg-none fw-bold mobile-label">Fecha de Pago:</span>
                            <span>{prop.latest_due_date ? formatDate(prop.latest_due_date) : '-'}</span>
                        </div>

                        {/* Butons */}
                        <div className="col-12 col-lg-5 d-flex flex-column flex-sm-row justify-content-lg-end align-items-stretch align-items-sm-center gap-3 pt-3 pt-lg-0">
                            <div className="actions-stack-box w-100 flex-sm-grow-1 flex-lg-grow-0">
                                <button
                                    className="box-action-btn"
                                    onClick={() => handleSelect(prop)}
                                >
                                    <i className="bi bi-pencil-square"></i>
                                    Editar
                                </button>

                                {prop.status === "ARCHIVED" ? (
                                    <button className="box-action-btn" onClick={() => archivarVivienda(prop.id)}>
                                        <i className="bi bi-eye"></i>
                                        Archivado
                                    </button>
                                ) : (
                                    <button className="box-action-btn" onClick={() => archivarVivienda(prop.id)}>
                                        <i className="bi bi-eye-slash"></i>
                                        Desarchivar
                                    </button>
                                )}

                                {prop.status === "OCCUPIED" ? (
                                    <button className="box-action-btn" onClick={() => cambiarEstado(prop.id)}>
                                        <i className="bi bi-x-circle"></i>
                                        Ocupado
                                    </button>
                                ) : (
                                    <button className="box-action-btn" onClick={() => cambiarEstado(prop.id)}>
                                        <i className="bi bi-check-circle"></i>
                                        Disponible
                                    </button>
                                )}
                            </div>

                            <div className="contract-links-stack w-100 flex-sm-grow-1 flex-lg-grow-0">
                                {prop.tenant_name ?
                                    <Link to={"/contratos/" + prop.rc_id} className="contract-link-text-btn ">
                                        <TbContract size={16} />
                                        Datos del contrato
                                    </Link>
                                    :
                                    <button
                                        type="button"
                                        className="contract-link-text-btn"
                                        onClick={() => { setContractApartmentId(prop.id); setShowContractModal(true); }}
                                    >
                                        <TbContract size={16} />
                                        Agregar Contrato
                                    </button>}


                                <Link
                                    to={`/viviendas/${prop.id}/detalles`}
                                    state={{ propiedad: prop }}
                                    className="contract-link-text"
                                >
                                    <LuHouse size={16} />
                                    Datos de la vivienda
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Pagination */}
                <nav className="mt-4">
                    <ul className="pagination justify-content-center custom-pagination">
                        {Array.from(
                            { length: Math.ceil(propiedadesFiltradas.length / itemsPorPagina) },
                            (_, idx) => (
                                <li
                                    key={idx + 1}
                                    className={`page-item ${paginaActual === idx + 1 ? "active" : ""}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setPaginaActual(idx + 1)}>
                                        {idx + 1}
                                    </button>
                                </li>
                            ))}
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default Viviendas;