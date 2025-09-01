import React from "react"
import { Link } from "react-router-dom"
import { Navbar as BootstrapNavbar, Nav, Container, Image, Modal, Button } from "react-bootstrap"
import logoInversur from "../assets/logo_inversur.png"
import { FaBell, FaTimes } from "react-icons/fa"
import useNotifications from "../hooks/useNotifications"
import "../styles/navbar.css"

const Navbar = () => {
  const { 
    notifications, 
    unreadCount, 
    showNotifications, 
    handleShowNotifications, 
    handleCloseNotifications, 
    handleLogout, 
    timeAgo, 
    handleClick, 
    handleDeleteNotification, 
    handleMarkAllAsRead, 
    handleDeleteReadNotifications 
  } = useNotifications()

  const renderNotification = (notification, index) => (
    <div
      key={index}
      onClick={() => handleClick(notification)}
      className={`mb-2 p-3 border rounded hover:bg-gray-50 cursor-pointer d-flex align-items-start ${
        notification.tipo === "correctivo" ? "border-theme-secondary" : "border-theme-primary"
      }`}
    >
      <div className="flex-grow-1">
        <div className="d-flex align-items-center mb-1">
          <span
            className={`badge me-2 text-white ${
              notification.tipo === "correctivo" ? "badge-theme-secondary" : "badge-theme-primary"
            }`}
            style={{ fontSize: "10px" }}
          >
            {notification.tipo === "correctivo" ? "CORRECTIVO" : "PREVENTIVO"}
          </span>
          {!notification.leida && <span className="rounded-circle" />}
        </div>
        <p className="mb-1 text-dark">{notification.mensaje}</p>
        <small className="text-muted">{timeAgo(notification.created_at)}</small>
      </div>

      <Button
        aria-label="Eliminar notificación"
        className="btn-delete-theme ms-2"
        size="sm"
        onClick={(e) => handleDeleteNotification(notification.id, e)}
      >
        <FaTimes size={12} />
      </Button>
    </div>
  )

  return (
    <>
      <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="custom-navbar">
        <Container fluid>
          <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center custom-navbar-brand">
            <Image src={logoInversur} alt="Inversur Logo" className="custom-logo" />
          </BootstrapNavbar.Brand>
          <Nav className="nav-right">
            <Nav.Link onClick={handleShowNotifications} aria-label="Notificaciones" data-testid="notif-btn">
              <div className="notification-icon">
                <FaBell size={24} color="#fff" />
                {unreadCount > 0 && <span className="notification-counter">{unreadCount}</span>}
              </div>
            </Nav.Link>
          </Nav>
        </Container>
      </BootstrapNavbar>

      <Modal show={showNotifications} onHide={handleCloseNotifications} centered aria-labelledby="notif-title">
        <Modal.Header closeButton>
          <Modal.Title id="notif-title" as="h2" className="w-100 text-center">
            Notificaciones
          </Modal.Title>
        </Modal.Header>

        <div className="d-flex justify-content-center gap-3 px-3 mt-2 mb-2">
          <Button
            className="btn-outline-theme-primary d-flex align-items-center gap-2 px-3 py-2"
            onClick={handleMarkAllAsRead}
            title="Marcar todas como leídas"
          >
            <i className="bi bi-check2-all"></i>
            <span className="d-none d-sm-inline">Marcar leídas</span>
          </Button>
          <Button
            className="btn-outline-theme-secondary d-flex align-items-center gap-2 px-3 py-2"
            onClick={handleDeleteReadNotifications}
            title="Eliminar notificaciones leídas"
          >
            <i className="bi bi-trash3"></i>
            <span className="d-none d-sm-inline">Eliminar leídas</span>
          </Button>
        </div>

        <Modal.Body style={{ maxHeight: "400px", overflowY: "auto" }}>
          {notifications.length > 0 ? (
            <div>{notifications.map((notification, index) => renderNotification(notification, index))}</div>
          ) : (
            <div className="text-center py-4">
              <FaBell size={48} className="text-muted mb-3" />
              <p className="text-muted">No tienes notificaciones.</p>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between">
          <Button className="btn-theme-secondary" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
          <Button variant="secondary" onClick={handleCloseNotifications}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default Navbar
