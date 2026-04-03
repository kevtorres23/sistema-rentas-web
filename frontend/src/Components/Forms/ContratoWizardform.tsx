import React, { useState } from "react";
import ArrendatarioForm from "./ArrendatarioForm";
import AvalForm from "./AvalForm";
import ContratoForm from "./Contratoform";

import { REACT_APP_API_URL } from '../../config/api-url'

import "./ContratoWizardForm.css"

async function readResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function createContract(data) {
  try {
    const formData = new FormData();
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        if (key === 'tenant' || key === 'guarantor') {
          formData.append(key, JSON.stringify(data[key]));
        } else if (key === 'file') {
          formData.append(key, data[key]);
        } else {
          formData.append(key, data[key]);
        }
      }
    }

    const response = await fetch(`${REACT_APP_API_URL}/rentalcontracts`, {
      method: "POST",
      body: formData,
    });

    const result = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        result?.error ||
        result?.message ||
        (result?.raw?.startsWith("<!DOCTYPE") ? "La API devolvio HTML y no JSON." : null) ||
        "Error creating contract"
      );
    }

    return result;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Failed to fetch. Verifica la API en ${REACT_APP_API_URL}/rentalcontracts`
      );
    }

    throw error;
  }
}



export default function ContractWizardModal({ show, onClose, selectedApartmentId }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    tenant: {
      name: "",
      phone: "",
      email: "",
      address: ""
    },
    guarantor: {
      name: "",
      phone: "",
      email: "",
      address: ""
    },
    contract: {
      price: "",
      startDate: "",
      monthlyAmount: "",
      file: null
    }
  });


  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        apartmentid: selectedApartmentId, // you must have this
        tenant: formData.tenant,
        guarantor: formData.guarantor,
        startdate: formData.contract.startdate,
        enddate: formData.contract.enddate,
        monthlyAmount: formData.contract.monthlyAmount,
        depositamount: formData.contract.price,
        status: "ACTIVE",
        file: formData.contract.file
      };

      const result = await createContract(payload);
      console.log("Contract created:", result);

      // Close modal
      onClose();

    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  const updateTenant = (field, value) => {
    setFormData(prev => ({
      ...prev,
      tenant: {
        ...prev.tenant,
        [field]: value
      }
    }));
  };

  const updateGuarantor = (field, value) => {
    setFormData(prev => ({
      ...prev,
      guarantor: {
        ...prev.guarantor,
        [field]: value
      }
    }));
  };

  const updateContract = (field, value) => {
    setFormData(prev => ({
      ...prev,
      contract: {
        ...prev.contract,
        [field]: value
      }
    }));
  };



  const renderStep = () => {
    switch (step) {
      case 1:
        return <ArrendatarioForm
          data={formData.tenant}
          update={updateTenant}
        />;
      case 2:
        return <AvalForm
          data={formData.guarantor}
          update={updateGuarantor}
        />;
      case 3:
        return <ContratoForm
          data={formData.contract}
          update={updateContract}
        />;
      default:
        return null;
    }
  };


  return (
    <>
      <div className="modal-backdrop fade show"></div>

      <div className="modal d-block">
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content border-0 shadow rounded-4">

            <div className="modal-header">
              <h5 className="fw-bold">Datos del Contrato</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body p-0">
              <div className="row g-0">

                {/* SIDEBAR */}
                <div className="col-3 border-end bg-light p-3">

                  <button
                    className={`sidebar-item ${step === 1 ? "active" : ""}`}
                    onClick={() => setStep(1)}
                  >
                    Datos del Arrendatario
                  </button>

                  <button
                    className={`sidebar-item ${step === 2 ? "active" : ""}`}
                    onClick={() => setStep(2)}
                  >
                    Datos del Aval
                  </button>

                  <button
                    className={`sidebar-item ${step === 3 ? "active" : ""}`}
                    onClick={() => setStep(3)}
                  >
                    Datos del Contrato
                  </button>

                </div>

                {/* CONTENT */}
                <div className="col-9 p-4">
                  {renderStep()}

                  <div className="d-flex justify-content-between mt-4">

                    {step > 1 && (
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => setStep(step - 1)}
                      >
                        Atrás
                      </button>
                    )}

                    {step < 3 && (
                      <button
                        className="btn btn-dark"
                        onClick={() => setStep(step + 1)}
                      >
                        Siguiente
                      </button>
                    )}

                    {step === 3 && (
                      <button
                        className="btn btn-success"
                        onClick={handleSubmit}
                      >
                        {loading ? "Guardando..." : "Guardar contrato"}
                      </button>

                    )}

                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
