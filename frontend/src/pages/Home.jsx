import React from 'react';
import { FaUsers, FaClipboardList, FaMapMarkerAlt, FaFileAlt } from 'react-icons/fa';
import HomeButton from '../components/HomeButton';
import '../styles/home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="page-content">
        <div className="button-home-container">
          <HomeButton to="/users" icon={FaUsers} requiredRoles="admin">
            Usuarios
          </HomeButton>
          <HomeButton to="/mantenimiento" icon={FaClipboardList} requiredRoles={["user", "cuadrilla"]}>
            Mantenimiento
          </HomeButton>
          <HomeButton to="/mapa" icon={FaMapMarkerAlt} requiredRoles="user">
            Mapa
          </HomeButton>
          <HomeButton to="/ruta" icon={FaMapMarkerAlt} requiredRoles="cuadrilla">
            Mapa
          </HomeButton>
          <HomeButton to="/reportes" icon={FaFileAlt} requiredRoles="admin">
            Reportes
          </HomeButton>
        </div>
      </div>
    </div>
  );
};

export default Home;