import React from 'react';

const Line = ({ label, value }) => (
  <div className="inv-line">
    <span className="inv-label">{label}</span>
    <span className="inv-value">{value ?? '—'}</span>
  </div>
);

const List = ({ items }) => {
  if (!items?.length) return <div className="inv-empty">Sin datos</div>;
  return (
    <ul className="inv-list">
      {items.map((li, idx) => (
        <li key={idx}>{li}</li>
      ))}
    </ul>
  );
};

const CuadrillaPopup = ({ cuadrilla }) => (
  <div className="inv-card">
    <div className="inv-header">
      <div className="inv-title">Cuadrilla {cuadrilla.name}</div>
      <span className="inv-badge">Ruta</span>
    </div>

    <div className="inv-section">
      <div className="inv-section-title">Sucursales</div>
      <List items={cuadrilla.sucursales?.map(s => s.name)} />
    </div>

    <div className="inv-section">
      <div className="inv-section-title">Mantenimientos</div>

      <div className="inv-subtitle">Correctivos seleccionados</div>
      {cuadrilla.correctivos?.length ? cuadrilla.correctivos.map(c => (
        <div key={c.id} className="inv-box">
          <Line label="Mantenimiento" value={c.id} />
          <Line label="Sucursal" value={c.nombre_sucursal} />
          <Line label="Fecha" value={c.fecha_apertura} />
          <Line label="N° Caso" value={c.numero_caso} />
          <Line label="Estado" value={c.estado} />
        </div>
      )) : <div className="inv-empty">Sin datos</div>}

      <div className="inv-subtitle mt-8">Preventivos seleccionados</div>
      {cuadrilla.preventivos?.length ? cuadrilla.preventivos.map(p => (
        <div key={p.id} className="inv-box">
          <Line label="Mantenimiento" value={p.id} />
          <Line label="Sucursal" value={p.nombre_sucursal} />
          <Line label="Fecha" value={p.fecha_apertura} />
          <Line label="Frecuencia" value={p.frecuencia} />
        </div>
      )) : <div className="inv-empty">Sin datos</div>}
    </div>
  </div>
);

export default CuadrillaPopup;