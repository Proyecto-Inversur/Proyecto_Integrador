import React from 'react';

const Line = ({ label, value }) => (
  <div className="inv-line">
    <span className="inv-label">{label}</span>
    <span className="inv-value">{value ?? '—'}</span>
  </div>
);

const SucursalPopup = ({ sucursal }) => (
  <div className="inv-card">
    <div className="inv-header">
      <div className="inv-title">{sucursal.name}</div>
      <span className="inv-badge">Sucursal</span>
    </div>

    <div className="inv-section">
      <div className="inv-subtitle">Correctivos</div>
      {sucursal.Correctivos?.length ? sucursal.Correctivos.map(c => (
        <div key={c.id} className="inv-box">
          <Line label="Mantenimiento" value={c.id} />
          <Line label="Cuadrilla" value={c.cuadrilla_name} />
          <Line label="Fecha" value={c.fecha_apertura} />
          <Line label="N° Caso" value={c.numero_caso} />
          <Line label="Estado" value={c.estado} />
        </div>
      )) : <div className="inv-empty">Sin datos</div>}
    </div>

    <div className="inv-section">
      <div className="inv-subtitle mt-8">Preventivos</div>
      {sucursal.Preventivos?.length ? sucursal.Preventivos.map(p => (
        <div key={p.id} className="inv-box">
          <Line label="Mantenimiento" value={p.id} />
          <Line label="Cuadrilla" value={p.cuadrilla_name} />
          <Line label="Fecha" value={p.fecha_apertura} />
          <Line label="Frecuencia" value={p.frecuencia} />
        </div>
      )) : <div className="inv-empty">Sin datos</div>}
    </div>
  </div>
);

export default SucursalPopup;