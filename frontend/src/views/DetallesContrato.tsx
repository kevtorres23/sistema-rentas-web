import React, { useEffect, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import { type InvoiceStatus, type Invoice, type Contract } from "../types/ContractTypes";
import { useParams } from "react-router-dom";
import { REACT_APP_API_URL } from "../config/api-url";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import EditarContratoModal from "../components/forms/EditarContratoModal"

export const token = localStorage.getItem("token");

export default function ContractDetails() {

    const { id } = useParams();
    const [contrato, setContrato] = useState<Contract>({ id: "", name: "", depositamount: 0, tenantname: "", startdate: new Date(), enddate: new Date() });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // Modal state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice>();
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    const [editingContractId, setEditingContractId] = useState("");

    const handleContractUpdated = () => {
        setEditingContractId("");
        fetchData();
    };

    const handlePaymentSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setPaymentLoading(true);
        setPaymentError('');
        try {
            const response = await fetch(`${REACT_APP_API_URL}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    invoiceid: selectedInvoice ? selectedInvoice.id : "",
                    paymentdate: paymentDate,
                    amount: paymentAmount,
                    method: paymentMethod
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error registrando el pago');
            }

            // Refresh invoices
            const invoicesRes = await fetch(`${REACT_APP_API_URL}/invoices?contract_id=${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const invoicesData = await invoicesRes.json();
            setInvoices(invoicesData);
            setShowPaymentModal(false);
        } catch (err: any) {
            setPaymentError(err.message);
        } finally {
            setPaymentLoading(false);
        }
    };

    function formatDate(dateString: Date) {
        const date = new Date(dateString);

        return new Intl.DateTimeFormat('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    }
    const fetchData = async () => {
        try {
            setLoading(true);

            const [contractRes, invoicesRes] = await Promise.all([
                fetch(`${REACT_APP_API_URL}/rentalcontracts/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${REACT_APP_API_URL}/invoices?contract_id=${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (!contractRes.ok || !invoicesRes.ok) {
                throw new Error("Error loading data");
            }

            const contractData = await contractRes.json();
            const invoicesData = await invoicesRes.json();

            setContrato(contractData);
            setInvoices(invoicesData);

        } catch (err) {
            console.error(err);
            setError("Error loading data");
        } finally {
            setLoading(false);
        }
    }
    // ⬇ Fetch data from backend on page load
    useEffect(() => {
        fetchData();
    }, [id, token]);


    if (loading) return <div className="text-center py-5">Cargando datos...</div>;
    if (error) return <div className="text-center py-5 text-danger">{error}</div>;

    const contractId = contrato?.id ? String(contrato.id).padStart(4, "0") : "----";

    return (
        <div className="container-fluid px-5 py-4 bg-light min-vh-100">

            {editingContractId && (
                <EditarContratoModal
                    contractId={editingContractId}
                    onClose={() => setEditingContractId("")}
                    onUpdated={handleContractUpdated}
                />
            )}

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold">Contratos</h3>
                    <p className="text-muted mb-1">
                        Consulta los contratos que han sido generados en el sistema.
                    </p>

                    <div className="mt-2">
                        <span className="text-muted">Todos los Contratos</span>
                        <span className="mx-2">{">"}</span>
                        <span className="text-primary fw-semibold">
                            Detalles del Contrato-{contractId}
                        </span>
                    </div>
                </div>

                <button className="btn btn-dark" onClick={() => setEditingContractId(contrato.id)}>
                    <i className="bi bi-pencil me-2"></i>
                    Editar contrato
                </button>
            </div>

            <div className="row g-4">

                {/* LEFT SIDE - PAYMENT TABLE */}
                <div className="col-lg-8">
                    <div className="card w-100 shadow-sm border-0 rounded-4">
                        <div className="card-body">

                            <h6 className="fw-bold mb-3">
                                <i className="bi bi-credit-card me-2"></i>
                                Corrida de pagos de renta
                            </h6>

                            <div className="table-responsive">
                                <table className="table align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Fecha de pago</th>
                                            <th>Concepto</th>
                                            <th>Pago pendiente</th>
                                            <th>Pagado</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.map((p, index) => (
                                            <tr key={p.id}>
                                                <td>{formatDate(p.duedate)}</td>
                                                <td>Pago de renta</td>
                                                <td className="text-warning fw-semibold">
                                                    ${p.amount - p.total_paid}
                                                </td>
                                                <td className="text-success fw-semibold">
                                                    ${p.total_paid}
                                                </td>
                                                <td>
                                                    <StatusBadge status={p.status} />
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <button title="Ver recibo" className="btn btn-sm btn-outline-secondary">
                                                            <i className="bi bi-receipt"></i>
                                                        </button>
                                                        <button
                                                            title="Pago manual"
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => {
                                                                setSelectedInvoice(p);
                                                                setPaymentAmount(p.amount - p.total_paid);
                                                                setPaymentDate(new Date().toISOString().split('T')[0]);
                                                                setPaymentMethod('CASH');
                                                                setShowPaymentModal(true);
                                                            }}
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </button>
                                                        <button title="Enviar recordatorio" className="btn btn-sm btn-outline-secondary">
                                                            <i className="bi bi-envelope"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="d-flex justify-content-between mt-3">
                                <small className="text-muted">Mostrando {invoices.length} pagos</small>
                                <small className="text-muted">
                                    Página 1 de 1
                                </small>
                            </div>

                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - CONTRACT INFO */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-body">

                            <h6 className="fw-bold mb-3">
                                <i className="bi bi-info-circle me-2"></i>
                                Información del Contrato
                            </h6>

                            <div className="mb-3">
                                <small className="text-muted">Costo de Renta</small>
                                <div className="text-success fw-bold">${contrato.depositamount}</div>
                            </div>

                            <div className="mb-3">
                                <small className="text-muted">Arrendatario</small>
                                <div>{contrato.tenantname}</div>
                            </div>

                            <div>
                                <small className="text-muted">Duración del contrato</small>
                                <div>
                                    {formatDate(contrato.startdate)} al
                                    <br />
                                    {formatDate(contrato.enddate)}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>

            {/* PAYMENT MODAL */}
            <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Registrar Pago Manual</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handlePaymentSubmit}>
                    <Modal.Body>
                        {paymentError && <div className="alert alert-danger">{paymentError}</div>}

                        <Form.Group className="mb-3">
                            <Form.Label>Monto a pagar</Form.Label>
                            <div className="input-group">
                                <span className="input-group-text">$</span>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    required
                                    value={paymentAmount}
                                    onChange={(e: any) => setPaymentAmount(e.target.value)}
                                />
                            </div>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="dark" type="submit" disabled={paymentLoading}>
                            {paymentLoading ? <Spinner size="sm" animation="border" /> : "Guardar Pago"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}