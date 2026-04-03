import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { api } from "../config/api";
import "../view-styles/HomeIncidencias.css";

const LIMITE_DESCRIPCION = 220;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const EXTENSIONES_VALIDAS = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".mp4",
    ".webm",
    ".mov",
]);

const leerRespuesta = async (response) => {
    const text = await response.text();

    try {
        return text ? JSON.parse(text) : {};
    } catch {
        return { raw: text };
    }
};

const normalizarIncidencia = (incidencia) => ({
    id: incidencia?.id ?? incidencia?.requestid ?? Date.now(),
    status:
        incidencia?.status === "resuelta" ||
            String(incidencia?.status || "").toUpperCase() === "COMPLETED"
            ? "resuelta"
            : "pendiente",
    fecha:
        incidencia?.fecha ||
        incidencia?.requestdate ||
        incidencia?.request_date ||
        new Date().toISOString(),
    img:
        incidencia?.img ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400",
    ubicacion:
        incidencia?.ubicacion ||
        incidencia?.apartment_address ||
        "Sin ubicacion",
    arrendatario:
        incidencia?.arrendatario ||
        incidencia?.tenant_name ||
        "Sin asignar",
    avatar: incidencia?.avatar || null,
    descripcion:
        incidencia?.descripcion ||
        incidencia?.description ||
        "Sin descripcion",
    media: Array.isArray(incidencia?.media) ? incidencia.media : [],
});

