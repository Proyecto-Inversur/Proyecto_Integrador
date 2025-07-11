import React, { useEffect, useContext } from 'react';
import { Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import { FaTruck, FaHome, FaWrench, FaTools } from 'react-icons/fa';
import '../styles/mantenimiento.css'; 

const Mantenimiento = () => {
  const { currentEntity } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentEntity) {
      navigate('/login');
    }
  }, [currentEntity, navigate]);

  return (
    <Container className="home-container">
    <div className="back-button-wrapper">
      <BackButton to="/" />
    </div>
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