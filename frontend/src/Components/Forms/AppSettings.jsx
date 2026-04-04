import React from 'react';

const AppSettings = () => {
  return (
    <div className="config-section">
      <h3>Configuración de la App</h3>

      <form className="form-grid">
        <input type="text" placeholder="Nombre de la aplicación" />
        <div className="form-actions">
          <button type="submit">Guardar cambios</button>
        </div>
      </form>
    </div>
  );
};

export default AppSettings;
