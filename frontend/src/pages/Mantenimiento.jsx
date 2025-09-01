import React from 'react';
import { Container } from 'react-bootstrap';
import { FaTruck, FaHome, FaWrench, FaTools } from 'react-icons/fa';
import HomeButton from '../components/HomeButton';
import BackButton from '../components/BackButton';
import '../styles/mantenimiento.css'; 

const Mantenimiento = () => {
  return (
    <Container>
      <div className="page-content">
        <BackButton to="/" />
        <div className="button-obras-container">
          <HomeButton to="/cuadrillas" icon={FaTruck} requiredRoles="user">
            Cuadrillas
          </HomeButton>
          <HomeButton to="/sucursales" icon={FaHome} requiredRoles="user">
            Sucursales
          </HomeButton>
          <HomeButton to="/mantenimientos-correctivos" icon={FaWrench}>
            Mantenimiento Correctivo
          </HomeButton>
          <HomeButton to="/mantenimientos-preventivos" icon={FaTools}>
            Mantenimiento Preventivo
          </HomeButton>
        </div>
      </div>
    </Container>
  );
};

export default Mantenimiento;