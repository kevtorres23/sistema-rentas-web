import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Settings, Bell, X } from "lucide-react";
import "./Navbar.css";
import casaLogo from "../Assets/casa.png";
import { guardarNuevaFirma } from "../../Lib/funciones-firma";
import LienzoFirma from "../LienzoFirma";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => (location.pathname === path ? "text-dark fw-bold" : "text-muted");
  const role = localStorage.getItem("role");
  const isTenant = role === "tenant";

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("pagos");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [lienzoFirma, setLienzoFirma] = useState(false);

  const [paymentKeys, setPaymentKeys] = useState({
    stripe: "",
    conekta: "",
    mercadoPago: "",
    openpayId: "",
    openpayKey: ""
  });

  const [moraSettings, setMoraSettings] = useState({ tipo: "PORCENTAJE", valor: 10 });

  useEffect(() => {
    const savedKeys = JSON.parse(localStorage.getItem("paymentKeys"));
    const savedMora = JSON.parse(localStorage.getItem("moraSettings"));
    if (savedKeys) setPaymentKeys(savedKeys);
    if (savedMora) setMoraSettings(savedMora);
  }, [showModal]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePaymentChange = (e) => {
    setPaymentKeys({ ...paymentKeys, [e.target.name]: e.target.value });
  };

  const handleMoraChange = (e) => {
    setMoraSettings({ ...moraSettings, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    localStorage.setItem("paymentKeys", JSON.stringify(paymentKeys));
    localStorage.setItem(
      "moraSettings",
      JSON.stringify({
        tipo: moraSettings.tipo,
        valor: parseFloat(moraSettings.valor) || 0
      })
    );

    window.dispatchEvent(new Event("storage"));
    setShowModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setShowUserMenu(false);
    navigate("/");
  };

  function actualizarFirma() {
    setLienzoFirma(false);

    // Lógica aquí para guardar la firma en la base de datos u otro medio
    // como un repositorio privado, en caso de que queramos llamar las firmas por su URL.
  }

  return (
    <>
      <nav
        className="navbar navbar-expand-lg bg-white border-bottom py-2 px-3 px-md-4 sticky-top shadow-sm flex-wrap"
        style={{ zIndex: 1000, minHeight: "80px" }}
      >
        <div className="container-fluid p-0 d-flex flex-wrap align-items-center">
          {/* Logo */}
          <div className="d-flex align-items-center order-1">
            <img
              src={casaLogo}
              alt="Logo"
              style={{ width: "45px", height: "45px", objectFit: "contain", marginRight: "10px" }}
            />
            <div className="d-flex flex-column" style={{ lineHeight: "1.1" }}>
              <span className="fw-bold fs-6">Administración</span>
              <span className="text-secondary small">de Rentas</span>
            </div>
          </div>

          {/* Links Collapse */}
          {!isTenant && (
            <div className={`collapse navbar-collapse justify-content-center order-3 order-lg-2 w-lg-auto ${isNavOpen ? 'show mt-4 pb-3' : ''}`}>
              <div className="d-flex flex-column flex-lg-row align-items-center gap-3 gap-lg-4 mx-auto bg-light px-4 py-3 py-lg-2 rounded-4" style={{ borderRadius: isNavOpen ? '1rem' : '50rem' }}>
                <Link to="/viviendas" onClick={() => setIsNavOpen(false)} className={`text-decoration-none small fw-medium ${isActive("/viviendas")}`}>
                  Viviendas
                </Link>
                <Link to="/dashboard" onClick={() => setIsNavOpen(false)} className={`text-decoration-none small fw-medium ${isActive("/dashboard")}`}>
                  Dashboard
                </Link>
                <Link to="/reportes" onClick={() => setIsNavOpen(false)} className={`text-decoration-none small fw-medium ${isActive("/reportes")}`}>
                  Reportes
                </Link>
                <Link to="/incidencias" onClick={() => setIsNavOpen(false)} className={`text-decoration-none small fw-medium ${isActive("/incidencias")}`}>
                  Incidencias
                </Link>
                <Link to="/contratos" onClick={() => setIsNavOpen(false)} className={`text-decoration-none small fw-medium ${isActive("/contratos")}`}>
                  Contratos
                </Link>
              </div>
            </div>
          )}

          {/* Actions & Toggler */}
          <div className="d-flex align-items-center gap-2 gap-md-3 order-2 order-lg-3 ms-auto ms-lg-0">
            {!isTenant && (
              <>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn btn-light bg-white border rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center"
                  style={{ width: "40px", height: "40px" }}
                  title="Configuración"
                >
                  <Settings size={20} className="text-secondary" />
                </button>

                <button
                  className="btn btn-light bg-white border rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center position-relative"
                  style={{ width: "40px", height: "40px" }}
                >
                  <Bell size={20} className="text-secondary" />
                  <span
                    className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
                    style={{ width: "10px", height: "10px" }}
                  />
                </button>
              </>
            )}

            <div className="position-relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="d-flex align-items-center gap-2 bg-white border rounded-pill ps-1 pe-3 py-1 shadow-sm"
                style={{ cursor: "pointer" }}
              >
                <div
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  style={{ width: "32px", height: "32px", fontSize: "14px" }}
                >
                  {isTenant ? "AR" : "AD"}
                </div>
              </button>

              {showUserMenu && (
                <div
                  className="position-absolute end-0 mt-2 bg-white border rounded shadow-sm"
                  style={{ minWidth: "150px", zIndex: 1100 }}
                >
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none text-dark w-100 text-start px-3 py-2"
                    onClick={handleLogout}
                  >
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Toggler */}
            {!isTenant && (
              <button
                className="navbar-toggler border-0 px-1 ms-1 d-lg-none"
                type="button"
                onClick={() => setIsNavOpen(!isNavOpen)}
                style={{ boxShadow: "none" }}
              >
                {isNavOpen ? <X size={28} className="text-dark" /> : <span className="navbar-toggler-icon"></span>}
              </button>
            )}
          </div>
        </div>
      </nav>

      {!isTenant && showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div
            className="bg-white rounded-4 shadow-lg d-flex flex-column"
            style={{ width: "800px", maxWidth: "95%", maxHeight: "90vh" }}
          >
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
              <h4 className="fw-bold m-0" style={{ color: "#1B2559" }}>
                Configuración
              </h4>
              <button onClick={() => setShowModal(false)} className="btn btn-sm btn-light rounded-circle p-2">
                <X size={20} />
              </button>
            </div>

            <div className="d-flex flex-grow-1 overflow-hidden">
              <div className="bg-light border-end" style={{ width: "250px" }}>
                <ul className="list-unstyled p-0 m-0">
                  <li>
                    <button
                      className={`w-100 text-start px-4 py-3 border-0 ${activeTab === "pagos"
                        ? "bg-white fw-bold border-start border-primary border-4"
                        : "bg-transparent text-muted"
                        }`}
                      onClick={() => setActiveTab("pagos")}
                    >
                      Información de Pago
                    </button>
                  </li>
                  <li>
                    <button
                      className={`w-100 text-start px-4 py-3 border-0 ${activeTab === "mora"
                        ? "bg-white fw-bold border-start border-primary border-4"
                        : "bg-transparent text-muted"
                        }`}
                      onClick={() => setActiveTab("mora")}
                    >
                      Cobros y Mora
                    </button>
                  </li>
                  <li>
                    <button
                      className={`w-100 text-start px-4 py-3 border-0 ${activeTab === "firma"
                        ? "bg-white fw-bold border-start border-primary border-4"
                        : "bg-transparent text-muted"
                        }`}
                      onClick={() => setActiveTab("firma")}
                    >
                      Firma de Documentos
                    </button>
                  </li>
                </ul>
              </div>

              <div className="flex-grow-1 p-4 overflow-auto">
                {activeTab === "pagos" && (
                  <div>
                    <h5 className="fw-bold mb-4" style={{ color: "#1B2559" }}>
                      Integracion de Pagos
                    </h5>
                    <div
                      className="alert alert-info d-flex align-items-center mb-4 border-0"
                      style={{ backgroundColor: "#E0F7FA", color: "#006064" }}
                    >
                      <span className="me-2">OK</span> Ingrese sus llaves de prueba (Sandbox/Test)
                    </div>

                    <div className="mb-3 p-3 border rounded">
                      <label className="form-label fw-bold" style={{ color: "#4318FF" }}>
                        Stripe (Tarjetas)
                      </label>
                      <input
                        type="text"
                        name="stripe"
                        className="form-control"
                        placeholder="pk_test_..."
                        value={paymentKeys.stripe}
                        onChange={handlePaymentChange}
                      />
                    </div>

                    <div className="mb-3 p-3 border rounded">
                      <label className="form-label fw-bold" style={{ color: "#05CD99" }}>
                        Conekta (OXXO Pay)
                      </label>
                      <input
                        type="text"
                        name="conekta"
                        className="form-control"
                        placeholder="key_..."
                        value={paymentKeys.conekta}
                        onChange={handlePaymentChange}
                      />
                    </div>

                    <div className="mb-3 p-3 border rounded">
                      <label className="form-label fw-bold" style={{ color: "#009EE3" }}>
                        MercadoPago (QR/SPEI)
                      </label>
                      <input
                        type="text"
                        name="mercadoPago"
                        className="form-control"
                        placeholder="TEST-..."
                        value={paymentKeys.mercadoPago}
                        onChange={handlePaymentChange}
                      />
                    </div>

                    <div className="mb-4 p-3 border rounded border-primary bg-light">
                      <label className="form-label fw-bold" style={{ color: "#2C3E50" }}>
                        Openpay (BBVA)
                      </label>
                      <div className="d-flex gap-2">
                        <input
                          type="text"
                          name="openpayId"
                          className="form-control w-50"
                          placeholder="Merchant ID"
                          value={paymentKeys.openpayId}
                          onChange={handlePaymentChange}
                        />
                        <input
                          type="text"
                          name="openpayKey"
                          className="form-control w-50"
                          placeholder="Private Key (sk_test_...)"
                          value={paymentKeys.openpayKey}
                          onChange={handlePaymentChange}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "mora" && (
                  <div>
                    <h5 className="fw-bold mb-4" style={{ color: "#1B2559" }}>
                      Cobros y Mora
                    </h5>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Tipo de recargo</label>
                        <select name="tipo" className="form-select" value={moraSettings.tipo} onChange={handleMoraChange}>
                          <option value="PORCENTAJE">Porcentaje (%)</option>
                          <option value="FIJO">Monto Fijo ($)</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Valor</label>
                        <input
                          type="number"
                          name="valor"
                          className="form-control"
                          value={moraSettings.valor}
                          onChange={handleMoraChange}
                        />
                      </div>
                    </div>
                    <p className="text-muted small mt-2">
                      * Este valor se aplicara automaticamente a los inquilinos con estatus "Vencido" en el Dashboard.
                    </p>
                  </div>
                )}

                {activeTab === "firma" && (
                  <div>
                    <h5 className="fw-bold mb-4" style={{ color: "#1B2559" }}>
                      Firma de Documentos
                    </h5>

                    {!lienzoFirma && (
                      <>
                        <div className="col mb-6">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Firma actual</label>
                            <div>
                              <img>
                                {/* Imagen de la firma del usuario aquí: BLOB o link a la imagen */}
                              </img>
                            </div>
                          </div>
                        </div>

                        <button
                          className="btn btn-primary px-4"
                          onClick={() => setLienzoFirma(true)}
                          style={{ backgroundColor: "#4318FF", border: "none" }}
                        >
                          Editar firma
                        </button>
                      </>
                    )}

                    {lienzoFirma && (
                      <>
                        <LienzoFirma />

                        <div style={{marginTop: 20}} className="botones">
                          <button
                            className="btn btn-primary px-4"
                            onClick={actualizarFirma}
                            style={{ backgroundColor: "#4318FF", border: "none", marginRight: 5 }}
                          >
                            Actualizar firma
                          </button>

                          <button
                            className="btn btn-secondary px-4"
                            onClick={() => setLienzoFirma(false)}
                            style={{ backgroundColor: "#dadada", border: "none", color: "black" }}
                          >
                            Cancelar edición
                          </button>
                        </div>
                      </>
                    )}

                    <p className="text-muted small mt-2">
                      Esta firma se colocará automáticamente en los contratos y pagarés relacionados con tus convenios.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 border-top d-flex justify-content-end gap-2 bg-light rounded-bottom-4">
              <button className="btn btn-outline-secondary px-4" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary px-4"
                onClick={handleSave}
                style={{ backgroundColor: "#4318FF", border: "none" }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
