import React, { useEffect, useState } from "react";
import { REACT_APP_API_URL } from '../../config/api-url';

export default function EditarContratoModal({ contractId, onClose, onUpdated }) {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contractId) {
      setLoading(true);
      fetch(`${REACT_APP_API_URL}/rentalcontracts/${contractId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      .then(res => res.json())
      .then(data => {
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.toISOString().split('T')[0];
        };
        setFormData({
          ...data,
          startdate: formatDate(data.startdate),
          enddate: formatDate(data.enddate),
          depositamount: data.depositamount || 0,
          status: data.status || 'ACTIVE'
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [contractId]);

  if (!contractId) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
          ...formData,
          depositamount: parseFloat(formData.depositamount)
      };

      const res = await fetch(
        `${REACT_APP_API_URL}/rentalcontracts/${contractId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(payload)
        }
      );

      if (!res.ok) throw new Error("Update failed");

      const updated = await res.json();
      onUpdated(updated);
    } catch (err) {
      console.error(err);
      alert("Error updating contract");
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal d-block">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content rounded-4 shadow border-0">

            <div className="modal-header">
              <h5 className="fw-bold">Editar Contrato</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body">
              {loading ? (
                <div className="text-center py-4">Cargando datos...</div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Fecha de inicio</label>
                      <input
                        type="date"
                        className="form-control"
                        name="startdate"
                        value={formData.startdate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Fecha de fin</label>
                      <input
                        type="date"
                        className="form-control"
                        name="enddate"
                        value={formData.enddate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Monto de Depósito</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="depositamount"
                        value={formData.depositamount}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                        <option value="CANCELLED">Cancelado</option>
                        <option value="FINISHED">Finalizado</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-4">
                    <button type="button" className="btn btn-secondary me-2" onClick={onClose}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-dark">
                      Guardar cambios
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
