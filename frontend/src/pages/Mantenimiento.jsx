import React, { useContext } from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaTruck, FaHome, FaWrench, FaTools } from 'react-icons/fa';
import '../styles/mantenimiento.css'; 

const Mantenimiento = () => {
  const { currentEntity } = useContext(AuthContext);

  return (
    <Container>
      <div className="page-content">
        <div className="button-obras-container">
          {currentEntity && currentEntity.type === 'usuario' && (
            <Link to="/cuadrillas" className="obras-button">
              <FaTruck />
              Cuadrillas
            </Link>
          )}
          {currentEntity && currentEntity.type === 'usuario' && (
            <Link to="/sucursales" className="obras-button">
              <FaHome />
              Sucursales
            </Link>
          )}
          {currentEntity && (
            <Link to="/mantenimientos-correctivos" className="obras-button">
              <FaWrench />
              Mantenimiento Correctivo
            </Link>
          )}
          {currentEntity && (
            <Link to="/mantenimientos-preventivos" className="obras-button">
              <FaTools />
              Mantenimiento Preventivo
            </Link>
          )}
        </div>
      </div>
    </Container>
  );
};

export default Mantenimiento;