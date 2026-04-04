import React, { useState, useEffect } from "react";
import "./Home.css";
import { FileText, CreditCard, AlertCircle, FileDown, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { REACT_APP_API_URL } from "../../config";

const token = localStorage.getItem("token");

const openDocument = async (contractId) => {
  const res = await fetch(`/api/documents/contract/${contractId}`);
  const data = await res.json();

  window.open(data.url, "_blank");
};

const Home = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Cargar datos desde la base de datos al abrir la pagina
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const response = await fetch(`${REACT_APP_API_URL}/dashboard-cliente`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Error en la respuesta del servidor");

        const data = await response.json();
        setDatos(data);
        console.log(data);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  // 2. Funcion de pago de Openpay con datos reales de la BD
  const handlePagar = async () => {
    if (isProcessing || !datos?.datosVivienda) return;
    setIsProcessing(true);

    try {
      const response = await fetch(`${REACT_APP_API_URL}/pagos/openpay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceid: datos.datosVivienda.invoiceid,
          monto: parseFloat(datos.datosVivienda.amount),
          descripcion: `Mensualidad - ${datos.datosVivienda.address}`,
          cliente: {
            nombre: datos.datosVivienda.name.split(" ")[0] || "Inquilino",
            apellidos: datos.datosVivienda.name.split(" ").slice(1).join(" ") || "",
            correo: datos.datosVivienda.email || "inquilino@ejemplo.com",
            telefono: datos.datosVivienda.phone || "0000000000"
          }
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        console.error("Error al generar pago:", data);
        alert(`Error al generar el pago: ${data.message || data.detalles || "Intenta mas tarde."}`);
      }
    } catch (error) {
      console.error("Error de red conectando con el servidor:", error);
      alert("No se pudo conectar con el servidor. El backend esta encendido o la URL de Vercel es correcta?");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="home-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader size={40} className="animate-spin" />
        <span style={{ marginLeft: "15px", fontSize: "1.2rem", color: "#555" }}>Cargando datos de tu vivienda...</span>
      </div>
    );
  }

  if (!datos || !datos.datosVivienda) {
    return (
      <div className="home-container">
        <h4 className="title">Bienvenido!</h4>
        <p className="subtitle">Actualmente no tienes contratos activos ni facturas pendientes en el sistema.</p>
      </div>
    );
  }

  const { datosVivienda, historialRecibos } = datos;
  const estaPagado = datosVivienda.status === "PAID";

  return (
    <div className="home-container">
      <h4 className="title">Bienvenido de vuelta, {datosVivienda.name.split(" ")[0]}!</h4>
      <p className="subtitle">Que deseas hacer hoy?</p>

      <div className="cards-container">
        <div className="card">
          <h3>Acciones rapidas</h3>
          <div className="actions">
            <div
              className={`action-item ${estaPagado ? "gray" : "green"}`}
              onClick={estaPagado ? null : handlePagar}
              style={{
                cursor: (isProcessing || estaPagado) ? "not-allowed" : "pointer",
                opacity: (isProcessing || estaPagado) ? 0.6 : 1,
                backgroundColor: estaPagado ? "#e0e0e0" : undefined,
                color: estaPagado ? "#666" : undefined
              }}
            >
              {isProcessing ? (
                <Loader size={28} className="animate-spin" />
              ) : (
                <CreditCard size={28} />
              )}
              <span>{estaPagado ? "Al corriente" : (isProcessing ? "Procesando..." : "Pagar")}</span>
            </div>

            <div className="action-item blue">
              <FileText size={28} />
              <button onClick={() => openDocument(datos.datosVivienda.contractid)}>
                Descargar contrato
              </button>
            </div>

            <div
              className="action-item orange"
              onClick={() => navigate("/home/incidencias")}
              style={{ cursor: "pointer" }}
            >
              <AlertCircle size={28} />
              <span>Incidencias</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h4>Informacion del cliente</h4>
          <p className="address">{datosVivienda.address}</p>

          <div className="info-row">
            <span>Monto total a pagar</span>
            <strong>${parseFloat(datosVivienda.amount).toFixed(2)}</strong>
          </div>

          <div className="info-row">
            <span>Fecha limite de pago</span>
            <strong style={{ textTransform: "capitalize" }}>
              {new Date(datosVivienda.duedate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </strong>
          </div>

          <div className="info-row">
            <span>Estado del pago</span>
            <strong className={estaPagado ? "paid" : "pending"} style={{ color: estaPagado ? "#10b981" : "#f59e0b" }}>
              {estaPagado ? "Pagado" : "Pendiente"}
            </strong>
          </div>
        </div>

        <div className="card">
          <h3>Recibos Anteriores</h3>
          <div className={`receipts-scroll ${historialRecibos.length > 5 ? "limit-5" : ""}`}>
            {historialRecibos.length === 0 ? (
              <p style={{ color: "#888", fontSize: "0.9rem", padding: "10px 0" }}>Aun no tienes recibos pagados.</p>
            ) : (
              historialRecibos.map((recibo) => (
                <div key={recibo.id} className="receipt-row">
                  <span style={{ textTransform: "capitalize" }}>
                    {new Date(recibo.duedate).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                  </span>
                  <button className="pdf-btn">
                    <FileDown size={16} />
                    Descargar PDF
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
