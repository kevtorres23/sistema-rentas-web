import React from 'react';

const PagSettings = () => {
  return (
    <div className="config-section">
      <h3>Información Bancaria</h3>

      <form className="form-grid">

        {/* Número de tarjeta */}
        <div>
          <label>Número de Tarjeta</label>
          <input
            type="text"
            placeholder="XXXX-XXXX-XXXX-1536"
          />
        </div>

        {/* Propietario */}
        <div>
          <label>Propietario de la Tarjeta</label>
          <input
            type="text"
            placeholder="Jose Jose"
          />
        </div>

        {/* Domicilio */}
        <div className="full">
          <label>Domicilio</label>
          <input
            type="text"
            placeholder="Ejem. Calle, fracc, num 123"
          />
        </div>

        {/* Botón */}
        <div className="form-actions">
          <button type="submit">Guardar cambios</button>
        </div>

      </form>
    </div>
  );
};

export default PagSettings;
