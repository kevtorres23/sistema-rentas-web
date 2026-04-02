import React, { useEffect, useMemo, useState } from "react";
import { api } from "../config/api";
import "../view-styles/Reportes.css";

const formatCurrency = (value) => {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 0
    }).format(amount);
};

const fetchJson = async (path) => {
    const response = await fetch(api(path));
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Error de red");
    }
    return response.json();
};

const Reportes = () => {
    const [ocupacion, setOcupacion] = useState(null);
    const [arrendatarios, setArrendatarios] = useState({});
    const [contratos, setContratos] = useState({});
    const [propiedades, setPropiedades] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const cargarReportes = async () => {
        setLoading(true);
        setError("");
        try {
            const [
                ocupacionData,
                arrendatariosData,
                contratosData,
                propiedadesData
            ] = await Promise.all([
                fetchJson("/reportes/ocupacion"),
                fetchJson("/reportes/arrendatarios"),
                fetchJson("/reportes/contratos"),
                fetchJson("/reportes/propiedades")
            ]);

            setOcupacion(ocupacionData);
            setArrendatarios(arrendatariosData || {});
            setContratos(contratosData || {});
            setPropiedades(propiedadesData || {});
        } catch (err) {
            setError(err.message || "No se pudieron cargar los reportes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarReportes();
    }, []);

    const arrendatariosEntries = useMemo(
        () => Object.entries(arrendatarios || {}),
        [arrendatarios]
    );
    const contratosEntries = useMemo(
        () => Object.entries(contratos || {}),
        [contratos]
    );
    const propiedadesEntries = useMemo(
        () => Object.entries(propiedades || {}),
        [propiedades]
    );

    const porcentajeOcupacion = ocupacion?.porcentaje_ocupacion || "0%";
    const totalUnidades = ocupacion?.total_unidades || 0;
    const totalOcupadas = ocupacion?.ocupadas || 0;
    const totalDisponibles = ocupacion?.disponibles || 0;

    return (
        <div className="reportes-page min-vh-100">
            <div className="container-fluid px-4 py-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                    <div>
                        <h1 className="fw-bold m-0 reportes-title">Reportes</h1>
                        <p className="m-0 mt-1 reportes-subtitle">
                            Resumen ejecutivo de ocupacion, pagos y contratos.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary reportes-refresh"
                        onClick={cargarReportes}
                        disabled={loading}
                    >
                        {loading ? "Actualizando..." : "Actualizar"}
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger border-0 shadow-sm">{error}</div>
                )}

                <div className="row g-3 mb-4">
                    <div className="col-lg-4">
                        <div className="reportes-card h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <p className="m-0 reportes-kicker">Ocupacion general</p>
                                    <h3 className="m-0 reportes-metric">{porcentajeOcupacion}</h3>
                                </div>
                                <span className="badge reportes-badge">Unidades</span>
                            </div>
                            <div className="reportes-progress">
                                <div
                                    className="reportes-progress-bar"
                                    style={{ width: porcentajeOcupacion }}
                                />
                            </div>
                            <div className="d-flex justify-content-between mt-3">
                                <div>
                                    <p className="reportes-label">Total</p>
                                    <span className="reportes-value">{totalUnidades}</span>
                                </div>
                                <div>
                                    <p className="reportes-label">Ocupadas</p>
                                    <span className="reportes-value">{totalOcupadas}</span>
                                </div>
                                <div>
                                    <p className="reportes-label">Disponibles</p>
                                    <span className="reportes-value">{totalDisponibles}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-8">
                        <div className="reportes-card h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <p className="m-0 reportes-kicker">Totales por arrendatario</p>
                                    <h4 className="m-0 reportes-section-title">Resumen de pagos</h4>
                                </div>
                                <span className="reportes-meta">{arrendatariosEntries.length} registros</span>
                            </div>
                            <div className="row g-3">
                                {loading && (
                                    <div className="col-12">
                                        <div className="reportes-placeholder" />
                                    </div>
                                )}
                                {!loading && arrendatariosEntries.length === 0 && (
                                    <div className="col-12">
                                        <p className="text-muted mb-0">Sin datos disponibles.</p>
                                    </div>
                                )}
                                {!loading &&
                                    arrendatariosEntries.map(([nombre, data]) => (
                                        <div className="col-md-6 col-xl-4" key={nombre}>
                                            <div className="reportes-mini-card">
                                                <h6 className="m-0 reportes-mini-title">{nombre}</h6>
                                                <p className="m-0 reportes-mini-amount">
                                                    {formatCurrency(data.total_pagado)}
                                                </p>
                                                <div className="d-flex justify-content-between mt-2">
                                                    <span className="reportes-pill">
                                                        Pagos: {data.pagos_realizados}
                                                    </span>
                                                    <span className="reportes-pill reportes-pill-warning">
                                                        Pendientes: {data.pagos_pendientes}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-3">
                    <div className="col-lg-6">
                        <div className="reportes-card h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <p className="m-0 reportes-kicker">Contratos</p>
                                    <h4 className="m-0 reportes-section-title">Detalle por contrato</h4>
                                </div>
                                <span className="reportes-meta">{contratosEntries.length} contratos</span>
                            </div>
                            <div className="reportes-list">
                                {loading && <div className="reportes-placeholder" />}
                                {!loading && contratosEntries.length === 0 && (
                                    <p className="text-muted mb-0">Sin datos disponibles.</p>
                                )}
                                {!loading &&
                                    contratosEntries.map(([contratoId, data]) => (
                                        <div className="reportes-list-item" key={contratoId}>
                                            <div>
                                                <p className="m-0 reportes-list-title">Contrato #{contratoId}</p>
                                                <span className="reportes-list-subtitle">
                                                    Pagos registrados: {data.pagos?.length || 0}
                                                </span>
                                            </div>
                                            <div className="reportes-list-amount">
                                                {formatCurrency(data.total_contrato)}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6">
                        <div className="reportes-card h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <p className="m-0 reportes-kicker">Propiedades</p>
                                    <h4 className="m-0 reportes-section-title">Ingresos por propiedad</h4>
                                </div>
                                <span className="reportes-meta">{propiedadesEntries.length} propiedades</span>
                            </div>
                            <div className="reportes-list">
                                {loading && <div className="reportes-placeholder" />}
                                {!loading && propiedadesEntries.length === 0 && (
                                    <p className="text-muted mb-0">Sin datos disponibles.</p>
                                )}
                                {!loading &&
                                    propiedadesEntries.map(([propiedad, data]) => (
                                        <div className="reportes-list-item" key={propiedad}>
                                            <div>
                                                <p className="m-0 reportes-list-title">{propiedad}</p>
                                                <span className="reportes-list-subtitle">
                                                    Pagos: {data.total_pagos}
                                                </span>
                                            </div>
                                            <div className="reportes-list-amount">
                                                {formatCurrency(data.total_ingresos)}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reportes;