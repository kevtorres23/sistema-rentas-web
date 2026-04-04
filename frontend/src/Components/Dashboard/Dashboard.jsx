import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Label
} from 'recharts';
import {
  TrendingUp, Home, FileText, CreditCard, Search, Calendar
} from 'lucide-react';
import './Dashboard.css';

import { api } from '../../api';

// --- defaults will be initialized in state ---


// --- 2. THEME COLORS ---
const THEME = {
  bgApp: '#FFFFFF',          
  bgCard: '#F4F7FE',         
  textDark: '#1B2559',       
  textLight: '#A3AED0',      
  purpleDark: '#4318FF',     
  purpleLight: '#6AD2FF',
  linePink: '#FFB5E8'
};

const MONTH_OPTIONS = [
  { value: 'todos', label: 'Todos los meses' },
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
];

const Dashboard = () => {
  const [moraSettings, setMoraSettings] = useState({ tipo: 'PORCENTAJE', valor: 10 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('todos');
  const [chargeView, setChargeView] = useState('pendiente');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    gananciaMensual: 0,
    viviendasOcupadas: 0,
    viviendasTotal: 0,
    facturasVencidas: 0,
    facturasTotal: 0,
    cobroPendiente: 0,
    cobroVencido: 0,
    dataIngresos: [],
    dataIncidencias: [],
    dataBaseInquilinos: []
  });

  const incidenciasVisibles = useMemo(
    () => dashboardData.dataIncidencias.filter((item) => item.name !== 'Por resolver'),
    [dashboardData.dataIncidencias]
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (selectedMonth !== 'todos') {
        params.set('month', selectedMonth);
        params.set('year', String(new Date().getFullYear()));
      }

      const response = await fetch(api(`/dashboard/admin${params.toString() ? `?${params.toString()}` : ''}`), {
        cache: "no-store",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'No se pudo cargar el dashboard');
      }

      setDashboardData(data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || 'No se pudo cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]);

  // Listen for configuration changes from the Navbar Modal
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('moraSettings'));
    if (saved) setMoraSettings(saved);
    
    const handleStorage = () => {
       const updated = JSON.parse(localStorage.getItem('moraSettings'));
       if(updated) setMoraSettings(updated);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // --- 3. LOGIC & FILTERING ---
  const datosProcesados = useMemo(() => {
    // 1. Calculate Mora (Late Fees)
    let procesados = dashboardData.dataBaseInquilinos.map(item => {
      let montoFinal = item.montoOriginal;
      let tieneMora = false;
      if (item.estatus === 'Vencido') {
        tieneMora = true;
        montoFinal = moraSettings.tipo === 'PORCENTAJE'
          ? item.montoOriginal + (item.montoOriginal * (moraSettings.valor / 100))
          : item.montoOriginal + moraSettings.valor;
      }
      return { ...item, montoFinal, tieneMora };
    });

    // 2. Apply Search Filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      procesados = procesados.filter(item => 
        item.inquilino.toLowerCase().includes(query) || 
        item.departamento.toLowerCase().includes(query) ||
        item.estatus.toLowerCase().includes(query)
      );
    }

    return procesados;
  }, [dashboardData.dataBaseInquilinos, moraSettings, searchQuery]);

  const formatCurrency = (val) => {
    const safeValue = Number.isFinite(Number(val)) ? Number(val) : 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(safeValue);
  };
  const chargeLabel = chargeView === 'vencido' ? 'Cobro Vencido' : 'Cobro Pendiente';
  const chargeAmount = chargeView === 'vencido'
    ? (dashboardData.cobroVencido ?? 0)
    : (dashboardData.cobroPendiente ?? 0);

  return (
    <div className="min-vh-100 d-flex flex-column font-sans" style={{ backgroundColor: THEME.bgApp }}>
      <div className="container-fluid px-4 py-4">
        
        {/* --- HEADER --- */}
        <div className="mb-4">
          <h1 className="fw-bold m-0" style={{ color: THEME.textDark, fontSize: '34px' }}>Dashboard</h1>
          <p className="m-0 mt-1 fs-6" style={{ color: '#707EAE' }}>
            Consulta estadísticas e información importante de las rentas.
          </p>
        </div>

        <div className="dashboard-global-month bg-white rounded-pill px-2 py-1 shadow-sm border border-light mb-4">
          <select
            className="form-select border-0 shadow-none bg-transparent"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ color: THEME.textDark, fontSize: '14px' }}
          >
            {MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="alert alert-light border rounded-4 mb-4">
            Cargando dashboard...
          </div>
        ) : null}

        {error ? (
          <div className="alert alert-danger rounded-4 mb-4">
            {error}
          </div>
        ) : null}

        {/* --- KPI CARDS --- */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="h-100 p-3 rounded-4 d-flex flex-column justify-content-center" style={{ backgroundColor: THEME.bgCard }}>
              <div className="d-flex align-items-center gap-2 mb-1">
                <TrendingUp size={18} style={{ color: THEME.textLight }} />
                <span className="fw-medium" style={{ color: THEME.textLight, fontSize: '14px' }}>Ganancia Mensual</span>
              </div>
              <div className="fw-bold" style={{ color: THEME.textDark, fontSize: '24px' }}>{formatCurrency(dashboardData.gananciaMensual)}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="h-100 p-3 rounded-4 d-flex flex-column justify-content-center" style={{ backgroundColor: THEME.bgCard }}>
              <div className="d-flex align-items-center gap-2 mb-1">
                <Home size={18} style={{ color: THEME.textLight }} />
                <span className="fw-medium" style={{ color: THEME.textLight, fontSize: '14px' }}>Viviendas Ocupadas</span>
              </div>
              <div className="fw-bold" style={{ color: THEME.textDark, fontSize: '24px' }}>
                {dashboardData.viviendasOcupadas} <span className="fs-6 fw-normal" style={{ color: '#05CD99' }}>/ {dashboardData.viviendasTotal}</span>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="h-100 p-3 rounded-4 d-flex flex-column justify-content-center" style={{ backgroundColor: THEME.bgCard }}>
              <div className="d-flex align-items-center gap-2 mb-1">
                <FileText size={18} style={{ color: THEME.textLight }} />
                <span className="fw-medium" style={{ color: THEME.textLight, fontSize: '14px' }}>Facturas Vencidas</span>
              </div>
              <div className="fw-bold" style={{ color: THEME.textDark, fontSize: '24px' }}>
                {dashboardData.facturasVencidas} <span className="fs-6 fw-normal" style={{ color: '#E31A1A' }}>/ {dashboardData.facturasTotal}</span>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="h-100 p-3 rounded-4 d-flex flex-column justify-content-center" style={{ backgroundColor: THEME.bgCard }}>
              <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <CreditCard size={18} style={{ color: THEME.textLight }} />
                  <span className="fw-medium" style={{ color: THEME.textLight, fontSize: '14px' }}>{chargeLabel}</span>
                </div>
                <div className="dashboard-charge-toggle">
                  <button
                    type="button"
                    className={chargeView === 'pendiente' ? 'is-active' : ''}
                    onClick={() => setChargeView('pendiente')}
                  >
                    P
                  </button>
                  <button
                    type="button"
                    className={chargeView === 'vencido' ? 'is-active' : ''}
                    onClick={() => setChargeView('vencido')}
                  >
                    V
                  </button>
                </div>
              </div>
              <div className="fw-bold" style={{ color: THEME.textDark, fontSize: '24px' }}>{formatCurrency(chargeAmount)}</div>
            </div>
          </div>
        </div>

        {/* --- CHARTS SECTION --- */}
        <div className="row g-3 mb-4">
          <div className="col-lg-8">
            <div className="p-4 rounded-4 h-100" style={{ backgroundColor: THEME.bgCard }}>
              <div className="mb-4">
                 <h5 className="fw-bold m-0" style={{ color: THEME.textDark }}>Ingreso Mensual</h5>
              </div>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={dashboardData.dataIngresos} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="#E0E5F2" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: THEME.textLight, fontSize: 12 }} dy={10} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="ingreso" stroke={THEME.purpleDark} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="gasto" stroke={THEME.purpleLight} strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="neto" stroke="#E1E9F8" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="p-4 rounded-4 h-100 d-flex flex-column" style={{ backgroundColor: THEME.bgCard }}>
              <div className="mb-2">
                 <h5 className="fw-bold m-0" style={{ color: THEME.textDark }}>Incidencias</h5>
              </div>
              <div className="flex-grow-1 position-relative d-flex align-items-center justify-content-center">
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={incidenciasVisibles} innerRadius={65} outerRadius={85} dataKey="value" stroke="none">
                                {incidenciasVisibles.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                                <Label value={incidenciasVisibles.reduce((acc, curr) => acc + curr.value, 0)} position="center" fill={THEME.textDark} style={{ fontSize: '32px', fontWeight: 'bold' }} />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
              <div className="d-flex justify-content-around mt-2 text-center">
                  {incidenciasVisibles.map((item, index) => (
                      <div key={index} className="d-flex flex-column align-items-center">
                          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color, marginBottom: 4 }}></div>
                          <span className="fw-bold" style={{ color: THEME.textDark, fontSize: '14px' }}>{item.value}</span>
                          <span className="text-muted" style={{ fontSize: '11px' }}>{item.name}</span>
                      </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- DATA TABLE SECTION --- */}
        <div className="card w-100 border-0 rounded-4 overflow-hidden" style={{ backgroundColor: THEME.bgCard }}>
            <div className="card-header bg-transparent p-4 border-bottom-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                    <h5 className="fw-bold m-0" style={{ color: THEME.textDark }}>Detalle de Contratos</h5>
                    <span style={{ color: THEME.textLight, fontSize: '14px' }}>Gestión y estado de pagos</span>
                </div>
                
                <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-2">
                    <div className="input-group w-auto bg-white rounded-pill px-3 py-2 shadow-sm border border-light">
                        <Search size={18} style={{ color: THEME.textLight }} className="align-self-center"/>
                        <input 
                            type="text" 
                            className="form-control border-0 shadow-none bg-transparent ms-2" 
                            placeholder="Buscar inquilino o depto..." 
                            style={{ width: '220px', fontSize: '14px', color: THEME.textDark }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            
            <div className="table-responsive px-2 pb-3">
                <table className="table w-100 table-borderless align-middle mb-0">
                    <thead style={{ borderBottom: '1px solid #E0E5F2' }}>
                        <tr>
                            <th className="ps-4 py-3 fw-medium text-uppercase" style={{ color: THEME.textLight, fontSize: '12px' }}>Depto</th>
                            <th className="py-3 fw-medium text-uppercase" style={{ color: THEME.textLight, fontSize: '12px' }}>Inquilino</th>
                            <th className="py-3 fw-medium text-uppercase" style={{ color: THEME.textLight, fontSize: '12px' }}>Monto Total</th>
                            <th className="py-3 fw-medium text-uppercase text-center" style={{ color: THEME.textLight, fontSize: '12px' }}>Estatus</th>
                            <th className="py-3 fw-medium text-uppercase" style={{ color: THEME.textLight, fontSize: '12px' }}>Contrato</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datosProcesados.length > 0 ? datosProcesados.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #E0E5F2' }}>
                                <td className="ps-4 py-3 fw-bold" style={{ color: THEME.textDark }}>{item.departamento}</td>
                                <td className="py-3 fw-medium" style={{ color: THEME.textDark }}>{item.inquilino}</td>
                                <td className="py-3">
                                    <span className="fw-bold" style={{ color: THEME.textDark }}>{formatCurrency(item.montoFinal)}</span>
                                    {item.tieneMora && (
                                        <span className="ms-2 badge bg-danger text-white rounded-pill shadow-sm" style={{ fontSize: '10px', padding: '4px 8px' }}>
                                            + MORA
                                        </span>
                                    )}
                                </td>
                                <td className="py-3 text-center">
                                    <span className={`badge rounded-pill px-3 py-2 fw-bold ${
                                        item.estatus === 'Pagado' ? 'bg-success bg-opacity-10 text-success' :
                                        item.estatus === 'Vencido' ? 'bg-danger bg-opacity-10 text-danger' :
                                        'bg-warning bg-opacity-10 text-warning'
                                    }`}>
                                        {item.estatus}
                                    </span>
                                </td>
                                <td className="py-3 text-muted small fw-medium">
                                    <div className="d-flex align-items-center gap-2" style={{ color: THEME.textLight }}>
                                        <Calendar size={14}/> {item.mesesRestantes} meses rest.
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-center py-5" style={{ color: THEME.textLight }}>
                                    No se encontraron resultados para "{searchQuery}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      {/* 👉 ¡Aquí están los divs que se habían borrado! */}
      </div>
    </div>
  );
};

export default Dashboard;
