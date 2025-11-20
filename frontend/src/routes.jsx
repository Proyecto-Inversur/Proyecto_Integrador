import React from 'react';
import Home from './pages/Home';
import Users from './pages/Users';
import Clientes from './pages/Clientes';
import Cuadrillas from './pages/Cuadrillas';
import Mantenimiento from './pages/Mantenimiento';
import MantenimientoPreventivo from './pages/MantenimientosPreventivos';
import MantenimientoCorrectivo from './pages/MantenimientosCorrectivos';
import Preventivo from './pages/Preventivo';
import Correctivo from './pages/Correctivo';
import Mapa from './pages/Mapa';
import Ruta from './pages/Ruta';
import Estadisticas from './pages/Estadisticas';

const routes = [
  { path: '/', element: <Home />, hideBackButton: true },
  { path: '/mantenimiento', element: <Mantenimiento />, hideBackButton: true },
  { path: '/users', element: <Users />, adminOnly: true },
  { path: '/clientes', element: <Clientes />, usersOnly: true },
  { path: '/cuadrillas', element: <Cuadrillas />, usersOnly: true },
  { path: '/mantenimientos-preventivos', element: <MantenimientoPreventivo />, hideBackButton: true },
  { path: '/mantenimientos-correctivos', element: <MantenimientoCorrectivo />, hideBackButton: true },
  { path: '/preventivo', element: <Preventivo />, hideBackButton: true },
  { path: '/correctivo', element: <Correctivo />, hideBackButton: true },
  { path: '/mapa', element: <Mapa />, usersOnly: true, hideBackButton: true },
  { path: '/ruta', element: <Ruta />, hideBackButton: true },
  { path: '/estadisticas', element: <Estadisticas />, adminOnly: true },
];

export default routes;
