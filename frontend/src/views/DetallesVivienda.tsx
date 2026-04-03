import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { LuHand, LuHouse, LuInfo, LuSettings } from "react-icons/lu";
import EditarForm from "../components/forms/EditarForm";
import { REACT_APP_API_URL } from "../config/api-url";
import "../view-styles/ViviendaDetalle.css";
const token = localStorage.getItem("token");

const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-MX");
};

const statusLabel = (status) => {
    if (status === "AVAILABLE") return "Disponible";
    if (status === "OCCUPIED") return "Ocupada";
    if (status === "ARCHIVED") return "Archivada";
    return status || "-";
};

const statusClass = (status) => {
    if (status === "AVAILABLE") return "is-available";
    if (status === "OCCUPIED") return "is-occupied";
    if (status === "ARCHIVED") return "is-archived";
    return "";
};

export default function ViviendaDetalle() {
    const emptyTenantForm = {
        name: "",
        phone: "",
        email: "",
        governmentid: "",
        password: ""
    };

    const { id } = useParams();
    const { state } = useLocation();
    const [vivienda, setVivienda] = useState(state?.propiedad || null);
    const [loading, setLoading] = useState(!state?.propiedad);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");
    const [tenantForm, setTenantForm] = useState(emptyTenantForm);
    const [tenantSaving, setTenantSaving] = useState(false);
    const [tenantMsg, setTenantMsg] = useState("");

    useEffect(() => {
        const fetchVivienda = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`${REACT_APP_API_URL}/apartments/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) throw new Error("No se pudo cargar la vivienda");

                const data = await res.json();
                setVivienda(data);
            } catch (err) {
                console.error(err);
                setError("No fue posible cargar los detalles de la vivienda.");
            } finally {
                setLoading(false);
            }
        };

        fetchVivienda();
    }, [id]);

    if (loading) return <div className="text-center py-5">Cargando detalles...</div>;
    if (error) return <div className="text-center py-5 text-danger">{error}</div>;

    const cambiarEstado = () => {
        setVivienda((prev) => ({
            ...prev,
            status: prev.status === "OCCUPIED" ? "AVAILABLE" : "OCCUPIED"
        }));
    };

    const archivarVivienda = () => {
        setVivienda((prev) => ({
            ...prev,
            status: prev.status === "ARCHIVED" ? "AVAILABLE" : "ARCHIVED"
        }));
    };

    const guardarStatus = async () => {
        if (!vivienda?.id || saving) return;

        setSaving(true);
        setSaveMsg("");

        try {
            const res = await fetch(`${REACT_APP_API_URL}/apartments/${vivienda.id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: vivienda.status })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || data?.message || "No se pudo guardar");
            }

            const updated = await res.json();
            setVivienda((prev) => ({ ...prev, ...updated }));
            setSaveMsg("Estatus guardado correctamente.");
        } catch (err) {
            console.error(err);
            setSaveMsg(err.message || "Error al guardar el estatus.");
        } finally {
            setSaving(false);
        }
    };

    const abrirGestionArrendatario = async () => {
        if (!vivienda) return;

        setTenantMsg("");
        setTenantForm({
            ...emptyTenantForm,
            name: vivienda.tenant_name || "",
            phone: vivienda.tenant_phone || "",
            email: vivienda.tenant_email || ""
        });

        if (!vivienda.tenant_id) return;

        try {
            const res = await fetch(`${REACT_APP_API_URL}/tenants/${vivienda.tenant_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) return;

            const data = await res.json();
            setTenantForm((prev) => ({
                ...prev,
                name: data?.name || prev.name,
                phone: data?.phone || prev.phone,
                email: data?.email || prev.email,
                governmentid: data?.governmentid || ""
            }));
        } catch (err) {
            console.error(err);
        }
    };

    const guardarArrendatario = async (e) => {
        e.preventDefault();
        if (tenantSaving || !vivienda?.id) return;

        if (!tenantForm.name.trim() || !tenantForm.governmentid.trim()) {
            setTenantMsg("Nombre e identificación oficial son obligatorios.");
            return;
        }

        const isEditingTenant = Boolean(vivienda?.tenant_id);
        if (!isEditingTenant && !tenantForm.password.trim()) {
            setTenantMsg("Para crear una cuenta debes capturar una contraseña.");
            return;
        }

        setTenantSaving(true);
        setTenantMsg("");

        try {
            const payload = {
                name: tenantForm.name.trim(),
                phone: tenantForm.phone.trim(),
                email: tenantForm.email.trim(),
                governmentid: tenantForm.governmentid.trim()
            };

            if (tenantForm.password.trim()) {
                payload.password = tenantForm.password.trim();
            }

            const tenantRes = await fetch(
                isEditingTenant
                    ? `${REACT_APP_API_URL}/tenants/${vivienda.tenant_id}`
                    : `${REACT_APP_API_URL}/tenants`,
                {
                    method: isEditingTenant ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                }
            );

            const tenantData = await tenantRes.json().catch(() => ({}));
            if (!tenantRes.ok) {
                throw new Error(tenantData?.error || tenantData?.message || "No se pudo guardar el arrendatario");
            }

            const tenantId = tenantData?.id || tenantData?.tenantid;
            if (!tenantId) {
                throw new Error("No se encontró ID del arrendatario para asignar a la vivienda");
            }

            const assignRes = await fetch(`${REACT_APP_API_URL}/apartments/${vivienda.id}/tenant`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ tenantid: tenantId })
            });

            const assignData = await assignRes.json().catch(() => ({}));
            if (!assignRes.ok) {
                throw new Error(assignData?.error || assignData?.message || "No se pudo asignar a la vivienda");
            }

            setVivienda((prev) => ({
                ...prev,
                tenant_id: assignData?.tenantid || tenantId,
                tenant_name: assignData?.tenant_name || payload.name,
                tenant_phone: assignData?.tenant_phone || payload.phone,
                tenant_email: assignData?.tenant_email || payload.email
            }));

            setTenantForm((prev) => ({ ...prev, password: "" }));
            setTenantMsg("Cuenta de arrendatario guardada y vinculada correctamente.");
        } catch (err) {
            console.error(err);
            setTenantMsg(err.message || "Error al gestionar la cuenta.");
        } finally {
            setTenantSaving(false);
        }
    };

    const mainImage =
        vivienda?.main_image ||
        vivienda?.image ||
        "https://th.bing.com/th/id/OIP.6XIv3DVREt05mi0sSNtUDgHaE8?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3";
    const isArchived = vivienda?.status === "ARCHIVED";
    const isOccupied = vivienda?.status === "OCCUPIED";

    return (
        <div className="vivienda-detail-page">
            <div className="container py-4">
                <div className="vivienda-detail-head mb-4">
                    <div>
                        <h2 className="vivienda-title">Viviendas</h2>
                        <p className="vivienda-subtitle">
                            Visualiza las viviendas registradas en el sistema fácil y rápidamente.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="manage-landlord-btn"
                        data-bs-toggle="modal"
                        data-bs-target="#tenantAccountModal"
                        onClick={abrirGestionArrendatario}
                    >
                        <LuSettings size={15} />
                        Gestionar cuenta de arrendatario
                    </button>
                </div>

                <div className="vivienda-breadcrumb mb-4">
                    <Link to="/viviendas" className="breadcrumb-link">
                        Todas las Viviendas
                    </Link>
                    <span className="breadcrumb-separator">{">"}</span>
                    <span className="breadcrumb-active">Detalles de la Vivienda</span>
                </div>

                <div className="row g-4">
                    <div className="col-xl-8">
                        <section className="detail-card">
                            <h4 className="detail-card-title">
                                <LuHouse size={20} />
                                Datos Generales
                            </h4>

                            <p className="detail-label">Dirección:</p>
                            <p className="detail-value">{vivienda ? `${vivienda.street || ''} ${vivienda.int_num || ''}, ${vivienda.division || ''} C.P. ${vivienda.postal_code || ''}`.trim() : "-"}</p>

                            <p className="detail-label mt-4">Imagen principal:</p>
                            <div className="main-image-wrap">
                                <img src={mainImage} alt="Vivienda" className="main-image" />
                            </div>
                        </section>
                    </div>

                    <div className="col-xl-4">
                        <section className="detail-card mb-4">
                            <h4 className="detail-card-title">
                                <LuInfo size={20} />
                                Información de la Vivienda
                            </h4>

                            <div className="info-row">
                                <span className="info-key">Precio de renta</span>
                                <span className="info-value text-success fw-bold">
                                    {vivienda?.depositamount ? `$${vivienda.depositamount.toLocaleString("en-US")}` : "-"}
                                </span>
                            </div>

                            <div className="info-row">
                                <span className="info-key">Arrendatario</span>
                                <span className="info-value">{vivienda?.tenant_name || "-"}</span>
                            </div>

                            <div className="info-row">
                                <span className="info-key">Fecha de pago</span>
                                <span className="info-value">{formatDate(vivienda?.latest_due_date)}</span>
                            </div>

                            <div className="info-row">
                                <span className="info-key">Estado</span>
                                <span className={`status-pill ${statusClass(vivienda?.status)}`}>
                                    <span className="status-solid-dot"></span>
                                    {statusLabel(vivienda?.status)}
                                </span>
                            </div>
                        </section>

                        <section className="detail-card">
                            <h4 className="detail-card-title">
                                <LuHand size={20} />
                                Acciones
                            </h4>

                            <div className="actions-row">
                                <button
                                    type="button"
                                    className="small-action-btn"
                                    data-bs-toggle="modal"
                                    data-bs-target="#editModal"
                                >
                                    <i className="bi bi-pencil-square"></i>
                                    Editar
                                </button>
                                <button
                                    type="button"
                                    className={`small-action-btn status-action-btn ${vivienda?.status === "ARCHIVED" ? "is-active archived" : ""}`}
                                    onClick={archivarVivienda}
                                >
                                    <i className={`bi ${vivienda?.status === "ARCHIVED" ? "bi-eye" : "bi-eye-slash"}`}></i>
                                    {vivienda?.status === "ARCHIVED" ? "Desarchivar" : "Archivar"}
                                </button>
                                <button
                                    type="button"
                                    className={`small-action-btn status-action-btn ${isArchived ? "is-active archived" : isOccupied ? "is-active occupied" : "is-active available"
                                        }`}
                                    onClick={() => {
                                        if (isArchived) return;
                                        cambiarEstado();
                                    }}
                                    disabled={isArchived}
                                >
                                    <i
                                        className={`bi ${isArchived ? "bi-eye-slash" : isOccupied ? "bi-x-circle" : "bi-check-circle"
                                            }`}
                                    ></i>
                                    {isArchived ? "Archivada" : isOccupied ? "Ocupada" : "Disponible"}
                                </button>
                            </div>
                            <div className="mt-3 d-flex align-items-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-dark btn-sm"
                                    onClick={guardarStatus}
                                    disabled={saving}
                                >
                                    {saving ? "Guardando..." : "Guardar"}
                                </button>
                                {saveMsg && (
                                    <small className={saveMsg.includes("correctamente") ? "text-success" : "text-danger"}>
                                        {saveMsg}
                                    </small>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                <Link to="/viviendas" className="back-link">
                    Volver a viviendas
                </Link>
                <EditarForm
                    propiedad={vivienda}
                    actualizarPropiedad={setVivienda}
                />
                <div
                    className="modal fade"
                    id="tenantAccountModal"
                    tabIndex="-1"
                    aria-labelledby="tenantAccountModalLabel"
                    aria-hidden="true"
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="tenantAccountModalLabel">
                                    {vivienda?.tenant_id ? "Editar arrendatario" : "Crear arrendatario"}
                                </h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>

                            <form onSubmit={guardarArrendatario}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Nombre completo</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={tenantForm.name}
                                            onChange={(e) => setTenantForm((prev) => ({ ...prev, name: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Teléfono</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={tenantForm.phone}
                                            onChange={(e) => setTenantForm((prev) => ({ ...prev, phone: e.target.value }))}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Correo</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={tenantForm.email}
                                            onChange={(e) => setTenantForm((prev) => ({ ...prev, email: e.target.value }))}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Identificación oficial</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={tenantForm.governmentid}
                                            onChange={(e) => setTenantForm((prev) => ({ ...prev, governmentid: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="mb-0">
                                        <label className="form-label">
                                            {vivienda?.tenant_id ? "Nueva contraseña (opcional)" : "Contraseña"}
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={tenantForm.password}
                                            onChange={(e) => setTenantForm((prev) => ({ ...prev, password: e.target.value }))}
                                            required={!vivienda?.tenant_id}
                                        />
                                    </div>
                                    {tenantMsg && (
                                        <small
                                            className={`d-block mt-2 ${tenantMsg.includes("correctamente") ? "text-success" : "text-danger"
                                                }`}
                                        >
                                            {tenantMsg}
                                        </small>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                                        Cerrar
                                    </button>
                                    <button type="submit" className="btn btn-dark" disabled={tenantSaving}>
                                        {tenantSaving ? "Guardando..." : "Guardar arrendatario"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};