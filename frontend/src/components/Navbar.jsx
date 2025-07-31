import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Image, Modal, Button } from 'react-bootstrap';
import logoInversur from '../assets/logo_inversur.png';
import { FaRegBell, FaUser } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { get_notificaciones_correctivos, get_notificaciones_preventivos, correctivo_leido, preventivo_leido, delete_notificaciones } from '../services/notificaciones';
import '../styles/navbar.css';

const Navbar = () => {
  const { currentEntity, logOut } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState('');

  const handleShowNotifications = () => setShowNotifications(true);
  const handleCloseNotifications = () => setShowNotifications(false);

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      navigate('/login', { state: { error: 'Error al cerrar sesión.' } });
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      await delete_notificaciones(currentEntity.data.uid);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error al eliminar notificaciones:', error);
    }
  };

  const timeAgo = (timestamp) => {
    const now = new Date();
    const nowWithOffset = new Date(now.getTime() + 3 * 60 * 60 * 1000); // suma 3 horas
    const past = new Date(timestamp);
    const diff = Math.floor((nowWithOffset - past) / 1000); // en segundos

    if (diff < 60) return `hace ${diff} seg`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    // Construir string sólo con unidades > 0
    let result = 'hace ';
    if (days > 0) result += `${days} d `;
    if (hours > 0) result += `${hours} h `;
    if (minutes > 0) result += `${minutes} min `;
    if (seconds > 0) result += `${seconds} seg`;

    return result.trim();
  };

  const fetchNotifications = async () => {
    try {
      const [correctivosResp, preventivosResp] = await Promise.all([
        get_notificaciones_correctivos(currentEntity.data.uid),
        get_notificaciones_preventivos(currentEntity.data.uid)
      ]);

      const correctivos = Array.isArray(correctivosResp.data) ? correctivosResp.data : [];
      const preventivos = Array.isArray(preventivosResp.data) ? preventivosResp.data : [];

      const mappedCorrectivos = correctivos.map((notif) => ({
        ...notif,
        tipo: 'correctivo'
      }));

      const mappedPreventivos = preventivos.map((notif) => ({
        ...notif,
        tipo: 'preventivo'
      }));

      const allNotificaciones = [...mappedCorrectivos, ...mappedPreventivos];
      setUnreadCount(allNotificaciones.filter(n => !n.leida).length);

      // Ordenar por fecha descendente
      allNotificaciones.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setNotifications(allNotificaciones);
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
    }
  };

  useEffect(() => {
    if (currentEntity) {
      fetchNotifications();
    }

  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentEntity) {
        fetchNotifications();
      }
    }, 60000);
  
    return () => clearInterval(interval);
  }, [currentEntity]);

  const handleClick = async (notification) => {
    if (notification.tipo === 'correctivo') {
      const mantenimientoId = notification.id_mantenimiento
      handleCloseNotifications();
      navigate('/correctivo', { state: { mantenimientoId } });
      await correctivo_leido(notification.id);
      await fetchNotifications();
    } else if (notification.tipo === 'preventivo') {
      const mantenimientoId = notification.id_mantenimiento
      handleCloseNotifications();
      navigate('/preventivo', { state: { mantenimientoId } });
      await preventivo_leido(notification.id);
      await fetchNotifications();
    }
  };

  return (
    <>
      <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="custom-navbar">
        <Container fluid>
          <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center custom-navbar-brand">
            <Image
              src={logoInversur}
              height="65"
              alt="Inversur Logo"
              className="custom-logo"
            />
          </BootstrapNavbar.Brand>
         {/* <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />*/}
          {/*<BootstrapNavbar.Collapse id="basic-navbar-nav">*/}
            <Nav className="me-auto custom-nav-links">
              {currentEntity && currentEntity.type === 'usuario' && currentEntity.data.rol === 'Administrador' && (
                <>
                  <Nav.Link as={Link} to="/users">Usuarios</Nav.Link>
                </>
              )}
              {currentEntity && currentEntity.type === 'usuario' && (
                <>
                  <Nav.Link as={Link} to="/cuadrillas">Cuadrillas</Nav.Link>
                  <Nav.Link as={Link} to="/sucursales">Sucursales</Nav.Link>
                </>
              )}
              {currentEntity && (
                <>
                  <Nav.Link as={Link} to="/mantenimientos-preventivos">Mantenimientos Preventivos</Nav.Link>
                  <Nav.Link as={Link} to="/mantenimientos-correctivos">Mantenimientos Correctivos</Nav.Link>
                  <Nav.Link /*as={Link} to="/mapas"*/>Mapa</Nav.Link>
                </>
              )}
              {currentEntity && currentEntity.type === 'usuario' && currentEntity.data.rol === 'Administrador' && (
                <>
                  <Nav.Link /*as={Link} to="/reportes"*/>Reportes</Nav.Link>
                </>
              )}
            </Nav>
            <Nav className="nav-right">
              <Nav.Link onClick={handleShowNotifications} aria-label="Notificaciones">
                <div className="icon-container">
                  <FaUser size={22} className="icon-user" />
                  <FaRegBell size={14} className="icon-bell" />
                </div>
                {unreadCount > 0 && (
                  <span className="notification-count">
                    {unreadCount}
                  </span>
                )}
              </Nav.Link>
            </Nav>
          {/*</BootstrapNavbar.Collapse>*/}
        </Container>
      </BootstrapNavbar>

      <Modal show={showNotifications} onHide={handleCloseNotifications} centered>
        <Modal.Header closeButton>
          <Modal.Title>Notificaciones</Modal.Title>
          <Button 
              variant="warning" 
              onClick={handleDeleteAllNotifications} 
              className="mb-3"
            >
              Eliminar todas las notificaciones
          </Button>
        </Modal.Header>
        <Modal.Body>
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div 
                key={index} 
                onClick={() => handleClick(notification)} 
                className="mb-3 p-2 border-bottom hover:bg-gray-100 p-2 rounded d-flex align-items-center"
              >
                <div className="flex-grow-1">
                  <p className="mb-1">{notification.mensaje}</p>
                  <small className="text-muted">
                    {timeAgo(notification.created_at)}
                  </small>
                </div>
                {!notification.leida && (
                  <span 
                    className="bg-warning rounded-circle"
                    style={{ width: '10px', height: '10px', marginLeft: '10px' }}
                  ></span>
                )}
              </div>
            ))
          ) : (
            <p>No tienes notificaciones.</p>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="danger" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
          <Button variant="secondary" onClick={handleCloseNotifications}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Navbar;
