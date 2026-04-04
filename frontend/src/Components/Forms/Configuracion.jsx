import React, { useState } from 'react';
import { useNavigate } from "react-router-dom"
import './Configuracion.css';
import AppSettings from './AppSettings';
import PagSettings from './PagSettings';
import ArrendadorSettings from './ArrendadorSettings';
import CobrosMora from './CobrosMora';
import PasarelasSettings from './PasarelasSettings';

const Configuracion = () => {
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState('app');

  return (
    <div className="modal-overlay">
      <div className="modal-content config-modal">

        <button className="modal-close" onClick={() => navigate("/viviendas")}>✕</button>

        <h2 className="config-title">Configuración</h2>

        <div className="config-body">

          <div className="config-menu">
            <button
              className={seccion === 'app' ? 'active' : ''}
              onClick={() => setSeccion('app')}
            >
              Configuración de la App
            </button>

            <button
              className={seccion === 'pago' ? 'active' : ''}
              onClick={() => setSeccion('pago')}
            >
              Información de Pago
            </button>

            <button
              className={seccion === 'arrendador' ? 'active' : ''}
              onClick={() => setSeccion('arrendador')}
            >
              Datos del Arrendador
            </button>

            <button
              className={seccion === 'cobros' ? 'active' : ''}
              onClick={() => setSeccion('cobros')}
            >
              Cobros y Mora
            </button>

            <button
              className={seccion === 'pasarelas' ? 'active' : ''}
              onClick={() => setSeccion('pasarelas')}
            >
              Pasarelas de Pago
            </button>

          </div>

          <div className="config-content">
            {seccion === 'app' && <AppSettings />}
            {seccion === 'pago' && <PagSettings />}
            {seccion === 'arrendador' && <ArrendadorSettings />}
            {seccion === 'cobros' && <CobrosMora />}
            {seccion === 'pasarelas' && <PasarelasSettings />}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Configuracion;
