import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Image, Modal, Button } from 'react-bootstrap';
import logoInversur from '../assets/logo_inversur.png';
import { FaRegBell, FaUser } from 'react-icons/fa';
import '../styles/navbar.css';

const Navbar = () => {
  const [showNotifications, setShowNotifications] = useState(false);

  const handleShowNotifications = () => setShowNotifications(true);
  const handleCloseNotifications = () => setShowNotifications(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const notifications = [
    { id: 1, message: 'Nueva obra asignada a Cuadrilla #1', time: 'Hace 5 minutos' },
    { id: 2, message: 'Mantenimiento preventivo programado', time: 'Hace 1 hora' },
    { id: 3, message: 'Usuario Juan Pérez actualizó su perfil', time: 'Hace 2 horas' },
  ];

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
              <Nav.Link /*as={Link} to="/users"*/>Usuarios</Nav.Link>
              <Nav.Link as={Link} to="/sucursales">Sucursales</Nav.Link>
              <Nav.Link /*as={Link} to="/cuadrillas"*/>Cuadrillas</Nav.Link>
              <Nav.Link /*as={Link} to="/preventivos"*/>Preventivos</Nav.Link>
              <Nav.Link /*as={Link} to="/mantenimientos-preventivos"*/>Mantenimientos Preventivos</Nav.Link>
              <Nav.Link /*as={Link} to="/mantenimientos-correctivos"*/>Mantenimientos Correctivos</Nav.Link>
              <Nav.Link /*as={Link} to="/mapas"*/>Mapa</Nav.Link>
              <Nav.Link /*as={Link} to="/reportes"*/>Reportes</Nav.Link>
            </Nav>
            <Nav className="nav-right">
              <Nav.Link onClick={handleShowNotifications}>
                <div className="icon-container">
                  <FaUser size={22} className="icon-user" />
                  <FaRegBell size={14} className="icon-bell" />
                </div>
              </Nav.Link>
            </Nav>
          {/*</BootstrapNavbar.Collapse>*/}
        </Container>
      </BootstrapNavbar>

      <Modal show={showNotifications} onHide={handleCloseNotifications} centered>
        <Modal.Header closeButton>
          <Modal.Title>Notificaciones</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div key={notification.id} className="mb-3 p-2 border-bottom">
                <p className="mb-1">{notification.message}</p>
                <small className="text-muted">{notification.time}</small>
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
