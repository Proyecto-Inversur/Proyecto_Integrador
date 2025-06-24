import React, { useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { FaUsers, FaClipboardList, FaMapMarkerAlt, FaFileAlt } from 'react-icons/fa';
import '../styles/home.css';

const Home = () => {
  const { currentEntity } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentEntity) {
      navigate('/login');
    }
  }, [currentEntity]);

  return (
    <Container className="home-container">
      <div className="page-content"> {/* Nuevo contenedor */}
        <div className="button-home-container">
          {currentEntity && currentEntity.type === 'usuario' && currentEntity.data.rol === 'Administrador' && (
            <>
              <Link to="/users" className="home-button">
                <FaUsers />
                Usuarios
              </Link>
            </>
          )}
          {currentEntity && (
            <>
              <Link to="/mantenimiento" className="home-button">
                <FaClipboardList />
                Mantenimiento
              </Link>
            </>
          )}
          {currentEntity && (
            <>
              <Link to="/mapa" className="home-button">
                <FaMapMarkerAlt />
                Mapa
              </Link>
            </>
          )}
          {currentEntity && currentEntity.type === 'usuario' && currentEntity.data.rol === 'Administrador' && (
            <>
              <Link /*to="/reportes"*/ className="home-button">
                <FaFileAlt />
                Reportes
              </Link>
            </>
          )}
        </div>
      </div>
    </Container>
  );
};

export default Home;