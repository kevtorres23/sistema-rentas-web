import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import "./index.css";
import Dashboard from './views/Dashboard.tsx';
import Viviendas from './views/Viviendas.tsx';
import Incidencias from './views/Incidencias.tsx';
import Contratos from './views/Contratos.tsx'
import Home from './views/Home.tsx';
import Reportes from './views/Reportes.tsx';
import HomeIncidencias from './views/HomeIncidencias.tsx';
import App from './App.tsx';
import ContractDetails from './views/DetallesContrato.tsx';

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
