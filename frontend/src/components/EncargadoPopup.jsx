import React from 'react';

const EncargadoPopup = ({ encargado }) => (
  <div className="inv-card">
    <div className="inv-header">
      <div className="inv-title">{encargado.name}</div>
      <span className="inv-badge">Encargado</span>
    </div>
  </div>
);

export default EncargadoPopup;