import React, { useEffect, useState } from 'react';
import { api } from '../../api';

const CobrosMoraSettings = () => {
  const defaultSettings = { tipo: 'PORCENTAJE', valor: 10 };
  const [mora, setMora] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('moraSettings')) || defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getCandidateUrls = () => {
    const primary = api('/mora-settings');
    const local = 'http://localhost:5000/api/mora-settings';
    return primary === local ? [primary] : [primary, local];
  };

  const requestMoraEndpoint = async (options = {}) => {
    const urls = getCandidateUrls();
    const errors = [];

    for (const url of urls) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;
        const detail = await response.text();
        errors.push(`${url} -> ${response.status} ${detail || ''}`.trim());
      } catch (error) {
        errors.push(`${url} -> ${error.message}`);
      }
    }

    throw new Error(errors.join(' | '));
  };

  useEffect(() => {
    const loadMoraSettings = async () => {
      try {
        const response = await requestMoraEndpoint();
        const data = await response.json();

        const loaded = {
          tipo: data?.tipo || defaultSettings.tipo,
          valor: Number(data?.valor ?? defaultSettings.valor),
        };
        setMora(loaded);
        localStorage.setItem('moraSettings', JSON.stringify(loaded));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadMoraSettings();
  }, []);

  const handleSave = async () => {
      try {
        setSaving(true);
        const payload = { tipo: mora.tipo, valor: Number(mora.valor) || 0 };
        await requestMoraEndpoint({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        localStorage.setItem('moraSettings', JSON.stringify(payload));
        alert('Configuración de mora guardada');
      } catch (error) {
        console.error(error);
        alert(`Error al guardar la configuración de mora.\n${error.message}`);
      } finally {
        setSaving(false);
      }
  };

  if (loading) return <div>Cargando configuración de mora...</div>;

  return (
    <div>
      <h4>Cobros y Mora</h4>

      <div className="row">
        <div className="col-md-6">
          <label>Tipo</label>
          <select
            className="form-select"
            value={mora.tipo}
            onChange={(e) => setMora({ ...mora, tipo: e.target.value })}
          >
            <option value="PORCENTAJE">Porcentaje (%)</option>
            <option value="FIJO">Monto Fijo ($)</option>
          </select>
        </div>

        <div className="col-md-6">
          <label>Valor</label>
          <input
            type="number"
            className="form-control"
            value={mora.valor}
            onChange={(e) => setMora({ ...mora, valor: Number(e.target.value) || 0 })}
          />
        </div>
      </div>

      <button className="btn btn-primary mt-3" onClick={handleSave} disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
};

export default CobrosMoraSettings;
