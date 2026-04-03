import React from 'react';

const ArrendadorSettings = () => {
  return (
    <div className="config-section">
      <h3>Arrendador</h3>

      <form className="form-grid">

        <div>
          <label>Nombre</label>
          <input
            type="text"
            placeholder="Ej. Ana"
          />
        </div>

        <div>
          <label>Apellido</label>
          <input
            type="text"
            placeholder="Ej. Martínez"
          />
        </div>

        <div>
          <label>Número de Teléfono</label>
          <input
            type="text"
            placeholder="Ej. 123-562-4526"
          />
        </div>

        <div>
          <label>Correo Electrónico</label>
          <input
            type="email"
            placeholder="Ej. correo@dominio.com"
          />
        </div>

        <div className="full">
          <label>Domicilio</label>
          <input
            type="text"
            placeholder="Ejem. Calle, fracc, num 123"
          />
        </div>

        <div className="form-actions">
          <button type="submit">Guardar cambios</button>
        </div>

      </form>
    </div>
  );
};

export default ArrendadorSettings;
