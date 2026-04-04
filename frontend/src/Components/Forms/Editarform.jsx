
import { REACT_APP_API_URL } from '../../config'

import React, { useEffect, useState } from "react";

export default function EditApartmentModal({ apartment, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    name: "",
    postal_code: "",
    street: "",
    division: "",
    int_num: "",
    ext_num: "",
    city: "",
    state: ""
  });

  useEffect(() => {
    if (apartment) {
      setFormData({
        name: apartment.name || "",
        postal_code: apartment.postal_code || "",
        street: apartment.street || "",
        division: apartment.division || "",
        int_num: apartment.int_num || "",
        ext_num: apartment.ext_num || "",
        city: apartment.city || "",
        state: apartment.state || ""
      });
    }
  }, [apartment]);

  if (!apartment) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${REACT_APP_API_URL}/apartments/${apartment.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(formData)
        }
      );

      if (!res.ok) throw new Error("Update failed");

      const updated = await res.json();
      onUpdated(updated);

    } catch (err) {
      console.error(err);
      alert("Error updating apartment");
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal d-block">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content rounded-4 shadow border-0">

            <div className="modal-header">
              <h5 className="fw-bold">Editar Vivienda</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>

                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Calle</label>
                  <input
                    type="text"
                    className="form-control"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Núm Ext</label>
                    <input
                      type="text"
                      className="form-control"
                      name="ext_num"
                      value={formData.ext_num}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Núm Int (Opcional)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="int_num"
                      value={formData.int_num}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Colonia</label>
                    <input
                      type="text"
                      className="form-control"
                      name="division"
                      value={formData.division}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">C.P.</label>
                    <input
                      type="text"
                      className="form-control"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Ciudad</label>
                    <input
                      type="text"
                      className="form-control"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Estado</label>
                    <input
                      type="text"
                      className="form-control"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end">
                  <button className="btn btn-dark">
                    Guardar cambios
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}