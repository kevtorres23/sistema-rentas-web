import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const ensureMoraSettingsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS morasettings (
      id INT PRIMARY KEY DEFAULT 1,
      tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PORCENTAJE', 'FIJO')),
      valor NUMERIC(10,2) NOT NULL DEFAULT 0,
      updatedat TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
};

router.get('/mora-settings', async (req, res) => {
  try {
    await ensureMoraSettingsTable();
    const result = await pool.query(
      'SELECT tipo, valor FROM morasettings WHERE id = 1'
    );

    if (result.rows.length === 0) {
      const defaultSettings = { tipo: 'PORCENTAJE', valor: 10 };
      await pool.query(
        'INSERT INTO morasettings (id, tipo, valor) VALUES (1, $1, $2)',
        [defaultSettings.tipo, defaultSettings.valor]
      );
      return res.json(defaultSettings);
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error obteniendo configuración de mora' });
  }
});

router.put('/mora-settings', async (req, res) => {
  try {
    const { tipo, valor } = req.body;
    const tipoNormalizado = tipo === 'FIJO' ? 'FIJO' : 'PORCENTAJE';
    const valorNormalizado = Number(valor) || 0;

    await ensureMoraSettingsTable();
    const result = await pool.query(
      `
        INSERT INTO morasettings (id, tipo, valor, updatedat)
        VALUES (1, $1, $2, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          tipo = EXCLUDED.tipo,
          valor = EXCLUDED.valor,
          updatedat = NOW()
        RETURNING tipo, valor
      `,
      [tipoNormalizado, valorNormalizado]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error guardando configuración de mora' });
  }
});

export default router;
