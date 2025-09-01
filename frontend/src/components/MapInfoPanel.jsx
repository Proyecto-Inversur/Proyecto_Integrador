import React from 'react';

const MapInfoPanel = ({
  cuadrillas = [],
  encargados = [],
  sucursales = [],
  onSelectCuadrilla = () => {},
  onSelectEncargado = () => {},
  onSelectSucursal = () => {},
  showCuadrillas = true,
  showEncargados = true,
  showSucursales = true,
}) => (
  <>
    {showCuadrillas && (
      <>
        <h4>Cuadrillas</h4>
        {cuadrillas.length === 0 && <p>No hay cuadrillas activas.</p>}
        {cuadrillas.map(cuadrilla => (
          <div
            key={cuadrilla.id}
            className="obra-item"
            onClick={() => onSelectCuadrilla(cuadrilla)}
          >
            <strong>- {cuadrilla.name}</strong>
            <br />
            <small>{cuadrilla.correctivos?.length + cuadrilla.preventivos?.length || 0} obras asignadas</small>
          </div>
        ))}
      </>
    )}
    {showEncargados && (
      <>
        <h4>Encargados</h4>
        {encargados.length === 0 && <p>No hay encargados.</p>}
        {encargados.map(user => (
          <div
            key={user.id}
            className="obra-item"
            onClick={() => onSelectEncargado(user)}
          >
            <strong>- {user.name}</strong>
            <br />
          </div>
        ))}
      </>
    )}
    {showSucursales && (
      <>
        <h4>Sucursales</h4>
        {sucursales.length === 0 && <p>No hay sucursales activas.</p>}
        {sucursales.map(sucursal => (
          <div
            key={sucursal.id}
            className="obra-item"
            onClick={() => onSelectSucursal(sucursal)}
          >
            <strong>- {sucursal.name}</strong>
            <br />
            <small>{sucursal.Correctivos?.length || 0} correctivos, {sucursal.Preventivos?.length || 0} preventivos</small>
          </div>
        ))}
      </>
    )}
  </>
);

export default MapInfoPanel;