const HomeIncidencias = () => {
    const navigate = useNavigate();
    const obtenerToken = () => localStorage.getItem("token") || "";
    const [incidenciasData, setIncidenciasData] = useState([]);
    const [filtroBusqueda, setFiltroBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todas");
    const [orden, setOrden] = useState("recientes");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [nuevaDescripcion, setNuevaDescripcion] = useState("");
    const [archivos, setArchivos] = useState([]);
    const [erroresArchivos, setErroresArchivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState("");

    const construirMediaUrl = (id) => {
        const token = obtenerToken();
        return api(`/maintenancerequests/media/${id}?token=${encodeURIComponent(token)}`);
    };
    const obtenerUrlMedia = (media) => {
        if (media?.storage_path && /^https?:\/\//i.test(media.storage_path)) {
            return media.storage_path;
        }
        return media?.id ? construirMediaUrl(media.id) : "";
    };
    const abrirEvidencia = (url) => {
        if (!url) {
            return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
    };

    useEffect(() => {
        const controller = new AbortController();

        const cargarIncidencias = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(api("/maintenancerequests"), {
                    signal: controller.signal,
                    headers: {
                        Authorization: `Bearer ${obtenerToken()}`,
                    },
                });

                const data = await leerRespuesta(response);

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        data?.error ||
                        (data?.raw?.startsWith("<!DOCTYPE") ? "La API devolvio HTML y no JSON. Revisa la ruta desplegada." : null) ||
                        "No se pudieron cargar las incidencias"
                    );
                }

                const base = Array.isArray(data) ? data.map(normalizarIncidencia) : [];
                setIncidenciasData(base);
            } catch (err) {
                if (err.name === "AbortError") {
                    return;
                }
                console.error(err);
                setError(err.message || "No se pudieron cargar las incidencias");
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        cargarIncidencias();

        return () => {
            controller.abort();
        };
    }, []);

    const restablecerFiltros = () => {
        setFiltroBusqueda("");
        setFiltroEstado("todas");
        setOrden("recientes");
    };

    const actualizarEstado = async (id, status) => {
        try {
            setError("");

            const response = await fetch(api(`/maintenancerequests/${id}/status`), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${obtenerToken()}`,
                },
                body: JSON.stringify({ status }),
            });

            const data = await leerRespuesta(response);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    (data?.raw?.startsWith("<!DOCTYPE") ? "La ruta para actualizar estado no existe en la API desplegada." : null) ||
                    "No se pudo actualizar la incidencia"
                );
            }

            setIncidenciasData((prev) =>
                prev.map((incidencia) =>
                    incidencia.id === id
                        ? {
                            ...normalizarIncidencia(data),
                            media: incidencia.media || [],
                        }
                        : incidencia
                )
            );
        } catch (err) {
            console.error(err);
            setError(err.message || "No se pudo actualizar la incidencia");
        }
    };

    const cerrarModal = () => {
        archivos.forEach((archivo) => {
            if (archivo.preview) {
                URL.revokeObjectURL(archivo.preview);
            }
        });
        setMostrarModal(false);
        setNuevaDescripcion("");
        setArchivos([]);
        setErroresArchivos([]);
        setError("");
    };

    const agregarArchivos = (event) => {
        const seleccionados = Array.from(event.target.files || []);
        if (!seleccionados.length) {
            return;
        }

        const nuevos = [];
        const errores = [];

        seleccionados.forEach((file) => {
            const index = file.name.lastIndexOf(".");
            const ext = index >= 0 ? file.name.slice(index).toLowerCase() : "";

            if (!EXTENSIONES_VALIDAS.has(ext)) {
                errores.push(`${file.name}: formato no permitido.`);
                return;
            }

            if (file.size > MAX_FILE_SIZE) {
                errores.push(`${file.name}: excede 10 MB.`);
                return;
            }

            nuevos.push({
                id: `${file.name}-${file.size}-${file.lastModified}`,
                file,
                tipo: file.type?.startsWith("video/") ? "VIDEO" : "IMAGEN",
                preview: URL.createObjectURL(file),
            });
        });

        setArchivos((prev) => [...prev, ...nuevos]);
        setErroresArchivos(errores);
        event.target.value = "";
    };

    const quitarArchivo = (id) => {
        setArchivos((prev) => {
            const actualizado = prev.filter((archivo) => archivo.id !== id);
            const eliminado = prev.find((archivo) => archivo.id === id);
            if (eliminado?.preview) {
                URL.revokeObjectURL(eliminado.preview);
            }
            return actualizado;
        });
    };

    const crearIncidencia = async () => {
        const descripcion = nuevaDescripcion.trim();

        if (!descripcion || enviando) {
            return;
        }

        try {
            const token = obtenerToken();
            const decoded = token ? jwtDecode(token) : null;
            const tenantid = decoded?.id;

            setEnviando(true);
            setError("");

            const response = await fetch(api("/maintenancerequests"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    tenantid,
                    requestdate: new Date().toISOString().slice(0, 10),
                    description: descripcion,
                    status: "PENDING",
                }),
            });

            const data = await leerRespuesta(response);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    (data?.raw?.startsWith("<!DOCTYPE") ? "La API devolvio HTML y no JSON. Revisa la ruta desplegada." : null) ||
                    "No se pudo crear la incidencia"
                );
            }

            let incidenciaCreada = normalizarIncidencia(data);

            if (archivos.length) {
                try {
                    const formData = new FormData();
                    archivos.forEach((archivo) => {
                        formData.append("media", archivo.file);
                    });

                    const mediaResponse = await fetch(
                        api(`/maintenancerequests/${incidenciaCreada.id}/media`),
                        {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                            body: formData,
                        }
                    );

                    const mediaData = await leerRespuesta(mediaResponse);

                    if (!mediaResponse.ok) {
                        throw new Error(
                            mediaData?.message || mediaData?.error || "No se pudieron subir los archivos"
                        );
                    }

                    incidenciaCreada = {
                        ...incidenciaCreada,
                        media: Array.isArray(mediaData) ? mediaData : [],
                    };
                } catch (uploadErr) {
                    console.error(uploadErr);
                    setError(uploadErr.message || "No se pudieron subir los archivos");
                }
            }

            setIncidenciasData((prev) => [incidenciaCreada, ...prev]);
            setFiltroEstado("todas");
            setOrden("recientes");
            cerrarModal();
        } catch (err) {
            console.error(err);
            setError(err.message || "No se pudo crear la incidencia");
        } finally {
            setEnviando(false);
        }
    };

    const incidencias = useMemo(() => {
        const texto = filtroBusqueda.trim().toLowerCase();

        const filtradas = incidenciasData.filter((incidencia) => {
            const ubicacion = String(incidencia.ubicacion || "").toLowerCase();
            const arrendatario = String(incidencia.arrendatario || "").toLowerCase();
            const descripcion = String(incidencia.descripcion || "").toLowerCase();

            const coincideBusqueda =
                ubicacion.includes(texto) ||
                arrendatario.includes(texto) ||
                descripcion.includes(texto);

            const coincideEstado =
                filtroEstado === "todas" ? true : incidencia.status === filtroEstado;

            return coincideBusqueda && coincideEstado;
        });

        return [...filtradas].sort((a, b) => {
            const fechaA = new Date(a.fecha).getTime();
            const fechaB = new Date(b.fecha).getTime();

            if (orden === "recientes") {
                return fechaB - fechaA;
            }

            return fechaA - fechaB;
        });
    }, [filtroBusqueda, filtroEstado, incidenciasData, orden]);

    return (
        <div className="home-incidencias-page">
            <div className="container-fluid px-4 px-lg-5 py-4 py-lg-5">
                <div className="home-incidencias-shell">
                    <button
                        type="button"
                        className="home-incidencias-back-btn"
                        onClick={() => navigate("/home")}
                    >
                        <i className="bi bi-arrow-left" />
                        Volver al inicio
                    </button>

                    <div className="home-incidencias-header">
                        <div>
                            <h1 className="home-incidencias-title">Incidencias</h1>
                            <p className="home-incidencias-subtitle">
                                Consulta aqui todas las incidencias reportadas en el sistema.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="home-incidencias-create-btn"
                            onClick={() => setMostrarModal(true)}
                        >
                            <span>+</span>
                            Nueva incidencia
                        </button>
                    </div>

                    <div className="home-incidencias-toolbar">
                        <label className="home-incidencias-search">
                            <i className="bi bi-search" />
                            <input
                                type="text"
                                placeholder="Buscar una incidencia..."
                                value={filtroBusqueda}
                                onChange={(e) => setFiltroBusqueda(e.target.value)}
                            />
                        </label>

                        <div className="home-incidencias-sort-group">
                            <button
                                type="button"
                                className={`home-incidencias-sort-btn ${orden === "recientes" ? "is-active" : ""}`}
                                onClick={() => setOrden("recientes")}
                            >
                                <i className="bi bi-calendar4-week" />
                                Mas recientes primero
                            </button>
                            <button
                                type="button"
                                className={`home-incidencias-sort-btn ${orden === "antiguas" ? "is-active" : ""}`}
                                onClick={() => setOrden("antiguas")}
                            >
                                <i className="bi bi-calendar4-event" />
                                Mas antiguas primero
                            </button>
                        </div>
                    </div>

                    <div className="home-incidencias-filters">
                        <button
                            type="button"
                            className={`home-incidencias-filter-btn ${filtroEstado === "todas" ? "is-active" : ""}`}
                            onClick={restablecerFiltros}
                        >
                            Todas
                        </button>
                        <button
                            type="button"
                            className={`home-incidencias-filter-btn ${filtroEstado === "resuelta" ? "is-active is-success" : ""}`}
                            onClick={() => setFiltroEstado("resuelta")}
                        >
                            Resueltas
                        </button>
                        <button
                            type="button"
                            className={`home-incidencias-filter-btn ${filtroEstado === "pendiente" ? "is-active is-warning" : ""}`}
                            onClick={() => setFiltroEstado("pendiente")}
                        >
                            Pendientes
                        </button>
                    </div>

                    <div className="home-incidencias-table-card">
                        <div className="home-incidencias-table-head">
                            <span>Imagen</span>
                            <span>Ubicacion</span>
                            <span>Arrendatario</span>
                            <span>Incidencia</span>
                            <span>Estado</span>
                        </div>

                        <div className="home-incidencias-table-body">
                            {loading ? (
                                <div className="home-incidencias-empty-state">
                                    Cargando incidencias...
                                </div>
                            ) : null}

                            {!loading && error ? (
                                <div className="home-incidencias-empty-state home-incidencias-empty-state--error">
                                    {error}
                                </div>
                            ) : null}

                            {!loading && !error && incidencias.length === 0 ? (
                                <div className="home-incidencias-empty-state">
                                    Aun no has reportado incidencias.
                                </div>
                            ) : null}

                            {incidencias.map((incidencia) => (
                                <article className="home-incidencias-row" key={incidencia.id}>
                                    <div className="home-incidencias-cell home-incidencias-image-cell">
                                        <span className="home-incidencias-mobile-label">Imagen</span>
                                        {incidencia.media?.[0] ? (
                                            incidencia.media[0].tipo === "VIDEO" ? (
                                                <video
                                                    src={obtenerUrlMedia(incidencia.media[0])}
                                                    className="home-incidencias-image"
                                                    controls
                                                    preload="metadata"
                                                />
                                            ) : (
                                                <img
                                                    src={obtenerUrlMedia(incidencia.media[0])}
                                                    alt="Evidencia"
                                                    className="home-incidencias-image"
                                                />
                                            )
                                        ) : (
                                            <img src={incidencia.img} alt="Vivienda" className="home-incidencias-image" />
                                        )}
                                    </div>

                                    <div className="home-incidencias-cell">
                                        <span className="home-incidencias-mobile-label">Ubicacion</span>
                                        <p className="home-incidencias-location">{incidencia.ubicacion}</p>
                                    </div>

                                    <div className="home-incidencias-cell">
                                        <span className="home-incidencias-mobile-label">Arrendatario</span>
                                        <div className="home-incidencias-tenant">
                                            {incidencia.avatar ? (
                                                <img
                                                    src={incidencia.avatar}
                                                    alt={incidencia.arrendatario}
                                                    className="home-incidencias-avatar"
                                                />
                                            ) : (
                                                <div className="home-incidencias-avatar home-incidencias-avatar--placeholder">
                                                    <i className="bi bi-person-fill" />
                                                </div>
                                            )}
                                            <span>{incidencia.arrendatario}</span>
                                        </div>
                                    </div>

                                    <div className="home-incidencias-cell">
                                        <span className="home-incidencias-mobile-label">Incidencia</span>
                                        <div className="home-incidencias-description-box">
                                            {incidencia.descripcion}
                                        </div>
                                        {incidencia.media?.length ? (
                                            <div className="home-incidencias-media-grid">
                                                {incidencia.media.map((media) =>
                                                    media.tipo === "VIDEO" ? (
                                                        <div className="home-incidencias-media-card" key={media.id}>
                                                            <video
                                                                src={obtenerUrlMedia(media)}
                                                                controls
                                                                preload="metadata"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="home-incidencias-media-btn"
                                                                onClick={() => abrirEvidencia(obtenerUrlMedia(media))}
                                                            >
                                                                Ver evidencia
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="home-incidencias-media-card" key={media.id}>
                                                            <img
                                                                src={obtenerUrlMedia(media)}
                                                                alt="Evidencia"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="home-incidencias-media-btn"
                                                                onClick={() => abrirEvidencia(obtenerUrlMedia(media))}
                                                            >
                                                                Ver evidencia
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <div className="home-incidencias-media-empty">
                                                Sin evidencias adjuntas.
                                            </div>
                                        )}
                                    </div>

                                    <div className="home-incidencias-cell">
                                        <span className="home-incidencias-mobile-label">Estado</span>
                                        <div className="home-incidencias-status-group">
                                            <button
                                                type="button"
                                                className={`home-incidencias-status-pill ${incidencia.status === "resuelta" ? "is-success" : "is-muted"
                                                    }`}
                                                onClick={() => actualizarEstado(incidencia.id, "resuelta")}
                                            >
                                                Resuelta
                                            </button>
                                            <button
                                                type="button"
                                                className={`home-incidencias-status-pill ${incidencia.status === "pendiente" ? "is-warning" : "is-muted"
                                                    }`}
                                                onClick={() => actualizarEstado(incidencia.id, "pendiente")}
                                            >
                                                Pendiente
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {mostrarModal ? (
                <div className="home-incidencias-modal-overlay" onClick={cerrarModal}>
                    <div
                        className="home-incidencias-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="home-incidencias-modal-header">
                            <h2>Nueva Incidencia</h2>
                            <button
                                type="button"
                                className="home-incidencias-modal-close"
                                onClick={cerrarModal}
                                aria-label="Cerrar modal"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        <div className="home-incidencias-modal-body">
                            {error ? (
                                <div className="home-incidencias-modal-error">{error}</div>
                            ) : null}

                            <label
                                htmlFor="nueva-incidencia-descripcion"
                                className="home-incidencias-modal-label"
                            >
                                Descripción
                            </label>
                            <textarea
                                id="nueva-incidencia-descripcion"
                                className="home-incidencias-modal-textarea"
                                placeholder="Ingresa brevemente la incidencia que quieres reportar."
                                value={nuevaDescripcion}
                                onChange={(e) => setNuevaDescripcion(e.target.value)}
                                maxLength={LIMITE_DESCRIPCION}
                                rows={6}
                            />
                            <div className="home-incidencias-modal-counter">
                                {nuevaDescripcion.length}/{LIMITE_DESCRIPCION}
                            </div>

                            <div className="home-incidencias-upload">
                                <label className="home-incidencias-upload-box">
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        multiple
                                        onChange={agregarArchivos}
                                    />
                                    <i className="bi bi-cloud-arrow-up" />
                                    <div>
                                        <strong>Adjunta imagenes o videos</strong>
                                        <p>Formatos permitidos: jpg, png, gif, webp, mp4, webm, mov (max 10 MB)</p>
                                    </div>
                                </label>

                                {erroresArchivos.length ? (
                                    <ul className="home-incidencias-upload-errors">
                                        {erroresArchivos.map((mensaje) => (
                                            <li key={mensaje}>{mensaje}</li>
                                        ))}
                                    </ul>
                                ) : null}

                                {archivos.length ? (
                                    <div className="home-incidencias-upload-list">
                                        {archivos.map((archivo) => (
                                            <div className="home-incidencias-upload-item" key={archivo.id}>
                                                {archivo.tipo === "VIDEO" ? (
                                                    <video src={archivo.preview} muted controls />
                                                ) : (
                                                    <img src={archivo.preview} alt={archivo.file.name} />
                                                )}
                                                <div>
                                                    <p>{archivo.file.name}</p>
                                                    <button type="button" onClick={() => quitarArchivo(archivo.id)}>
                                                        Quitar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="home-incidencias-modal-footer">
                            <button
                                type="button"
                                className="home-incidencias-modal-submit"
                                onClick={crearIncidencia}
                                disabled={!nuevaDescripcion.trim() || enviando}
                            >
                                <i className="bi bi-send" />
                                {enviando ? "Enviando..." : "Enviar incidencia"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default HomeIncidencias;