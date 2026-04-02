import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import "./index.css";
import Dashboard from './views/Dashboard';
import Viviendas from './views/Viviendas';
import Incidencias from './views/Incidencias';
import Contratos from './views/Contratos'
import Home from './views/Home';
import Reportes from './views/Reportes';
import HomeIncidencias from './views/HomeIncidencias';
import App from './App.tsx';
import ContractDetails from './views/DetallesContrato';

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/viviendas", element: <Viviendas /> },
  { path: "/incidencias", element: <Incidencias /> },
  { path: "/contratos", element: <Contratos /> },
  { path: "/home", element: <Home /> },
  { path: "/home/incidencias", element: <HomeIncidencias /> },
  { path: "/reportes", element: <Reportes /> },
  { path: "/contratos/:id", element: <ContractDetails /> },
  { path: "/viviendas/:id/detalles", element: <ContractDetails /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
